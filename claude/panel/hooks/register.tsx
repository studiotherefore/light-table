import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Project, ServerState } from '../types'

// Light Table's resolved settings, as core/config.py prints them.
type Table = { core: string; home: string; record: string; root: string | null; port: number; boardUrl: string }

const project = atom({ plugin: 'light-table-panel', key: 'project' } as const, null)
const server = atom({ plugin: 'light-table-panel', key: 'server' } as const, 'unknown')
const appRunning = atom({ plugin: 'light-table-panel', key: 'appRunning' } as const, false)
const decisionsOpen = atom({ plugin: 'light-table-panel', key: 'decisionsOpen' } as const, false)
const sweepFresh = atom({ plugin: 'light-table-panel', key: 'sweepFresh' } as const, true)
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

/** Whether the project's built app (the record's `app`) is running. */
async function checkApp($: any, p: Project | null): Promise<boolean> {
  if (!p?.app) return false
  const name = p.app.split('/').pop()
  try {
    const r = await $.process.run(['/bin/ps', '-axo', 'command'], { timeoutMs: 5000 })
    return r.stdout.includes(`/${name}/Contents/MacOS/`)
  } catch {
    return false
  }
}

/**
 * Whether a nightly sweep ran in the last two days (sweep.py leaves the time in
 * <table folder>/last-sweep). Without one, nothing else refreshes the cards, so
 * the row shows an Update button.
 */
async function checkSweep($: any): Promise<boolean> {
  if (!table) return true
  try {
    const last = Date.parse((await $.fs.read(`${table.home}/last-sweep`)).trim())
    return Date.now() - last < 48 * 3600_000
  } catch {
    return false
  }
}

async function refresh($: any) {
  table = await loadTable($)
  const p = await findProject($)
  await update($, project, () => p)
  const fresh = await checkSweep($)
  await update($, sweepFresh, () => fresh)
  await update($, server, () => 'unknown' as ServerState)
  const s = await checkServer($, p)
  await update($, server, () => s)
  const a = await checkApp($, p)
  await update($, appRunning, () => a)
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
      const fresh = await checkSweep($)
      if (fresh !== (await read($, sweepFresh))) await update($, sweepFresh, () => fresh)
      const st = await checkServer($, cur)
      if (st === 'up') hasAskedRestart = false
      await update($, server, () => st)
      const a = await checkApp($, cur)
      await update($, appRunning, () => a)
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
    // Sending a message folds the decisions list away.
    if (await read($, decisionsOpen)) await update($, decisionsOpen, () => false)
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
      $.ui.toast('Opening Light Table…')
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
    const openThing = async (what: string, label: string) => {
      try {
        await $.process.run(['/usr/bin/open', what])
      } catch (err: any) {
        $.ui.toast(`Light Table: couldn't open ${label}. ${err?.message ?? ''}`.trim())
      }
    }
    // One button per way in, as on the board: App, Local (starts a down server first), Live,
    // or Open for the record's hand-set `open`.
    const openCustom = async () => {
      const cur = await read($, project)
      if (!cur?.open) return
      if (!table) table = await loadTable($)
      const what = /^[a-z]+:/.test(cur.open) ? cur.open : `${table?.root}/${cur.open}`
      return openThing(what, cur.open)
    }
    const openApp = async () => {
      const cur = await read($, project)
      if (!cur?.app) return
      if (!table) table = await loadTable($)
      $.ui.toast(`Opening ${cur.name}…`)
      await openThing(`${table?.root}/${cur.app}`, 'the app')
      await $.clock.sleep(2500)
      const a = await checkApp($, cur)
      await update($, appRunning, () => a)
    }
    const openLocal = async () => {
      const cur = await read($, project)
      if (!cur?.server) return
      const url = cur.localUrl || `http://localhost:${cur.server.port}/`
      // Only a server seen down gets started; if the check itself fails, just open the page.
      if ((await checkServer($, cur)) !== 'down') return openThing(url, url)
      // Down: ask Claude to start it, then open the page once it answers (up to 90 s).
      hasAskedRestart = true
      sendToClaude($, restartText(cur), `Starting ${cur.name}'s server; the page opens when it's up…`)
      for (let i = 0; i < 45; i++) {
        await $.clock.sleep(2000)
        if ((await checkServer($, cur)) === 'up') {
          await update($, server, () => 'up' as ServerState)
          return openThing(url, url)
        }
      }
      $.ui.toast(`Light Table: ${cur.name}'s server didn't come up; the page wasn't opened.`)
    }
    const openLive = async () => {
      const cur = await read($, project)
      if (cur?.liveUrl) return openThing(cur.liveUrl, cur.liveUrl)
    }
    const wrap = async () => {
      const cur = await read($, project)
      sendToClaude($, wrapText(), cur ? `Updating ${cur.name} on Light Table…` : 'Adding this folder to Light Table…')
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

    // A project: one line. Who/where on the left, ways in and the board on the right.
    const decisions = p.calls?.length ?? 0
    const open = await read($, decisionsOpen)
    const toggle = () => update($, decisionsOpen, v => !v)
    // Update only shows while no nightly sweep is keeping the cards current.
    const showUpdate = !(await read($, sweepFresh))

    // Hide reads "Hide" while everything fits on the row, "–" once it doesn't. The desktop
    // reports the width in cells (85 in a 1468 pt window); taken as about 9 pt each
    // (an estimate: tune the 9 if it switches too early or late).
    const cols: number = e.props.bodyColumns ?? 200
    const ways = [p.open && 'Open', p.app && 'App', p.server && 'Local', p.liveUrl && 'Live'].filter(Boolean) as string[]
    const countText = decisions > 0 ? `${decisions} decision${decisions === 1 ? '' : 's'}` : ''
    const rowPt = 28 + 20 + p.name.length * 8.5 + (decisions > 0 ? 16 + countText.length * 7.5 + 14 : 0)
      + 16 + ways.reduce((n, w) => n + w.length * 7.5 + 24 + 8, 0) + (showUpdate ? 45 + 8 : 0) + 26 + 8 + 34
    const room = cols * 9
    const hideLabel = room >= rowPt ? 'Hide' : '\u2013'
    // Narrower still: the count drops its word ("1 ›") so the title is never cut.
    const countLabel = room >= rowPt - 34 + 20 ? countText : String(decisions)

    const row = (
      // Always one row. As it narrows the Next text gives way first, then Hide becomes
      // "–", then the count drops its word. The title is never cut; the buttons never move.
      <Box flexDirection="row" gap={2} alignItems="center" justifyContent="space-between">
        <Box flexDirection="row" gap={2} flexGrow={1} flexShrink={1} minWidth={0} overflow="hidden" alignItems="center">
          <Box flexShrink={0}><Text bold>∴{"\u2002"}{p.name}</Text></Box>
          {decisions > 0 && (
            <Box flexDirection="row" flexShrink={0} alignItems="center">
              <Text color="#a598e6">{countLabel}</Text>
              {/* The count keeps its colour as text; the small glyph beside it is what opens the list. */}
              <Button key="decisions" label={open ? "\u2304" : "\u203a"} plain dimColor onPress={toggle} />
            </Box>
          )}
          {p.nextStep && (
            <Box flexShrink={100} minWidth={0}><Text dimColor wrap="truncate">Next: {p.nextStep}</Text></Box>
          )}
        </Box>
        <Box flexDirection="row" gap={1} flexShrink={0} alignItems="center">
          {/* Ways in. Local is the bright one while its server is down: pressing it starts it. */}
          {p.open && <Button key="open" label="Open" variant="secondary" onPress={openCustom} />}
          {p.app && <Button key="app" label="App" variant="secondary" onPress={openApp} />}
          {p.server && <Button key="local" label="Local" variant={s === 'down' ? 'primary' : 'secondary'} onPress={openLocal} />}
          {p.liveUrl && <Button key="live" label="Live" variant="secondary" onPress={openLive} />}
          {showUpdate && <Button key="wrap" label="Update" plain dimColor onPress={wrap} />}
          <Button key="board" label={"\u283f"} plain dimColor onPress={openBoard} />
          <Button key="hide" label={hideLabel} plain dimColor onPress={() => update($, isCollapsed, () => true)} />
        </Box>
      </Box>
    )

    if (!open || decisions === 0) return stack(row)

    // Decisions open: the strip grows upward. Each decision on its own line, then the full next step.
    return stack(
      <Box flexDirection="column">
        {p.calls.map((c, i) => (
          <Box key={`call-${i}`} flexDirection="row" gap={1}>
            <Text color="#a598e6">·</Text>
            <Text wrap="wrap">{c}</Text>
          </Box>
        ))}
        {p.nextStep && <Box marginTop={1}><Text dimColor wrap="wrap">Next: {p.nextStep}</Text></Box>}
        <Box marginTop={1}>{row}</Box>
      </Box>
    )
  })
}
