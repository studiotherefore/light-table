# Recording the long video's Claude Code shots

The long video (`StudioWallTour`, about 4½ minutes) reuses the short video's scenes and has six **slots** for real screen recordings. Until a clip is in place, its slot shows a placeholder card saying what goes there, so the video always renders.

## Before you record: use the demo, never your own board

Every shot must show the invented demo projects only. The safest way is a **separate macOS user account** used just for recording (System Settings → Users & Groups → Add User). It has no real projects, no real board and no history in Claude. Sign in to the Claude app there, then:

```bash
git clone https://github.com/studiotherefore/light-table ~/light-table
cp -R ~/light-table/demo/projects ~/Projects      # the demo projects, as if they were yours
```

If you'd rather record in your own account, start Claude Code from Terminal with a separate table folder, so your real board is never touched or shown: `LIGHT_TABLE_HOME=~/light-table-take claude`. Close every other window first, and check the sidebar and recent sessions don't show real project names.

## How to record

- Make the window you record **1920×1080** (or the same 16:9 shape) and use a large text size, so it reads on a phone.
- **⌘⇧5** → *Record Selected Portion*, drag over the window, then **Record**. Stop from the menu bar.
- Record each shot **a little longer than its length** below; the slot can trim the start (`start`) and speed it up (`speed`).
- Save each clip as `video/public/recordings/<name>.mov`. Recordings stay on your Mac: that folder is ignored by git.

## The shots

| Name | Length | What to do on screen |
|---|---|---|
| `install` | 20s | In Claude Code, type the two `/plugin` lines from the README, one at a time, and let each finish. |
| `setup` | 45s | Say **“Set up StudioWall.”** Choose `~/Projects` (the demo projects), let Claude read them, accept the list, and let the board open. Speed this one up later rather than rushing it. |
| `board` | 35s | On the open board: click **About**, **Status** and the **Notes** tab on a card; type a short note; hover the stacked-frames icon; drag a card down to **Resting**; click the **Your calls** filter. |
| `wrap-up` | 30s | Open a session in one demo project's folder (Tide Clock is the clearest). Say **“wrap up”**, let it finish, then switch to the board and show the card that changed. |
| `panel` | 20s | With the panel plugin installed, open a session in a demo project: show the row above the prompt, open the decisions list with **›**, press **⠿** to open the board. |
| `schedule` | 20s | In the Claude app, create the daily scheduled task with the prompt **“Run the light-table-sweep skill.”**, then press **Run now** once. |

## Putting a clip in

In `src/script.ts`, find the slot in `LONG` by its `id` and add the file:

```ts
{ type: "recording", id: "setup", file: "recordings/setup.mov", start: 2, speed: 1.5, ... }
```

- `start`: seconds to cut from the beginning. `speed`: 1.5 plays it half again as fast.
- `length`: how long the slot runs in the video.
- `captions`: lines shown over the clip, each from `at` seconds until the next one.
- `zoom`: optional camera moves into the recording, e.g. `[{ at: 0, x: 960, y: 540, s: 1 }, { at: 6, x: 700, y: 820, s: 1.8 }]` pushes in on the prompt area by second 6.

Or just tell Claude “the setup clip is in, it starts after two seconds” and it will fill these in. Then `npm run studio` to watch it, and `npm run render:long` to write `out/studiowall-tour.mp4`.
