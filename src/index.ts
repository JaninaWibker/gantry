import Docker from 'dockerode'
import { get_configs, build_config_from_labels } from '$/util/config'
import { handle_arguments } from '$/util/cli'
import { isLeft, isRight } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import { update_webhooks, spawn_webhook } from '$/util/webhook'

import type { Settings } from '$/util/cli'

const update_hooks = (docker: Docker, settings: Settings) => docker.listContainers()
  .then(get_configs)
  .then(containers => {
    const erroneous_containers = containers.filter(isLeft).map(container => container.left)
    const valid_containers     = containers.filter(isRight).map(container => container.right)

    if(settings.verbose) { erroneous_containers.map(container => console.log(D.draw(container))) }

    return update_webhooks(valid_containers)
      .then((did_update: boolean) => {
        if(did_update) console.log('successfully updated hooks.json file')
      })
  })

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

handle_arguments({
  on_watch: (settings: Settings) => {
    update_hooks(docker, settings)
      .then(spawn_webhook)

    setInterval(
      () => update_hooks(docker, settings),
      settings.poll_interval * 1000
    )
  },
  on_action: (settings: Settings, args: string[]) => {
    const [container_id, branch_ref, commit_id, commit_message, author_fullname, author_username, author_email] = args
    console.log('\n' + `
      container_id: ${container_id}
      branch_ref:   ${branch_ref}
      commit_id:    ${commit_id}
      commit_msg:   ${commit_message.trim()}
      author:       ${author_fullname || author_username} (${author_email})
    `.trim())
    const config = docker.listContainers()
      .then(containers => containers.find(container => container.Id === container_id))
      .then(container => {
        if(container === undefined) throw Error(`container ${container_id} not found`)
        else return container
      })
      .then(container => build_config_from_labels(container.Labels, { id: container.Id, image: { name: container.Image, id: container.ImageID }, state: container.State }))
      .then(container => {
        if(container === undefined || isLeft(container)) {
          throw new Error(`container ${container_id} not tracked or has invalid harbor config`)
        }
        return container.right
      })

    config
      .then(console.log)
  }
})

// docker.listContainers()
//   .then(get_configs)
//   .then(containers => containers.map(maybe_container => {
//     if(isLeft(maybe_container)) {
//       console.log(D.draw(maybe_container.left))
//     } else {
//       const container = maybe_container.right
//       console.log(container)
//     }
//   }))
