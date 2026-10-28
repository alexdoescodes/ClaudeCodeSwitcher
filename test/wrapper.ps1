# Run with pwsh:  pwsh test/wrapper.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$tmp = Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid())
$bin = Join-Path $tmp 'bin'
New-Item -ItemType Directory $bin, (Join-Path $tmp '.claude') | Out-Null

if ($IsWindows) {
  Set-Content (Join-Path $bin 'claude.cmd') @(
    '@echo off'
    '>>"%USERPROFILE%\calls.log" echo %*'
    'if exist "%USERPROFILE%\seen" exit /b 0'
    'echo x>"%USERPROFILE%\seen"'
    'echo abc123>"%USERPROFILE%\.claude\restart-request"'
  )
} else {
  Copy-Item (Join-Path $PSScriptRoot 'fake-claude.sh') (Join-Path $bin 'claude')
  chmod +x (Join-Path $bin 'claude')
}

$env:HOME = $tmp
$env:USERPROFILE = $tmp
$env:PATH = $bin + [IO.Path]::PathSeparator + $env:PATH
pwsh -NoProfile -Command ". '$root/ccs.ps1'; claude"

$calls = @(Get-Content (Join-Path $tmp 'calls.log'))
if ($calls.Count -ne 2) { throw "expected 2 launches, got $($calls.Count)" }
if ($calls[0] -notmatch '--plugin-dir.*ccs.*--plugin-dir.*restart') { throw 'plugins not loaded' }
if ($calls[1] -notmatch '--resume abc123') { throw 'no resume' }
if (Test-Path (Join-Path $tmp '.claude/restart-request')) { throw 'flag not cleared' }
'ok'
