import type { Register } from 'claude-code'

const PANE = 'ccs'
const RESTART = 'ccs-restart'
const DEFAULT = '__default__'

type Profiles = Record<string, { url: string; token: string }>

async function files($: any) {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  return { profiles: `${home}/.claude/profiles.json`, settings: `${home}/.claude/settings.json` }
}

async function load($: any, f: string) {
  try { return JSON.parse(await $.fs.read(f)) } catch { return {} }
}

function nameOf(profiles: Profiles, url?: string, token?: string) {
  const name = Object.keys(profiles).find(n => profiles[n].url === url && profiles[n].token === token)
  return name ?? (url ? `custom (${url})` : 'default login')
}

async function runningProfile($: any) {
  const profiles: Profiles = await load($, (await files($)).profiles)
  return nameOf(profiles, await $.env.get('ANTHROPIC_BASE_URL'), await $.env.get('ANTHROPIC_AUTH_TOKEN'))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'ccs', description: 'Switch Claude Code endpoint profile' })
    return next(e)
  })

  on('command.run', { command: 'ccs' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Claude Code endpoint', focus: true, closeOnEscape: true, rows: 9 })
    return { text: `Active: ${await runningProfile($)}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Select } = $.ui.resolve(e)
    const f = await files($)
    const profiles: Profiles = await load($, f.profiles)
    const url = await $.env.get('ANTHROPIC_BASE_URL')
    const token = await $.env.get('ANTHROPIC_AUTH_TOKEN')
    const names = Object.keys(profiles)
    const active = names.find(n => profiles[n].url === url && profiles[n].token === token)
    const options = [
      ...names.map(n => ({ value: n, label: `${n}  (${profiles[n].url})${n === active ? '  [active]' : ''}` })),
      { value: DEFAULT, label: `Default (Anthropic login)${!url ? '  [active]' : ''}` },
    ]

    const pick = async (value: string) => {
      const settings = await load($, f.settings)
      settings.env = settings.env ?? {}
      if (value === DEFAULT) {
        delete settings.env.ANTHROPIC_BASE_URL
        delete settings.env.ANTHROPIC_AUTH_TOKEN
      } else {
        settings.env.ANTHROPIC_BASE_URL = profiles[value].url
        settings.env.ANTHROPIC_AUTH_TOKEN = profiles[value].token
      }
      await $.fs.write(f.settings, JSON.stringify(settings, null, 2) + '\n')
      await $.ui.close({ id: PANE })
      await $.ui.open({ id: RESTART, title: 'Restart to apply?', focus: true, closeOnEscape: true, rows: 7 })
    }

    return (
      <Box flexDirection="column">
        <Select key="profile" autoFocus options={options} value={active ?? (url ? undefined : DEFAULT)} onSelect={pick} />
        <Text>Active: {active ?? (url ? `custom (${url})` : 'default login')}</Text>
        <Text dimColor>up/down + enter to switch, esc to close</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: RESTART }, async ($, e) => {
    const { Box, Text, Select } = $.ui.resolve(e)
    const choose = async (value: string) => {
      await $.ui.close({ id: RESTART })
      if (value === 'now') await $.command.run({ command: 'restart' })
    }

    return (
      <Box flexDirection="column">
        <Text>Restart to apply the new profile?</Text>
        <Select
          key="restart"
          autoFocus
          value="later"
          options={[
            { value: 'later', label: 'Later' },
            { value: 'now', label: 'Now (exit and resume this session)' },
          ]}
          onSelect={choose}
        />
      </Box>
    )
  })
}
