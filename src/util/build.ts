import { compose_build, compose_restart, git_pull } from '$/util/docker-compose'

import type { BuildTypes, GantryContainer, WebhookTypesRaw } from '$/types/ContainerConfig'
import type { Settings } from './cli'

const handle_docker_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: GantryContainer<WebhookType, BuildTypes['docker']>): Promise<void> => {

  const config = container.config.build

  return Promise.resolve()
    .then(() => git_pull(settings, config.git_repo))
    .then(() => compose_build(settings, config.working_directory, config.env_file || undefined))
    .then(() => compose_restart(settings, config.working_directory, config.env_file || undefined))
}

const handle_ansible_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: GantryContainer<WebhookType, BuildTypes['ansible']>): Promise<void> => {

  const config = container.config.build
  console.log(container, config)

  return Promise.resolve()
}

const handle_command_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: GantryContainer<WebhookType, BuildTypes['command']>): Promise<void> => {

  const config = container.config.build
  console.log(container, config)

  return Promise.resolve()
}

const handle_build = <WebhookType extends WebhookTypesRaw>(settings: Settings, container: GantryContainer<WebhookType>): Promise<GantryContainer<WebhookType>> => {
  switch(container.config.build.method) {
    case 'docker':  return handle_docker_build(settings, container as GantryContainer<WebhookType, BuildTypes['docker']>).then(() => container)
    case 'ansible': return handle_ansible_build(settings, container as GantryContainer<WebhookType, BuildTypes['ansible']>).then(() => container)
    case 'command': return handle_command_build(settings, container as GantryContainer<WebhookType, BuildTypes['command']>).then(() => container)
    default:
      throw new Error(`unknown build method ${(container.config.build as { method: string }).method} found`)
  }
}

export {
  handle_build
}
