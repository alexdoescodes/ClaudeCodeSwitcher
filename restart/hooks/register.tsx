import type { Register } from 'claude-code'

async function flagFile($: any) {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  return `${home}/.claude/restart-request`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'restart', description: 'Exit and resume this session' })
    return next(e)
  })

  on('command.run', { command: 'restart' }, async $ => {
    await $.fs.write(await flagFile($), await $.session.id())
    $.clock.after(300, () => { void $.command.run({ command: 'exit' }) })
    return { text: 'Restarting...' }
  })
}
