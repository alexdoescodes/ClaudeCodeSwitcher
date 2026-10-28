
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const PANE = 'ccs'
const RESTART = 'ccs-restart'
const picked = atom({ plugin: 'ccs', key: 'msg' } as const, '')
const DEFAULT = '__default__'

type Profiles = Record<string, { url: string; token: string }>

async function files($: any) {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  return { profiles: `${home}/.claude/profiles.json`, settings: `${home}/.claude/settings.json` }
}

async function load($: any, f: string) {
  try { return JSON.parse(await $.fs.read(f)) } catch { return {} }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'ccs', description: 'Switch Claude Code endpoint profile' })
    return next(e)
  })

  on('command.run', { command: 'ccs' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Claude Code endpoint', focus: true, closeOnEscape: true, rows: 9 })
    return { text: '' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Select } = $.ui.resolve(e)
    const f = await files($)
    const profiles: Profiles = await load($, f.profiles)
    const env = (await load($, f.settings)).env ?? {}
    const names = Object.keys(profiles)
    const active = names.find(n => profiles[n].url === env.ANTHROPIC_BASE_URL && profiles[n].token === env.ANTHROPIC_AUTH_TOKEN)
    const options = [
      ...names.map(n => ({ value: n, label: `${n}  (${profiles[n].url})${n === active ? '  [active]' : ''}` })),
      { value: DEFAULT, label: `Default (Anthropic login)${!env.ANTHROPIC_BASE_URL ? '  [active]' : ''}` },
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
      await update($, picked, () => (value === DEFAULT ? 'default login' : value))
      await $.ui.close({ id: PANE })
      await $.ui.open({ id: RESTART, title: 'Restart to apply?', focus: true, closeOnEscape: true, rows: 7 })
    }

    return (
      <Box flexDirection="column">
        <Select key="profile" autoFocus options={options} value={active ?? (env.ANTHROPIC_BASE_URL ? undefined : DEFAULT)} onSelect={pick} />
        <Text dimColor>up/down + enter to switch, esc to close</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: RESTART }, async ($, e) => {
    const { Box, Text, Select } = $.ui.resolve(e)
    const name = await read($, picked)
    const choose = async (value: string) => {
      await $.ui.close({ id: RESTART })
      if (value === 'now') await $.command.run({ command: 'restart' })
    }

    return (
      <Box flexDirection="column">
        <Text>Now using {name}. Restart claude to apply?</Text>
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
