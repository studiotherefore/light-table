export type Project = {
  id: string
  name: string
  folder: string
  status: string
  nextStep: string | null
  calls: string[]
  server: { config: string; port: number; launchJson: string | null } | null
}

export type ServerState = 'none' | 'up' | 'down' | 'unknown'

declare module 'claude-code' {
  interface PluginState {
    'light-table-panel': {
      project: Project | null
      server: ServerState
      isCollapsed: boolean
    }
  }
}
