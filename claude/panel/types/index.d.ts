export type Project = {
  id: string
  name: string
  folder: string
  status: string
  nextStep: string | null
  calls: string[]
  server: { config: string; port: number; launchJson: string | null } | null
  localUrl?: string | null
  app?: string | null
  liveUrl?: string | null
  /** Optional: what the panel's Open button opens (a URL, or a path relative to the root). Set by hand. */
  open?: string | null
}

export type ServerState = 'none' | 'up' | 'down' | 'unknown'

declare module 'claude-code' {
  interface PluginState {
    'light-table-panel': {
      project: Project | null
      server: ServerState
      appRunning: boolean
      isCollapsed: boolean
    }
  }
}
