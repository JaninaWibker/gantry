import { Either, isLeft, map } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import { build_object_from_paths } from '$/util/paths'

import { container_config, any } from '$/types/ContainerConfig'
import type { ContainerConfig, GantryContainer } from '$/types/ContainerConfig'
import { ContainerInfo } from 'dockerode'

/**
 * Creates a GantryContainer object for each valid container, this consists of the config for the container (as described by its labels) and some general container information
 * The return value is Either<E, A> | undefined
 *
 * Containers which aren't tracked by gantry return undefined,
 * Containers with an invalid config produce an Error (E)
 * Containers which are valid produce a GantryContainer (A)
 */
const build_config_from_labels = (labels: Record<string, string>, container: GantryContainer['container']): Either<D.DecodeError, GantryContainer> | undefined => {

  const combine_with_container = (config: ContainerConfig) => ({ container, config })

  const label_entries = Object.entries(labels)
    .filter(([key]) => key.startsWith('gantry.'))
    .map(([key, value]) => ({ key: key.split('.'), value: value }))

  const unchecked_config = build_object_from_paths(label_entries)

  const maybe_tracked_config = D.struct({ gantry: D.intersect(D.struct({ enable: D.literal('true') }))(any) }).decode(unchecked_config)

  // container doesn't have "enable"-label set to true or the container is not tracked at all
  if(isLeft(maybe_tracked_config)) return undefined

  const decoded_config = container_config.decode(maybe_tracked_config.right.gantry)

  return map(combine_with_container)(decoded_config)
}

/**
 * Builds a GantryContainer object (which consists of ContainerConfig and some additional container information) for each container that:
 * - is running
 * - has `"gantry.enable=true"` set
 * - has a valid gantry configuration
 *
 * Other containers are either skipped or receive a DecodeError (only if the configuration is invalid)
 */
const get_configs = (containers: Pick<ContainerInfo, 'Labels' | 'Id' | 'Image' | 'ImageID' | 'State'>[]): Either<D.DecodeError, GantryContainer>[] =>
  containers
    .filter(container => container.State === 'running')
    .map(container => build_config_from_labels(container.Labels, { id: container.Id, image: { name: container.Image, id: container.ImageID }, state: container.State }))
    .filter(config => config !== undefined) as Either<D.DecodeError, GantryContainer>[]

export {
  build_config_from_labels,
  get_configs
}
