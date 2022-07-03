import type Dockerode from 'dockerode'
import type { GantrySettings } from '$/types/ContainerConfig'

export type Settings = GantrySettings & {
  docker: Dockerode
}

const handle_arguments = (docker: Dockerode, get_settings: (docker: Dockerode) => Promise<GantrySettings>, { on_watch, on_action }: { on_watch: (settings: Settings) => any, on_action: (settings: Settings, args: string[]) => any }) => {
  const [/* _node */, /* _pwd */, mode, ...args] = process.argv

  return get_settings(docker)
    .then(settings => {
      switch(mode) {
        case 'watch':  return on_watch({ ...settings, docker: docker })
        case 'action': return on_action({ ...settings, docker: docker }, args)
        default:       throw new Error('No command line options supplied, should be either "watch" or "action"')
      }
    })
    .catch(error => console.error(`[gantry] error: ${error.message}`))
}

export {
  handle_arguments
}
