# ClaudeCodeSwitcher

Tiny zero-dependency CLI to switch [Claude Code](https://claude.com/claude-code) between API endpoints/tokens (e.g. a corporate proxy and the default Anthropic login).

It stores profiles in `~/.claude/profiles.json` and switches by editing the `env` block (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`) of `~/.claude/settings.json`.

## Requirements

Node.js 18+

## Install

```sh
git clone https://github.com/alexdoescodes/ClaudeCodeSwitcher.git
alias ccs='node /path/to/ClaudeCodeSwitcher/cc-switch.mjs'   # add to ~/.bashrc or ~/.zshrc
```

## Use

Run `ccs`, then pick with up/down + enter:

- a saved profile: sets the endpoint and token
- `+ Add profile`: name, base URL, token
- `- Remove profile`
- `Default`: clears the override and returns to your Anthropic login

Restart running `claude` sessions after switching.

## Inside Claude Code

Two optional plugins (Windows PowerShell setup):

- `/ccs`: popup to pick a profile. After you pick, it offers to restart now or later. It only switches; add and remove profiles with the CLI.
- `/restart`: exits and resumes the same session, so a new profile takes effect.

`ccs.ps1` defines `ccs` and a `claude` wrapper that loads both plugins and does the resume. Add this to your PowerShell profile (`$PROFILE`) instead of the alias above:

```powershell
. C:\path\to\ClaudeCodeSwitcher\ccs.ps1
```

Start sessions with `claude` from PowerShell; running `claude.exe` directly skips the plugins and the resume.

## Security

Tokens are stored in plain text in `~/.claude/profiles.json`. Keep that file private and never commit it.

## License

MIT
