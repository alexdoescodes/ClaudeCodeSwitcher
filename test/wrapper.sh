#!/bin/sh
# Run under each shell:  bash test/wrapper.sh   zsh test/wrapper.sh
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
export HOME="$tmp"
mkdir -p "$tmp/bin" "$tmp/.claude"
cp "$here/test/fake-claude.sh" "$tmp/bin/claude"
chmod +x "$tmp/bin/claude"
PATH="$tmp/bin:$PATH"

. "$here/ccs.sh"
claude

fail() { echo "FAIL: $1"; cat "$tmp/calls.log"; exit 1; }
[ "$(wc -l < "$tmp/calls.log" | tr -d ' ')" = 2 ] || fail "expected 2 launches"
sed -n 1p "$tmp/calls.log" | grep -q -- '--plugin-dir .*ccs --plugin-dir .*restart' || fail "plugins not loaded"
sed -n 2p "$tmp/calls.log" | grep -q -- '--resume abc123' || fail "no resume"
[ ! -f "$tmp/.claude/restart-request" ] || fail "flag not cleared"
echo "ok"
