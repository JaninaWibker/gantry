import Docker from 'dockerode'
import { get_configs } from '$/util/config'
import { isLeft } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'

const args = process.argv
const mode = args[0]
const poll_interval = 30 // TODO: this will become an ENV-variable soon

const setup = () => Promise.resolve(undefined)
const update_hooks = () => console.log('updating hooks..')
const spawn_webhook = () => console.log('spawning webhook..')

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

switch(mode) {
  case 'watch': {
    setup()                // TODO: do setup work
      .then(update_hooks)  // TODO: create hooks.json file once
      .then(spawn_webhook) // TODO: launch webhook
    setInterval(           // TODO: check for updates every <poll_interval> seconds
      update_hooks,        // TODO: update hooks.json if neeeded
      poll_interval * 1000
    )
  } break
  case 'action': {
    // TODO: handle action
  } break
  default: {
    // TODO: output some kind of error
  }
}

docker.listContainers()
  .then(get_configs)
  .then(configs => configs.map(maybe_config => {
    if(isLeft(maybe_config)) {
      console.log(D.draw(maybe_config.left))
    } else {
      console.log(maybe_config.right)
    }
  }))
