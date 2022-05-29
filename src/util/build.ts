import { compose_build, compose_restart } from '$/util/docker-compose'
import type { BuildTypes, HarborContainer, WebhookTypesRaw } from '$/types/ContainerConfig'

const handle_docker_build = <WebhookType extends WebhookTypesRaw>(container: HarborContainer<WebhookType, BuildTypes['docker']>) => {
  console.log('are we even here?', container)
  // okay what do we have?
  // we need to clone first!!!
  // we have a current working directory and basically need to run docker-compose build and docker-compose up -d (maybe including an env file?)
  // that is something that can be done quite easily i'd say
  return Promise.resolve()
    .then(() => compose_build(container.config.build.working_directory))
    .then((data) => (console.log(data), compose_restart(container.config.build.working_directory)))
    .then(data => console.log(data))
    .catch(err => console.log(err))
}

const handle_ansible_build = <WebhookType extends WebhookTypesRaw>(container: HarborContainer<WebhookType, BuildTypes['ansible']>) => {
  console.log(container)
  return Promise.resolve()
}

const handle_command_build = <WebhookType extends WebhookTypesRaw>(container: HarborContainer<WebhookType, BuildTypes['command']>) => {
  console.log(container)
  return Promise.resolve()
}

const handle_build = <WebhookType extends WebhookTypesRaw>(container: HarborContainer<WebhookType>): Promise<any> => {
  switch(container.config.build.method) {
    case 'docker':  return handle_docker_build(container as HarborContainer<WebhookType, BuildTypes['docker']>)
    case 'ansible': return handle_ansible_build(container as HarborContainer<WebhookType, BuildTypes['ansible']>)
    case 'command': return handle_command_build(container as HarborContainer<WebhookType, BuildTypes['command']>)
    default:
      throw new Error(`unknown build method ${(container.config.build as { method: string }).method} found`)
  }
}

export {
  handle_build
}
