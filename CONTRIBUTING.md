# Contributing

Light Table is a personal project, made by an artist for artists and designers, and shared as is. You don't need to write code to help.

## Ways to help

- **Tell me what didn't work.** [Open an issue](https://github.com/studiotherefore/light-table/issues/new/choose) and choose **Something isn't working**. Say what you did, what you expected and what you saw. Please don't paste your `projects.json` or a screenshot of your own board: issues are public, and those hold your project names and notes.
- **Share an idea.** Choose **An idea** on the same page. Describe the situation first (what you were doing, what was missing), then the idea.
- **Security problems** go privately through the repo's **Security** tab. See [SECURITY.md](SECURITY.md).

## Changing the code

Small fixes are welcome as pull requests. For anything bigger, open an issue first so we can agree on it before you spend time.

To see your change on the demo board:

```bash
LIGHT_TABLE_HOME=demo/table python3 core/open.py
```

A few rules the project keeps:

- **Project folders are only ever read.** Code and skills write only inside the table folder (`~/.light-table` or `$LIGHT_TABLE_HOME`). Never edit, commit or push in someone's project folder.
- **No private data in the repo.** Demo projects are invented. Don't add real project names, notes, paths or screenshots.
- **No new dependencies** beyond Python 3 and what ships with macOS.
- **Plain words on the board.** The people using it are artists and designers, not necessarily developers.

The online demo is built from `demo/` by `demo/export-site.py`; it refuses to publish if any local path or `localhost` link is left in the page.

Fixes and replies come as time allows. Thank you for helping.
