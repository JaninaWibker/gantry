import * as D from 'io-ts/Decoder'
import { pipe } from 'fp-ts/function'

const any: D.Decoder<unknown, unknown> = { decode: value => D.success(value) }

const string_array: D.Decoder<unknown, string[]> = pipe(
  D.string,
  D.parse(s => D.success(s.split(',')))
)

const default_value = <Type>(decoder: D.Decoder<unknown, Type>, value: Type): D.Decoder<unknown, Type> => ({
  decode: (input: unknown) => input === undefined ? D.success(value) : decoder.decode(input)
})

const boolean_from_string: D.Decoder<unknown, boolean> = pipe(
  D.string,
  D.parse(s => s === 'true' ? D.success(true) : s === 'false' ? D.success(false) : D.failure(s, '"true" or "false"'))
)

const number_from_string: D.Decoder<unknown, number> = pipe(
  D.string,
  D.parse(s => !Number.isNaN(parseInt(s, 10))
    ? D.success(parseInt(s))
    : D.failure(s, 'a base 10 number encoded as a string')
  )
)

const gantry_settings = D.struct({
  /**
   * user to use on host system for updating
   */
  user: D.string,
  /**
   * folder location where `in-busybox.sh` can be found
   */
  cwd: D.string,
  /**
   * logging verbosity
   */
  verbose: default_value(boolean_from_string, false),
  /**
   * interval (in seconds) for checking container labels
   */
  poll_interval: default_value(number_from_string, 30),
  /**
   * ignore stopped containers
   */
  ignore_not_running: default_value(boolean_from_string, true)
})

export type GantrySettings = D.TypeOf<typeof gantry_settings>

const container_build_config = D.union(
  /**
   * docker method:
   * pulls changes using git and then rebuilts containers using docker-compose build
   * */
  D.struct({ method: D.literal('docker'),  working_directory: D.string, git_repo: D.string, env_file: D.nullable(D.string) }),
  /**
   * ansible method:
   * runs the corresponding ansible playbook which in turn does all deployment related things such as pulling git repos, building containers and starting them
   */
  D.struct({ method: D.literal('ansible'), working_directory: D.string }), // TODO: which playbook, on which host, ...?
  /**
   * custom command:
   * just executes the custom command that is supplied (using a shell)
   */
  D.struct({ method: D.literal('command'), working_directory: D.string, command: D.string  }) // TODO: some kind of input arguments?
)

const container_webhook_config = D.union(
  /**
   * uses github webhooks
   */
  D.struct({ method: D.literal('github'), secret: D.string }),
  /**
   * uses gitea webhooks
   */
  D.struct({ method: D.literal('gitea'),  secret: D.string }),
)

const container_config = D.intersect(
  D.partial({
    /**
     * git repo data on which the project is based on
     */
    repo: D.struct({
      /**
       * list of branches to track (must be configured on the webhook providers side as well)
       */
      branches: string_array
    })
  })
)(
  D.struct({
    /**
     * name of the project
     */
    name: D.string,
    /**
     * deployment information
     */
    build: container_build_config,
    /**
     * webhook information
     */
    webhook: container_webhook_config
  })
)

type FromEntries<Entries extends { method: string }> = {
  [key in Entries['method']]: Entries extends { method: key } ? Entries : never
}

type Narrow<Source, Key extends string, New> = Source & {
  [key in Key]: New
}

export type BuildTypesRaw = D.TypeOf<typeof container_build_config>
export type WebhookTypesRaw = D.TypeOf<typeof container_webhook_config>

export type BuildTypes = FromEntries<BuildTypesRaw>
export type WebhookTypes = FromEntries<WebhookTypesRaw>

export type ContainerConfigRaw = D.TypeOf<typeof container_config>

export type ContainerConfig<
  NarrowWebhook extends WebhookTypesRaw = WebhookTypesRaw,
  NarrowBuild extends BuildTypesRaw = BuildTypesRaw
> = Narrow<Narrow<ContainerConfigRaw, 'webhook', NarrowWebhook>, 'build', NarrowBuild>

export type GantryContainer<
  NarrowWebhook extends WebhookTypesRaw = WebhookTypesRaw,
  NarrowBuild extends BuildTypesRaw = BuildTypesRaw> = {
  container: {
    id: string,
    image: {
      name: string,
      id: string
    },
    state: string
  },
  config: ContainerConfig<NarrowWebhook, NarrowBuild>
}

export {
  container_config,
  gantry_settings,
  any
}
