# Dot-source from your PowerShell profile:  . /path/to/ClaudeCodeSwitcher/ccs.ps1
$ccsRoot = $PSScriptRoot

function ccs { node "$ccsRoot/cc-switch.mjs" @args }

# Wraps claude: loads the /ccs and /restart plugins, and resumes the session after /restart
function claude {
  $flag = "$HOME/.claude/restart-request"
  $mods = '--plugin-dir', "$ccsRoot/ccs", '--plugin-dir', "$ccsRoot/restart"
  $exe = (Get-Command claude -CommandType Application | Select-Object -First 1).Source
  Remove-Item $flag -ErrorAction SilentlyContinue
  & $exe @mods @args
  while (Test-Path $flag) {
    $id = (Get-Content $flag -Raw).Trim()
    Remove-Item $flag
    Start-Sleep -Seconds 1
    & $exe @mods --resume $id
  }
}
