import { run_on_host } from './run-on-host'

import type { Settings } from './cli'

const make_options = (cwd: string, settings: Settings) => ({
  cwd: cwd,
  user: settings.user,
  docker: settings.docker
})

const compose_build = (settings: Settings, cwd: string, env_file?: string) => {

  const command = env_file !== undefined
    ? `docker-compose --env-file ${env_file} build`
    : `docker-compose build`

  return run_on_host(command, make_options(cwd, settings))
}

const compose_restart = (settings: Settings, cwd: string, env_file?: string) => {

  const command = env_file !== undefined
    ? `docker-compose --env-file ${env_file} up -d`
    : `docker-compose up -d`

  return run_on_host(command, make_options(cwd, settings))
}

const git_pull = (settings: Settings, cwd: string) => {

  return run_on_host('git pull', make_options(cwd, settings))
}

export {
  compose_build,
  compose_restart,
  git_pull
}
