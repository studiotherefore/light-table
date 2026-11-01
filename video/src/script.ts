// The cue sheet: every word on screen and every timing, in one place.
// Times are in seconds. Change a line, save, and the Studio redraws.
// (Colours and type live in theme.ts; how each scene moves lives in scenes/.)

export const SHORT = {
  // Scenes in order, and how long each one runs. Neighbouring scenes overlap by `fade`.
  fade: 0.5,
  scenes: {
    title: 4,
    tour: 23,
    wrapUp: 10.5,
    sweep: 8.5,
    outro: 7,
  },
};

export const TITLE = {
  name: "Light Table",
  line: "Every project on one page.",
  aside: "for Mac · with Claude Code",
};

// The board tour: one camera move. Each beat starts at the time given.
export const TOUR = {
  beats: { card: 5, status: 10, now: 11.3, next: 13.5, calls: 15.7, rest: 18.7 },
  board: { kicker: "One page", text: "Everything you're making, at a glance." },
  card: { kicker: "Active", text: "Each project in motion gets a card: what it looks like now, and where it stands." },
  now: { kicker: "Now", text: "Where the project stands today." },
  next: { kicker: "Next", text: "The very next step." },
  calls: { kicker: "Your calls", text: "The decisions only you can make." },
  rest: { kicker: "Resting · Archive", text: "Quieter projects fold into rows. Finished ones fold away." },
};

export const WRAP_UP = {
  kicker: "Wrap up",
  text: "At the end of a session, say “wrap up”. The card rewrites itself.",
  window: "tide-clock · Claude Code",
  prompt: "wrap up",
  typeAt: 1.3,
  // What the agent reports, and when each line appears.
  steps: [
    { at: 2.8, text: "Read HANDOFF.md and today's 4 commits" },
    { at: 3.6, text: "Captured the app at localhost:5173" },
    { at: 4.4, text: "Rewrote Tide Clock: now, next step, 2 calls" },
    { at: 5.2, text: "Rebuilt the board" },
    { at: 6.2, text: "✓ Tide Clock is up to date", done: true },
  ],
  revealAt: 6.5,
  after: "new screenshot · new status · 3 days ago → today",
};

export const SWEEP = {
  kicker: "Nightly sweep",
  text: "Every night, a sweep catches up the projects that changed, from their docs and git history.",
  promise: "Your project folders are only ever read, never changed.",
  clock: "night · 03:",
  // One row per project; `kind` of result picks the colour: updated, noted or unchanged.
  rows: [
    { name: "Tide Clock", type: "web app", result: "4 commits · updated", kind: "updated" },
    { name: "Moth Radio", type: "web radio", result: "branch not merged · noted", kind: "noted" },
    { name: "Field Recordings", type: "album", result: "unchanged", kind: "unchanged" },
    { name: "Loom Sim", type: "simulation", result: "2 commits · updated", kind: "updated" },
    { name: "Essay on Maps", type: "essay", result: "handoff changed · updated", kind: "updated" },
    { name: "Letterpress Site", type: "website", result: "unchanged", kind: "unchanged" },
    { name: "Pixel Garden", type: "game prototype", result: "unchanged", kind: "unchanged" },
  ] as const,
  startAt: 1.1,
  eachRow: 0.53,
};

export const OUTRO = {
  name: "Light Table",
  line: "A board of all your projects, kept current by Claude Code.",
  links: [
    { label: "get it", text: "github.com/studiotherefore/light-table" },
    { label: "try it", text: "studiotherefore.github.io/light-table", accent: true },
  ],
  small: "Free and open source (MIT) · for Mac · runs on your machine",
};

// ---------------------------------------------------------------------------
// The long video: chapters that reuse the short video's scenes, plus slots for
// real screen recordings of Claude Code (see RECORDING.md for the shot list).
// A recording slot shows a placeholder card until `file` names a clip in public/.

export type Caption = { at: number; text: string };
export type Zoom = { at: number; x: number; y: number; s: number }; // centre (x, y) in the 1920×1080 frame, zoom s
export type Part =
  | { type: "title" | "tour" | "wrapUp" | "sweep" | "outro" }
  | { type: "chapter"; n: string; title: string; line: string; length?: number }
  | { type: "points"; kicker: string; points: string[]; length: number }
  | { type: "recording"; id: string; title: string; what: string; length: number;
      file?: string; start?: number; speed?: number; captions?: Caption[]; zoom?: Zoom[] };

export const LONG: { fade: number; chapterLength: number; parts: Part[] } = {
  fade: 0.5,
  chapterLength: 2.5,
  parts: [
    { type: "title" },

    { type: "chapter", n: "01", title: "One page", line: "What the board shows you." },
    { type: "tour" },

    { type: "chapter", n: "02", title: "Install", line: "Two lines in Claude Code." },
    { type: "recording", id: "install", title: "Installing the plugin", length: 20,
      what: "In Claude Code, type the two /plugin lines from the README, one at a time, and let each finish.",
      captions: [{ at: 1, text: "Add the marketplace, then install the plugin." }] },

    { type: "chapter", n: "03", title: "Set up", line: "Claude reads your projects and drafts the board." },
    { type: "recording", id: "setup", title: "“Set up Light Table”", length: 45,
      what: "Say “Set up Light Table”. Choose the demo projects folder, let Claude read them, accept the list, and let the board open.",
      captions: [
        { at: 1, text: "Point it at the folder that holds your projects." },
        { at: 16, text: "It reads each project's README, notes and git history. Only reads." },
        { at: 32, text: "You check the list, then the board opens." },
      ] },

    { type: "chapter", n: "04", title: "On the board", line: "Cards, tabs, your notes, and your own order." },
    { type: "recording", id: "board", title: "Using the board", length: 35,
      what: "On the open board: click About, Status and the Notes tab on a card; type a short note; hover the stacked-frames icon; drag a card down to Resting; click the “Your calls” filter.",
      captions: [
        { at: 1, text: "About says what a project is. Status, where it stands." },
        { at: 10, text: "Notes are yours. No agent ever touches them." },
        { at: 20, text: "Drag cards into your own order. It saves." },
        { at: 28, text: "Filter to just the decisions waiting on you." },
      ] },

    { type: "chapter", n: "05", title: "Wrap up", line: "One phrase at the end of a session." },
    { type: "wrapUp" },
    { type: "recording", id: "wrap-up", title: "A real wrap up", length: 30,
      what: "In a session in one demo project's folder, say “wrap up”. Let it finish, then switch to the board and show the card that changed.",
      captions: [
        { at: 1, text: "Claude reads what changed and rewrites the entry." },
        { at: 18, text: "The card on the board, updated." },
      ] },

    { type: "chapter", n: "06", title: "The panel", line: "Optional: one row of buttons above the prompt." },
    { type: "recording", id: "panel", title: "The panel above the prompt", length: 20,
      what: "With the panel plugin on, open a session in a demo project: show the row, open the decisions list with ›, press ⠿ to open the board.",
      captions: [{ at: 1, text: "The next step and your calls, right where you type." }] },

    { type: "chapter", n: "07", title: "Every night", line: "A sweep catches up whatever changed." },
    { type: "sweep" },
    { type: "recording", id: "schedule", title: "Scheduling the sweep", length: 20,
      what: "In the Claude app, create the daily scheduled task with the prompt “Run the light-table-sweep skill.”, then press Run now once.",
      captions: [{ at: 1, text: "One scheduled task. Press Run now once and allow its three commands." }] },

    { type: "chapter", n: "08", title: "Cloud sessions", line: "Work pushed from anywhere reaches the board." },
    { type: "points", kicker: "Cloud sessions", length: 12, points: [
      "Work pushed to GitHub from a cloud session, another account or another machine reaches the board too.",
      "The sweep reads it through gh, read-only, and tells you when a branch isn't merged yet.",
      "Paste one end-of-session block into those projects' CLAUDE.md.",
    ] },

    { type: "chapter", n: "09", title: "Private by design", line: "Everything stays on your Mac." },
    { type: "points", kicker: "Privacy", length: 14, points: [
      "The board listens on 127.0.0.1 only, and refuses requests from other sites.",
      "Agents write only to the table folder. Your project folders are only ever read.",
      "Agents never move your cards. Where things sit is yours.",
      "Backup is off unless you make the table folder a private Git repo of your own.",
    ] },

    { type: "outro" },
  ],
};
