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
  /** Optional: true = restart a stopped server on its own (session start, coming back, first message). Off by default. Set by hand. */
  autoStart?: boolean
}

export type ServerState = 'none' | 'up' | 'down' | 'unknown'

declare module 'claude-code' {
  interface PluginState {
    'light-table-panel': {
      project: Project | null
      server: ServerState
      appRunning: boolean
      decisionsOpen: boolean
      sweepFresh: boolean
      isCollapsed: boolean
    }
  }
}
