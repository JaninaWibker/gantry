import path from 'path'
import { compose_build, compose_restart, git_pull } from '$/util/docker-compose'

import type { BuildTypes, HarborContainer, WebhookTypesRaw } from '$/types/ContainerConfig'
import type { Settings } from './cli'

const handle_docker_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: HarborContainer<WebhookType, BuildTypes['docker']>) => {
  console.log(container)

  const config = container.config.build

  return Promise.resolve()
    .then(() => git_pull(settings, config.git_repo))
    .then(() => compose_build(settings, config.working_directory, config.env_file || undefined))
    .then(() => compose_restart(settings, config.working_directory, config.env_file || undefined))
    .catch(err => console.log(err))
}

const handle_ansible_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: HarborContainer<WebhookType, BuildTypes['ansible']>) => {
  console.log(container)
  return Promise.resolve()
}

const handle_command_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: HarborContainer<WebhookType, BuildTypes['command']>) => {
  console.log(container)
  return Promise.resolve()
}

const handle_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: HarborContainer<WebhookType>): Promise<any> => {
  switch(container.config.build.method) {
    case 'docker':  return handle_docker_build(settings, container as HarborContainer<WebhookType, BuildTypes['docker']>)
    case 'ansible': return handle_ansible_build(settings, container as HarborContainer<WebhookType, BuildTypes['ansible']>)
    case 'command': return handle_command_build(settings, container as HarborContainer<WebhookType, BuildTypes['command']>)
    default:
      throw new Error(`unknown build method ${(container.config.build as { method: string }).method} found`)
  }
}

export {
  handle_build
}
