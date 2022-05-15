export type Settings = {
  poll_interval: number,
  ignore_not_running: boolean
}

const handle_arguments = ({ on_watch, on_action }: { on_watch: (settings: Settings) => any, on_action: (settings: Settings, args: string[]) => any }) => {
  const [_node, _pwd, mode, ...args] = process.argv

  // TODO: harbor should look at it's own docker labels (or use some defaults when not running inside docker) for settings
  const DEFAULT_SETTINGS = {
    poll_interval: 30,
    ignore_not_running: false
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
