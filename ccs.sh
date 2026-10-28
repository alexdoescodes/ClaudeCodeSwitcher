# Source from ~/.bashrc or ~/.zshrc:  . /path/to/ClaudeCodeSwitcher/ccs.sh
if [ -n "${BASH_VERSION:-}" ]; then
  _ccs_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  _ccs_root="$(cd "$(dirname "${(%):-%x}")" && pwd)"
fi

ccs() { node "$_ccs_root/cc-switch.mjs" "$@"; }

# Wraps claude: loads the /ccs and /restart plugins, and resumes the session after /restart
claude() {
  _ccs_flag="$HOME/.claude/restart-request"
  rm -f "$_ccs_flag"
  command claude --plugin-dir "$_ccs_root/ccs" --plugin-dir "$_ccs_root/restart" "$@"
  while [ -f "$_ccs_flag" ]; do
    _ccs_id=$(cat "$_ccs_flag")
    rm -f "$_ccs_flag"
    sleep 1
    command claude --plugin-dir "$_ccs_root/ccs" --plugin-dir "$_ccs_root/restart" --resume "$_ccs_id"
  done
}
