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
// The "Background" setting: a color behind the panel's row, or none.
let background = ''

/** Where the board lives. build.py leaves the code's path in <table folder>/core-path. */
async function loadTable($: any): Promise<Table | null> {
  const script =
    'H="${LT_FOLDER:-${LIGHT_TABLE_HOME:-$HOME/.light-table}}"; H="${H/#\\~/$HOME}"; [ -f "$H/core-path" ] && LIGHT_TABLE_HOME="$H" /usr/bin/python3 "$(cat "$H/core-path")/config.py"'
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
  if (!table) table = await loadTable($)
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

/** Whether something is listening on the project's port. */
async function checkServer($: any, p: Project | null): Promise<ServerState> {
  if (!p?.server?.port) return 'none'
  try {
    const r = await $.process.run(['/usr/sbin/lsof', '-nP', `-iTCP:${p.server.port}`, '-sTCP:LISTEN', '-t'], { timeoutMs: 5000 })
    return r.stdout.trim() ? 'up' : 'down'
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

/** The message the Add to board / Update board button sends. */
function wrapText(): string {
  return (
    `Update Light Table for this session: run the light-table-wrap-up skill` +
    (table ? ` (table folder: ${table.home}; run its scripts with LIGHT_TABLE_HOME set to that).` : '.')
  )
}

/**
 * Hand a message to Claude from a button. Doesn't wait for it to be delivered:
 * a busy or just-waking session takes it when it's free, and a press that waits
 * can fail before then. Says so right away, and again if it's refused.
 */
function sendToClaude($: any, text: string, notice: string) {
  $.ui.toast(notice)
  void Promise.resolve($.prompt.submit({ text }))
    .then((r: any) => { if (r && r.drop !== undefined) $.ui.toast(`Light Table: that didn't go through (${r.drop ?? 'refused'}).`) })
    .catch((err: any) => { try { $.ui.toast(`Light Table: couldn't send that to Claude. ${err?.message ?? ''}`.trim()) } catch {} })
}

export const register: Register = (on, options) => {
  tableFolder = String(options.tableFolder ?? '')
  background = String(options.background ?? '')

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
      // Re-read the record too, so Add to board / Update board show up here without a restart.
      const cur = await findProject($)
      if (JSON.stringify(cur) !== JSON.stringify(await read($, project))) await update($, project, () => cur)
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
      $.ui.toast('Opening the board…')
      try {
        if (!table) table = await loadTable($)
        if (!table) {
          $.ui.toast('Light Table isn’t set up yet. Ask: “set up Light Table”.')
          return
        }
        // open.py rebuilds the page, starts its server if needed and opens the browser.
        const r = await $.process.run(['/usr/bin/python3', `${table.core}/open.py`], { timeoutMs: 90_000, env: { LIGHT_TABLE_HOME: table.home } })
        if (r.exitCode !== 0) $.ui.toast(`Light Table: ${(r.stderr || r.stdout).trim().split('\n').pop() || 'the board didn’t open.'}`)
      } catch (err: any) {
        $.ui.toast(`Light Table: couldn't open the board. ${err?.message ?? ''}`.trim())
      }
    }
    const restart = async () => {
      const cur = await read($, project)
      if (!cur?.server) return
      hasAskedRestart = true
      sendToClaude($, restartText(cur), `Restarting ${cur.name}'s server…`)
    }
    const wrap = async () => {
      const cur = await read($, project)
      sendToClaude($, wrapText(), cur ? `Updating ${cur.name} on the board…` : 'Adding this folder to the board…')
    }

    // Draw this row, then whatever other plugins put above the prompt underneath,
    // so neither hides the other. No gap between the two: the app's own slot comes
    // back as an empty element when nothing else is above the prompt, and a gap
    // would turn it into a blank line.
    const below = await next(e)
    const stack = (row: any) => (
      <Box flexDirection="column">
        {background ? (
          <Box flexDirection="column" backgroundColor={background} paddingX={1}>
            {row}
          </Box>
        ) : (
          row
        )}
        {below}
      </Box>
    )

    if (collapsed) {
      return stack(
        <Box flexDirection="row" gap={1}>
          <Button key="expand" label={"∴ Light Table"} plain dimColor onPress={() => update($, isCollapsed, () => false)} />
        </Box>
      )
    }

    // Folders that aren't on the board: stay quiet, one small way to add it.
    if (!p) {
      return stack(
        <Box flexDirection="row" gap={1}>
          <Button key="wrap" label={"∴ Add to board"} plain dimColor onPress={wrap} />
        </Box>
      )
    }

    // A project: one line. Who/where on the left (next step trimmed to fit), buttons on the right.
    const light = s === 'up' ? '●' : s === 'down' ? '○' : '…'
    const decisions = p.calls?.length ?? 0

    return stack(
      <Box flexDirection="row" gap={2} alignItems="center" justifyContent="space-between">
        {/* Name, light and count keep their size; only the next step gives way. */}
        <Box flexDirection="row" gap={2} flexGrow={1} flexShrink={1} minWidth={0} alignItems="center">
          <Box flexShrink={0}><Text bold wrap="truncate">∴{" "}{p.name}</Text></Box>
          {p.server && (
            <Box flexShrink={0}>
              <Text wrap="truncate" color={s === 'up' ? 'green' : s === 'down' ? 'yellow' : undefined} dimColor={s !== 'up' && s !== 'down'}>{light}{" "}:{p.server.port}</Text>
            </Box>
          )}
          {decisions > 0 && (
            <Box flexShrink={0}><Text wrap="truncate" color="yellow">{decisions} decision{decisions === 1 ? '' : 's'}</Text></Box>
          )}
          {p.nextStep && (
            <Box flexShrink={1} minWidth={0}><Text dimColor wrap="truncate">Next: {p.nextStep}</Text></Box>
          )}
        </Box>
        <Box flexDirection="row" gap={1} flexShrink={0}>
          {p.server && (
            <Button key="restart" label={s === 'up' ? 'Restart' : 'Start server'} variant={s === 'down' ? 'primary' : 'secondary'} onPress={restart} />
          )}
          <Button key="wrap" label="Update board" variant="secondary" onPress={wrap} />
          <Button key="board" label="Board" onPress={openBoard} />
          <Button key="hide" label="Hide" dimColor onPress={() => update($, isCollapsed, () => true)} />
        </Box>
      </Box>
    )
  })
}
