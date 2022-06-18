import path from 'path'
import { spawn } from 'child_process'
import { write_json_if_differ } from '$/util/fs'
import type { GantryContainer, WebhookTypes } from '$/types/ContainerConfig'

const COMMAND_WORKING_DIRECTORY = path.join(process.cwd(), 'runtime')
const WEBHOOKS_EXECUTABLE = path.join(COMMAND_WORKING_DIRECTORY, 'webhook')
const HOOKS_FILE = path.join(process.cwd(), 'runtime', 'hooks.json')

const generate_github_hook = (container: GantryContainer<WebhookTypes['github']>): object => {

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
    'pass-arguments-to-command': [
      { // container id
        source: 'string',
        name: container.container.id
      },
      { // ref
        source: 'payload',
        name: 'ref'
      },
      { // commit (id)
        source: 'payload',
        name: 'head_commit.id'
      },
      { // commit (message)
        source: 'payload',
        name: 'head_commit.message'
      },
      { // author (fullname)
        source: 'payload',
        name: 'pusher.full_name'
      },
      { // author (username)
        source: 'payload',
        name: 'pusher.username'
      },
      { // author (email)
        source: 'payload',
        name: 'pusher.email'
      }
    ],
    'trigger-rule': {
      and: [
        signature_check(container.config.webhook.secret),
        { or: branch_check(container.config.repo?.branches || []) }
      ]
    }
  }
}

const generate_gitea_hook = (container: GantryContainer<WebhookTypes['gitea']>): object => {
  // gitea and github actually have very similar webhooks, if any changes are to
  // be found, can later on still just replace this with its own hook generation.
  return generate_github_hook(container as unknown as GantryContainer<WebhookTypes['github']>)
}

const generate_webhook_config = (container: GantryContainer): object => {
  switch (container.config.webhook.method) {
    case 'github': return generate_github_hook(container as GantryContainer<WebhookTypes['github']>)
    case 'gitea': return generate_gitea_hook(container as GantryContainer<WebhookTypes['gitea']>)
    default:
      throw new Error(`unknown webhook method ${(container.config.webhook as { method: string }).method} found`)
  }
}

const update_webhooks = (containers: GantryContainer[]) => {
  const hooks = containers.map(generate_webhook_config)

  return write_json_if_differ(HOOKS_FILE, hooks)
}

const spawn_webhook = () => {
  // TODO: should this be verbose and should the port be configurable?
  const child = spawn(WEBHOOKS_EXECUTABLE, ['-hooks', 'hooks.json', '-port', '8000', '-verbose'], { cwd: COMMAND_WORKING_DIRECTORY })

  child.on('exit', (code, signal) => {
    console.log(`[gantry] webhook quit with exit code ${code} and signal ${signal}`)
  })

  child.stdout.on('data', data => console.log(data.toString()))
  child.stderr.on('data', data => console.error(data.toString()))
}

export {
  generate_webhook_config,
  update_webhooks,
  spawn_webhook,
}
