import path from 'path'
import { write_json_if_differ } from '$/util/fs'
import type { HarborContainer } from '$/types/ContainerConfig'

const COMMAND_WORKING_DIRECTORY = path.join(process.cwd(), 'runtime')
const HOOKS_FILE = path.join(process.cwd(), 'runtime', 'hooks.json')

const generate_github_hook = (container: HarborContainer): object => {

  const signature_check = (secret: string) => ({
    match: {
      type: 'payload-hmac-sha1',
      secret: secret,
      parameter: {
        source: 'header',
        name: 'X-Hub-Signature'
      }
    }
  })

  const branch_check = (branches: string[]) => branches.map(branch => ({
    match: {
      type: 'value',
      value: `refs/heads/${branch}`,
      parameter:
      {
        source: 'payload',
        name: 'ref'
      }
    }
  }))

  return {
    'id': `redeploy-${container.config.name}`,
    'execute-command': 'on-action.sh',
    'command-working-directory': COMMAND_WORKING_DIRECTORY,
    'pass-arguments-to-command': [ // TODO: what arguments are needed for 'action'?

    ],
    'trigger-rule': {
      and: [
        signature_check(container.config.webhook.secret),
        { or: branch_check(container.config.repo?.branches || []) }
      ]
    }
  }
}

const generate_gitea_hook = (container: HarborContainer): object => {
  // gitea and github actually have very similar webhooks, if any changes are to
  // be found, can later on still just replace this with its own hook generation.
  return generate_github_hook(container)
}

const generate_webhook_config = (container: HarborContainer): object => {
  switch (container.config.webhook.method) {
    case 'github': return generate_github_hook(container)
    case 'gitea': return generate_gitea_hook(container)
    default:
      throw new Error(`unknown webhook method ${(container.config.webhook as { method: string }).method} found`)
  }
}

const update_webhooks = (containers: HarborContainer[]) => {
  const hooks = containers.map(generate_webhook_config)

  write_json_if_differ(HOOKS_FILE, hooks)

}

export {
  generate_webhook_config,
  update_webhooks,
}
