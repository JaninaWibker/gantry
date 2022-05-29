import { run_on_host } from './run-on-host'

import type { Settings } from './cli'

const compose_build = (settings: Settings, cwd: string, env_file?: string) => {
  console.log(`compose_build called with ${cwd}`)

  const command = env_file !== undefined
    ? `docker-compose --env-file ${env_file} build`
    : `docker-compose build`

  return run_on_host(command, { cwd: cwd, user: settings.user, docker: settings.docker })
}

const compose_restart = (settings: Settings, cwd: string, env_file?: string) => {
  console.log(`compose_restart called with ${cwd} and ${env_file}`)


  const command = env_file !== undefined
    ? `docker-compose --env-file ${env_file} up -d`
    : `docker-compose up -d`

  return run_on_host(command, { cwd: cwd, user: settings.user, docker: settings.docker })
}

const git_pull = (settings: Settings, cwd: string) => run_on_host('git pull', { cwd: cwd, user: settings.user, docker: settings.docker })

export {
  compose_build,
  compose_restart,
  git_pull
}
