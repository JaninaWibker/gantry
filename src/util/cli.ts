import type Dockerode from 'dockerode'

export type Settings = {
  poll_interval: number,
  ignore_not_running: boolean,
  verbose: boolean,
  docker: Dockerode,
  user: string
}

const handle_arguments = (docker: Dockerode, { on_watch, on_action }: { on_watch: (settings: Settings) => any, on_action: (settings: Settings, args: string[]) => any }) => {
  const [/* _node */, /* _pwd */, mode, ...args] = process.argv

  // TODO: gantry should look at it's own docker labels (or use some defaults when not running inside docker) for settings
  const DEFAULT_SETTINGS = {
    poll_interval: 30,
    ignore_not_running: false,
    verbose: true, // TODO: this shouldn't be the default
    docker: docker,
    user: '1000' // TODO: THIS MOST DEF. SHOULDN'T BE ANY KIND OF DEFAULT
  }

  switch(mode) {
    case 'watch':  return on_watch(DEFAULT_SETTINGS)
    case 'action': return on_action(DEFAULT_SETTINGS, args)
    default:       // TODO: some kind of error output
  }
}

export {
  handle_arguments
}
