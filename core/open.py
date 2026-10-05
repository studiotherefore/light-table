#!/usr/bin/env python3
"""Open the board: rebuild it, start its local server if it isn't running, open it in the browser.

  python3 core/open.py            build, serve, open
  python3 core/open.py --no-open  build and serve only (for agents that show it themselves)

The server keeps running in the background after this exits. Its log goes to
server.log in the table folder.
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

import socket

from config import BOARD_URL, CORE, HOME, PORT, require_root, table_path


def board_is_up():
    """True when this table's server answers; stops if something else holds the port."""
    try:
        with urllib.request.urlopen(BOARD_URL + "api/ping", timeout=1) as r:
            home = json.load(r).get("home")
    except Exception:
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", PORT)) != 0:
                return False
        home = None
    if home != HOME:
        sys.exit(f"Port {PORT} is already used by another program or another board. "
                 f"Pick a free \"port\" in {table_path('config.json')}.")
    return True


def main():
    require_root()
    subprocess.run([sys.executable, os.path.join(CORE, "build.py")], check=True)
    if not board_is_up():
        log = open(table_path("server.log"), "a")
        subprocess.Popen([sys.executable, os.path.join(CORE, "server.py")], cwd=CORE,
                         stdout=log, stderr=log, start_new_session=True)
        for _ in range(20):
            time.sleep(0.25)
            if board_is_up():
                break
        else:
            sys.exit(f"The board server didn't start; see {table_path('server.log')}")
    print(BOARD_URL)
    if "--no-open" not in sys.argv:
        subprocess.run(["/usr/bin/open", BOARD_URL])


if __name__ == "__main__":
    main()
