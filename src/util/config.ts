import { Either, isLeft } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import { build_object_from_paths } from '$/util/paths'

import { container_config, any } from '$/types/ContainerConfig'
import type { ContainerConfig } from '$/types/ContainerConfig'


const build_config_from_labels = (labels: Record<string, string>): Either<D.DecodeError, ContainerConfig> | undefined => {
  const label_entries = Object.entries(labels)
    .filter(([key]) => key.startsWith('harbor.'))
    .map(([key, value]) => ({ key: key.split('.'), value: value }))

  const unchecked_config = build_object_from_paths(label_entries)

  const maybe_tracked_config = D.struct({ harbor: D.intersect(D.struct({ enable: D.literal('true') }))(any) }).decode(unchecked_config)

  // container doesn't have enabled label set to true or is not tracked at all
  if(isLeft(maybe_tracked_config)) return undefined

  return container_config.decode(maybe_tracked_config.right.harbor)
}

export {
  build_config_from_labels
}
