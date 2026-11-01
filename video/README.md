# Demo videos

Two videos of StudioWall, made with [Remotion](https://www.remotion.dev) from the invented demo board. Nothing in them comes from a real board.

- **StudioWallDemo**: the short one, about 50 seconds, 1920×1080, silent. Its scenes are below.
- **StudioWallTour**: the long one, about 4½ minutes, in nine chapters (one page, install, set up, on the board, wrap up, the panel, every night, cloud sessions, privacy). It reuses the short video's scenes and adds real screen recordings of Claude Code: see [RECORDING.md](RECORDING.md) for the shot list. Until a recording is in, its slot shows a placeholder card.

| Scene | What it shows |
|---|---|
| Title | The ∴ mark and "Every project on one page." |
| Board tour | One camera move over the demo board: the whole page, the Tide Clock card, its Now, Next and Your calls, then the resting rows and the archive |
| Wrap up | "wrap up" typed in Claude Code, and the Tide Clock card changing from how it stood three days earlier to how it stands now |
| Nightly sweep | A night pass over every project, ending on "your project folders are only ever read" |
| Outro | Where to get it and where to try it |

## Make it

Needs Node 18 or newer. From this folder:

```bash
npm install
npm run studio       # preview and scrub through both in the browser
npm run render       # the short one: out/studiowall-demo.mp4
npm run render:long  # the long one: out/studiowall-tour.mp4
```

In the Studio, pick a video on the left. Step a frame at a time with the arrow keys; each scene is its own block on the timeline.

## When the board's design changes

The board shots are real captures of the demo board, kept in `public/board/`. Recapture them so the video shows the board as it is now:

```bash
npm run capture
```

That builds the demo board twice in a temporary folder (as it is, and with Tide Clock as it stood before its last wrap up), screenshots both with Google Chrome, and writes `public/board/` with `layout.json`, where each part of the page sits. The camera moves follow `layout.json`, so they keep pointing at the right places. The repo's own demo files are only copied, never changed. Set `CHROME_PATH` if Chrome isn't in `/Applications`.

## Where to change things

- **Words and timings: `src/script.ts`**, the cue sheet. Every caption, every scene length and every beat is there, in seconds. Change a line, save, and the Studio redraws.
- Adding or reordering chapters of the long video: the `LONG.parts` list in the same file. A part can be one of the short video's scenes, a chapter card, a list of points, or a recording slot.
- How a scene moves: its file under `src/scenes/`.
- The name and links: `src/product.json`. After renaming, run `npm run capture` so the board shots carry the new name too. (The repo, plugin and skill names still say light-table until the repo itself is renamed.)
- Colours and type: `src/theme.ts`, taken from the board's own `core/template.html`.
- Sound: there is none yet. Add an `<Audio>` in `src/Root.tsx` to score it.

## Licences

The video's code is MIT, like the rest of the repo. Remotion itself has [its own licence](https://www.remotion.dev/license): free for individuals and small teams, paid for larger companies. The fonts (Archivo, IBM Plex Mono) are under the SIL Open Font License.
