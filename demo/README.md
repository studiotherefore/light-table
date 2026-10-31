# Demo board

An invented set of projects, so you can see Light Table before pointing it at your own work.

```bash
LIGHT_TABLE_HOME=demo/table python3 core/open.py
```

It opens on port 8131. Everything here is made up: `table/` is the demo's table folder (config and record), `projects/` holds stand-in project folders with a README and screenshots each. Demo mode (`"demo": true` in its config) shifts the dates so the newest project always reads "today".

The stand-in screenshots are drawn by `make-screenshots.py`.

The online demo is made by `export-site.py`, which builds this board as a read-only website. GitHub publishes it daily and on each change (`.github/workflows/demo-site.yml`).
