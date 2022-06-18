import Docker from 'dockerode'
import { get_configs, build_config_from_labels } from '$/util/config'
import { handle_arguments } from '$/util/cli'
import { isLeft, isRight } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import { update_webhooks, spawn_webhook } from '$/util/webhook'
import { handle_build } from '$/util/build'

import type { Settings } from '$/util/cli'
import type { GantryContainer } from './types/ContainerConfig'

const update_hooks = (docker: Docker, settings: Settings) => docker.listContainers()
  .then(get_configs)
  .then(containers => {
    const erroneous_containers = containers.filter(isLeft).map(container => container.left)
    const valid_containers     = containers.filter(isRight).map(container => container.right)

    if(settings.verbose) { erroneous_containers.map(container => console.log('[gantry] ' + D.draw(container))) }

    return update_webhooks(valid_containers)
      .then((did_update: boolean) => {
        if(did_update) console.log('[gantry] successfully updated hooks.json file')
      })
  })

const print_job_started = (args: string[], config: GantryContainer) => {
  const [container_id, branch_ref, commit_id, commit_message, author_fullname, author_username, author_email] = args

  console.log(`[gantry] redeploying ${config.config.name} (received from ${config.config.webhook.method}; redeploying using ${config.config.build.method})
container_id: ${container_id}
branch_ref:   ${branch_ref}
commit_id:    ${commit_id}
commit_msg:   ${commit_message.trim()}
author:       ${author_fullname || author_username} (${author_email})
    `.trim())

  return config
}

const print_job_success = (args: string[], config: GantryContainer) => {
  console.log(`[gantry] successfully redeployed ${config.config.name} (container: ${config.container.id})`)
}

const print_job_failure = (error: Error) => {
  console.error('[gantry] error: ' + error.message)
}

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

handle_arguments(docker, {
  on_watch: (settings: Settings) => {
    update_hooks(docker, settings)
      .then(spawn_webhook)

    setInterval(
      () => update_hooks(docker, settings),
      settings.poll_interval * 1000
    )
  },
  on_action: (settings: Settings, args: string[]) => {
    const [container_id] = args

    const config = docker.listContainers()
      .then(containers => containers.find(container => container.Id === container_id))
      .then(container => {
        if(container === undefined) throw Error(`container ${container_id} not found`)
        else return container
      })
      .then(container => build_config_from_labels(container.Labels, { id: container.Id, image: { name: container.Image, id: container.ImageID }, state: container.State }))
      .then(container => {
        if(container === undefined || isLeft(container)) {
          throw new Error(`container ${container_id} not tracked or has invalid gantry config`)
        }
        return container.right
      })

    config
      .then(config => print_job_started(args, config))
      .then(config => handle_build(settings, config))
      .then(config => print_job_success(args, config))
      .catch((error: Error) => print_job_failure(error))
  }
})
