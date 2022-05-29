import { promisify } from 'util'
import { exec as raw_spawn } from 'child_process'

const DOCKER_COMPOSE = 'docker-compose'

const spawn = promisify(raw_spawn)

const compose_build = (cwd: string) => {
  console.log(`called with ${cwd}`)
  return spawn(`${DOCKER_COMPOSE} build`, { cwd: cwd })
}

const compose_restart = (cwd: string, env_file?: string) => {
  console.log(`called with ${cwd} and ${env_file}`)
  return env_file !== undefined
    ? spawn(`${DOCKER_COMPOSE} --env-file ${env_file} up -d`, { cwd: cwd })
    : spawn(`${DOCKER_COMPOSE} up -d`, { cwd: cwd })
}

export {
  compose_build,
  compose_restart
}
