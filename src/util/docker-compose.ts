import { run_on_host } from './run-on-host'

import type { Settings } from './cli'

const compose_build = (settings: Settings, cwd: string) => {
  console.log(`compose_build called with ${cwd}`)
  return run_on_host('docker-compose build', { cwd: cwd, user: settings.user, docker: settings.docker })
}

const compose_restart = (settings: Settings, cwd: string, env_file?: string) => {
  console.log(`compose_restart called with ${cwd} and ${env_file}`)
  return env_file !== undefined
    ? run_on_host(`docker-compose --env-file ${env_file} up -d`, { cwd: cwd, user: settings.user, docker: settings.docker })
    : run_on_host(`docker-compose up -d`, { cwd: cwd, user: settings.user, docker: settings.docker })
}

const git_pull = (settings: Settings, cwd: string) => run_on_host('git pull', { cwd: cwd, user: settings.user, docker: settings.docker })

export {
  compose_build,
  compose_restart,
  git_pull
}
