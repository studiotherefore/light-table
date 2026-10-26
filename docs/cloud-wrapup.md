# End-of-session block for cloud sessions

Sessions on this Mac don't need this: the panel's Add to board and the nightly sweep already see their work. Sessions that run somewhere else can't. That means cloud sessions, another Claude account, Codex in the cloud, or another machine. Their work only reaches the board through GitHub: the session pushes its handoff and screenshots, and each night `core/cloud.py` reads them (read-only) and updates the card. The card says so if the branch isn't merged yet.

Light Table never writes into project folders, so you paste the block below yourself, once per project, at the end of the project's `CLAUDE.md` (or `AGENTS.md`) in its current repo. If cloud work turns up on a project whose `CLAUDE.md` has no block, the nightly sweep adds a decision to its card asking you to paste it.

`cloud.py` needs the GitHub CLI (`gh`), signed in with read access to the repos. If a project's current repo isn't its local folder's `origin`, set the entry's `github` field to `"owner/repo"` (see `core/RECORD.md`).

## The block

Replace `<handoff>` with the handoff path in the repo, and `<project>` with the project's board id (its `id` in the table folder's `projects.json`). For a Mac app that can't run in the cloud, drop the "Yours" bullet of step 3.

```markdown
## End of a session (local or cloud, any account)

When I say "wrap up", or before a session ends:

1. Update `<handoff>`. At the top, add today's date, then:
   - where things stand, in one or two sentences;
   - the single next step;
   - decisions only I can make, short and written as instructions to me. Remove any that are settled.
2. Say which branch the work is on and whether it's merged into main.
3. Screenshots for my Light Table board. They all live in `screenshots/` at the top of the repo:
   - **Mine (the cover):** exactly one file with "current" in its name, `screenshots/<project>-current.png`. When I give you a screenshot and say to make it the current one, save that exact image under that name. Don't retake, crop or edit it. If you can't get at the image file itself, tell me; don't recreate it.
   - **Only one "current":** before saving a new one, rename the old one to the date it was made current (or its last commit date), e.g. `<project>-2026-10-26.png`. Never delete it. If I say "drop the current screenshot", rename it the same way.
   - **Yours:** at the end of a session, if the project has a page you can run here, open its main view in a headless browser at 1440×900 and save the full view (not a detail) as `screenshots/<project>-session.png`. Skip it if it can't run here (a Mac app, say); never commit a blank or error page. Replace the last one; don't keep a series.
   - Never put "current" in any other file name. Keep each image under about 2 MB (save as .jpg if it's bigger).
   - One time: if a `.board/` folder exists, move its images into `screenshots/` under these names, then delete `.board/`.
4. Commit the handoff (and any screenshots) with the work and push the branch.
```

## Screenshots

- **Your pick:** `<project>-current.png` always wins the cover. There's only ever one. The old one is renamed to its date, never deleted, so the history stays.
- **The session's capture:** `<project>-session.png`, the full main view, replaced at each wrap-up. It's used when you have no current pick.
- Say "drop the current screenshot" to go back to the session's captures.

Not yet confirmed: a session may not be able to save an image you paste into the chat as a file. If it says it can't, attach the image as a file instead, or upload it on GitHub (the repo → `screenshots` → Add file → Upload files) as `<project>-current.png`, renaming the old one yourself.
