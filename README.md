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

Two optional plugins:

- `/ccs`: popup to pick a profile. After you pick, it offers to restart now or later. It only switches; add and remove profiles with the CLI.
- `/restart`: exits and resumes the same session, so a new profile takes effect.

`ccs.ps1` (PowerShell) and `ccs.sh` (bash/zsh) define `ccs` and a `claude` wrapper that loads both plugins and does the resume. Source one from your shell profile instead of the alias above:

```powershell
. /path/to/ClaudeCodeSwitcher/ccs.ps1    # $PROFILE
```

```sh
. /path/to/ClaudeCodeSwitcher/ccs.sh     # ~/.bashrc or ~/.zshrc
```

Start sessions with `claude` through the wrapper; running the binary directly skips the plugins and the resume.

## Tests

`test/wrapper.sh` and `test/wrapper.ps1` run the wrappers against a fake `claude` and check the relaunch with `--resume`. CI runs them on Linux, macOS and Windows. The popups and the real exit are not covered.

## Security

Tokens are stored in plain text in `~/.claude/profiles.json`. Keep that file private and never commit it.

## License

MIT
