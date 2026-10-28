#!/bin/sh
# Stand-in for claude: logs its args; on the first run it asks for a restart.
echo "$*" >> "$HOME/calls.log"
if [ ! -f "$HOME/seen" ]; then
  touch "$HOME/seen"
  mkdir -p "$HOME/.claude"
  echo abc123 > "$HOME/.claude/restart-request"
fi
