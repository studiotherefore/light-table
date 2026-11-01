# Demo video

A short video of Light Table (about 50 seconds, 1920×1080, silent), made with [Remotion](https://www.remotion.dev) from the invented demo board. Nothing in it comes from a real board.

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
npm run studio     # preview and scrub through it in the browser
npm run render     # writes out/light-table-demo.mp4
```

## When the board's design changes

The board shots are real captures of the demo board, kept in `public/board/`. Recapture them so the video shows the board as it is now:

```bash
npm run capture
```

That builds the demo board twice in a temporary folder (as it is, and with Tide Clock as it stood before its last wrap up), screenshots both with Google Chrome, and writes `public/board/` with `layout.json`, where each part of the page sits. The camera moves follow `layout.json`, so they keep pointing at the right places. The repo's own demo files are only copied, never changed. Set `CHROME_PATH` if Chrome isn't in `/Applications`.

## Where to change things

- Words on screen: in each scene under `src/scenes/`.
- Lengths and order of scenes: `src/Root.tsx`. Timing inside the board tour: `T` in `src/scenes/Tour.tsx`.
- Colours and type: `src/theme.ts`, taken from the board's own `core/template.html`.
- Sound: there is none yet. Add an `<Audio>` in `src/Root.tsx` to score it.

## Licences

The video's code is MIT, like the rest of the repo. Remotion itself has [its own licence](https://www.remotion.dev/license): free for individuals and small teams, paid for larger companies. The fonts (Archivo, IBM Plex Mono) are under the SIL Open Font License.
