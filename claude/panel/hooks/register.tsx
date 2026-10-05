import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Project, ServerState } from '../types'

// Light Table's resolved settings, as core/config.py prints them.
type Table = { core: string; home: string; record: string; root: string | null; port: number; boardUrl: string }

const project = atom({ plugin: 'light-table-panel', key: 'project' } as const, null)
const server = atom({ plugin: 'light-table-panel', key: 'server' } as const, 'unknown')
const isCollapsed = atom({ plugin: 'light-table-panel', key: 'isCollapsed' } as const, false)

// Set when a restart has been asked for during the current outage; cleared as soon
// as the server is seen running again, so the next outage gets its own restart.
let hasAskedRestart = false
let table: Table | null = null
// The "Table folder" setting; empty means $LIGHT_TABLE_HOME or ~/.light-table.
let tableFolder = ''

/** Where the board lives. build.py leaves the code's path in <table folder>/core-path. */
async function loadTable($: any): Promise<Table | null> {
  const script =
    'H="${LT_FOLDER:-${LIGHT_TABLE_HOME:-$HOME/.light-table}}"; H="${H/#\~/$HOME}"; [ -f "$H/core-path" ] && LIGHT_TABLE_HOME="$H" /usr/bin/python3 "$(cat "$H/core-path")/config.py"'
  try {
    const r = await $.process.run(['/bin/sh', '-c', script], { timeoutMs: 10_000, env: { LT_FOLDER: tableFolder } })
    const t = JSON.parse(r.stdout)
    return t.root ? t : null
  } catch {
    return null
  }
}

/** The project whose folder holds the session's working directory (longest match wins). */
async function findProject($: any): Promise<Project | null> {
  if (!table?.root) return null
  const root = table.root
  const cwd: string = await $.session.cwd()
  let data: { projects: Project[] }
  try {
    data = JSON.parse(await $.fs.read(table.record))
  } catch {
    return null
  }
  const hits = data.projects
    .filter(p => cwd === `${root}/${p.folder}` || cwd.startsWith(`${root}/${p.folder}/`))
    .sort((a, b) => b.folder.length - a.folder.length)
  return hits[0] ?? null
}

async function isListening($: any, port: number): Promise<boolean> {
  const r = await $.process.run(['/usr/sbin/lsof', '-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { timeoutMs: 5000 })
  return r.stdout.trim() !== ''
}

/** Whether something is listening on the project's port. */
async function checkServer($: any, p: Project | null): Promise<ServerState> {
  if (!p?.server?.port) return 'none'
  try {
    return (await isListening($, p.server.port)) ? 'up' : 'down'
  } catch {
    return 'unknown'
  }
}

async function refresh($: any) {
  table = await loadTable($)
  const p = await findProject($)
  await update($, project, () => p)
  await update($, server, () => 'unknown' as ServerState)
  const s = await checkServer($, p)
  await update($, server, () => s)
  return { p, s }
}

function restartText(p: Project): string {
  const s = p.server!
  const how = s.launchJson
    ? `call preview_start with name "${s.config}" (from ${s.launchJson})`
    : `this project has no .claude/launch.json; its server is \`${s.config}\` on port ${s.port}. Ask before creating a launch.json for it`
  return `Restart the ${p.name} preview: ${how}, then confirm it loads (port ${s.port}). Keep it brief.`
}

const wrapText = () =>
  `Wrap up this session for Light Table: run the light-table-wrap-up skill` +
  (table ? ` (table folder: ${table.home}; run its scripts with LIGHT_TABLE_HOME set to that).` : '.')

export const register: Register = (on, options) => {
  tableFolder = String(options.tableFolder ?? '')
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    const { p, s } = await refresh($)
    // Coming into a project whose server isn't running: bring it back without being asked.
    if (e.isInteractive && p?.server && s === 'down' && !hasAskedRestart) {
      hasAskedRestart = true
      void $.prompt.submit({ text: restartText(p) })
    }
    // Keep the server light honest while the session is open. Seeing it up again
    // re-arms the restart for the next outage. It never restarts on its own while
    // you're away: the desktop app stops preview servers on purpose when a
    // session sits idle.
    $.clock.every(20_000, async () => {
      const cur = await read($, project)
      const st = await checkServer($, cur)
      if (st === 'up') hasAskedRestart = false
      await update($, server, () => st)
    })
    return ran
  })

  // The app reattaching to an idle session (you came back to it): restart a stopped server.
  on('session.attach', async ($, e, next) => {
    const ran = await next(e)
    const p = await read($, project)
    if (!p?.server || hasAskedRestart) return ran
    const s = await checkServer($, p)
    await update($, server, () => s)
    if (s === 'down') {
      hasAskedRestart = true
      void $.prompt.submit({ text: restartText(p) })
    }
    return ran
  })

  // The first message after an outage: restart the server before anything else.
  on('prompt.submit', async ($, e, next) => {
    if (e.origin?.kind === 'plugin') return next(e)
    const p = await read($, project)
    if (!p?.server || hasAskedRestart) return next(e)
    const s = await checkServer($, p)
    await update($, server, () => s)
    if (s !== 'down') return next(e)
    hasAskedRestart = true
    return next({ ...e, context: [...(e.context ?? []), `(light-table) ${restartText(p)} Do this before the rest of the request.`] })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const p = await read($, project)
    const s = await read($, server)
    const collapsed = await read($, isCollapsed)

    const openBoard = async () => {
      if (!table) table = await loadTable($)
      if (!table) {
        $.ui.toast('Light Table isn’t set up yet. Ask: “set up Light Table”.')
        return
      }
      $.ui.toast('Opening the board…')
      // open.py rebuilds the page, starts its server if needed and opens the browser.
      const r = await $.process.run(['/usr/bin/python3', `${table.core}/open.py`], { timeoutMs: 90_000, env: { LIGHT_TABLE_HOME: table.home } })
      if (r.exitCode !== 0) $.ui.toast((r.stderr || r.stdout).trim().split('\n').pop() || 'The board didn’t open.')
    }
    const restart = async () => {
      const cur = await read($, project)
      if (!cur?.server) return
      hasAskedRestart = true
      await $.prompt.submit({ text: restartText(cur) })
    }
    const wrap = async () => {
      await $.prompt.submit({ text: wrapText() })
    }

    if (collapsed) {
      return (
        <Box flexDirection="row" gap={1}>
          <Button key="expand" label="∴ Light Table" plain dimColor onPress={() => update($, isCollapsed, () => false)} />
        </Box>
      )
    }

    const light = s === 'up' ? '● running' : s === 'down' ? '○ stopped' : s === 'none' ? '' : '… checking'
    const decisions = p?.calls?.length ?? 0

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text bold>∴ {p ? p.name : 'Light Table'}</Text>
          {p && <Text dimColor>· {p.status}</Text>}
          {p?.server && <Text color={s === 'up' ? 'green' : s === 'down' ? 'yellow' : undefined} dimColor={s !== 'up' && s !== 'down'}>· :{p.server.port} {light}</Text>}
          {decisions > 0 && <Text color="yellow">· {decisions} decision{decisions === 1 ? '' : 's'}</Text>}
        </Box>
        {p?.nextStep && <Text dimColor>Next: {p.nextStep}</Text>}
        {!p && <Text dimColor>This folder isn't on the board yet. Wrap up adds it.</Text>}
        <Box flexDirection="row" gap={1}>
          {p?.server && (
            <Button key="restart" label={s === 'up' ? 'Restart server' : 'Start server'} variant={s === 'down' ? 'primary' : 'secondary'} onPress={restart} />
          )}
          <Button key="wrap" label="Wrap up" variant={s === 'down' ? 'secondary' : 'primary'} onPress={wrap} />
          <Button key="board" label="Open board" onPress={openBoard} />
          <Button key="hide" label="Hide" dimColor onPress={() => update($, isCollapsed, () => true)} />
        </Box>
      </Box>
    )
  })
}
