import Docker from 'dockerode'
import { get_configs } from '$/util/config'
import { handle_arguments } from '$/util/cli'
import { isLeft, isRight } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import { generate_webhook_config, update_webhooks } from '$/util/webhook'

import type { Settings } from '$/util/cli'

const setup = () => Promise.resolve(undefined)
const update_hooks = (docker: Docker, settings: Settings) => docker.listContainers()
  .then(get_configs)
  .then(containers => {
    const erroneous_containers = containers.filter(isLeft).map(container => container.left)
    const valid_containers     = containers.filter(isRight).map(container => container.right)

    if(settings.verbose) { erroneous_containers.map(container => console.log(D.draw(container))) }

    update_webhooks(valid_containers)
  })

const spawn_webhook = () => console.log('spawning webhook..')

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

handle_arguments({
  on_watch: (settings: Settings) => {
    setup()                                             // TODO: do setup work
      .then(update_hooks.bind(this, docker, settings))  // TODO: create hooks.json file once
      .then(spawn_webhook)                              // TODO: launch webhook
    // setInterval(                                        // TODO: check for updates every <poll_interval> seconds
    //   update_hooks.bind(this, docker, settings),        // TODO: update hooks.json if neeeded
    //   settings.poll_interval * 1000
    // )
  },
  on_action: (settings: Settings, args: string[]) => {
    console.log(args)
  }
})

docker.listContainers()
  .then(get_configs)
  .then(containers => containers.map(maybe_container => {
    if(isLeft(maybe_container)) {
      console.log(D.draw(maybe_container.left))
    } else {
      const container = maybe_container.right
      console.log(container)
      console.log(JSON.stringify(generate_webhook_config(container), null, 2))
    }
  }))
