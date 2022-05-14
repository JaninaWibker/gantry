import Docker from 'dockerode'
import { build_config_from_labels } from '$/util/config'
import { Either, isLeft } from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'
import type { ContainerConfig } from '$/types/ContainerConfig'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

docker.listContainers()
  .then(containers => containers
    .map(container => build_config_from_labels(container.Labels))
    .filter(config => config !== undefined) as Either<D.DecodeError, ContainerConfig>[])
  .then(configs => configs.map(maybe_config => {
    if(isLeft(maybe_config)) {
      console.log(D.draw(maybe_config.left))
    } else {
      console.log(maybe_config.right)
    }
  }))
