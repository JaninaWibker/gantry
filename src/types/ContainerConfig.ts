import * as D from 'io-ts/Decoder'
import { pipe } from 'fp-ts/function'

const any: D.Decoder<unknown, unknown> = { decode: value => D.success(value) }

const string_array: D.Decoder<unknown, string[]> = pipe(
  D.string,
  D.parse(s => D.success(s.split(',')))
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
    build: D.union(
      /**
       * docker method:
       * pulls changes using git and then rebuilts containers using docker-compose build
       * */
      D.struct({ method: D.literal('docker'),  working_directory: D.string }), // TODO: git related things?
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
    ),
    /**
     * webhook information
     */
    webhook: D.union(
      /**
       * uses github webhooks
       */
      D.struct({ method: D.literal('github'), secret: D.string }),
      /**
       * uses gitea webhooks
       */
      D.struct({ method: D.literal('gitea'),  secret: D.string }),
    )
  })
)

export type ContainerConfig = D.TypeOf<typeof container_config>

export type HarborContainer = {
  container: {
    id: string,
    image: {
      name: string,
      id: string
    },
    state: string
  },
  config: ContainerConfig
}

export {
  container_config,
  any
}
