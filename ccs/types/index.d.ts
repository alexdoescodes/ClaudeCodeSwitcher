export type Msg = string

declare module 'claude-code' {
  interface PluginState {
    ccs: { msg: Msg }
  }
}
