import Docker from 'dockerode'
import { build_object_from_paths } from '$/util/paths'
import { isLeft } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'

import { container_config, any } from '$/types/ContainerConfig'
import type { ContainerConfig } from '$/types/ContainerConfig'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })


docker.listContainers()
  .then(containers => containers.map(container => {
    const label_entries = Object.entries(container.Labels)
      .filter(([key]) => key.startsWith('harbor.'))
      .map(([key, value]) => ({ key: key.split('.'), value: value }))

    return build_object_from_paths(label_entries)
  }))
  .then(configs => {
    configs.map(config => {
      const outer_result = D.struct({ harbor: any }).decode(config)
      if(isLeft(outer_result)) {
        console.log(D.draw(outer_result.left))
      } else {
        const result = container_config.decode(outer_result.right.harbor)
        if(isLeft(result)) {
          console.log(D.draw(result.left))
        } else {
          const actual_config: ContainerConfig = result.right
          console.log(actual_config)
        }
      }
    })
  })
