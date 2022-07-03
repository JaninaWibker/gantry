import path from 'path'
import type Dockerode from 'dockerode'
import { GantrySettings } from '$/types/ContainerConfig'

const DOCKER_SETTINGS = (cwd: string) => ({
  AutoRemove: true,
  privileged: true,
  NetworkMode: 'host',
  pidMode: 'host',
  ipcMode: 'host',
  // Tty: false,
  Mounts: [{
    Type: 'bind',
    Source: '/',
    Target: '/host',
    ReadOnly: false,
    Consistency: 'default'
  }, {
    Type: 'bind',
    Source: path.join(cwd, 'in-busybox.sh'),
    Target: '/in-busybox.sh',
    ReadOnly: true,
    Consistency: 'default'
  }]
})

const run_on_host = (settings: GantrySettings, command: string, { cwd, user, docker }: { cwd: string, user: string, docker: Dockerode }) => {

  // make sure the username is nothing but letters and numbers
  const clean_user = user.replace(/[^a-zA-Z0-9]/g, '')

  if(clean_user == '') {
    return Promise.reject(new Error('invalid username'))
  }

  const clean_cwd = path.normalize(cwd)

  // TODO: depending on verbosity use process.stdout or something else
  // [process.stdout, process.stderr]
  return docker.run('busybox', ['sh', 'in-busybox.sh', clean_user, clean_cwd, command], process.stdout, {
    name: 'execute-on-host',
    HostConfig: DOCKER_SETTINGS(settings.cwd)
  })
}

export {
  run_on_host
}
