"""Draw invented app screens for the Light Table demo and capture them as PNGs.

  python3 demo/make-screenshots.py demo/projects              redraw every demo project
  python3 demo/make-screenshots.py demo/projects tide-clock   just one

Needs Google Chrome. Everything drawn here is made up.
"""
import math, os, random, subprocess, tempfile, shutil, sys
OUT = sys.argv[1]  # demo/projects
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
random.seed(7)
BASE = "<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box;margin:0}body{width:1440px;height:900px;overflow:hidden;font-family:-apple-system,Helvetica,Arial,sans-serif}</style>"

def shot(html, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    d = tempfile.mkdtemp()
    import re
    html = re.sub(r"(?<=[^\s\"])/>", " />", html)
    f = os.path.join(d, "p.html"); open(f, "w").write(BASE + html)
    import time
    if os.path.exists(dest): os.remove(dest)
    proc = subprocess.Popen([CHROME, "--headless=new", "--hide-scrollbars", "--no-first-run", f"--user-data-dir={d}/prof",
                    "--window-size=1440,900", "--timeout=1500", f"--screenshot={dest}", "file://" + f],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    last, end = -1, time.time() + 40
    while time.time() < end and proc.poll() is None:
        time.sleep(0.5)
        size = os.path.getsize(dest) if os.path.exists(dest) else -1
        if size > 0 and size == last: break
        last = size
    if proc.poll() is None:
        os.killpg(proc.pid, 9); proc.wait()
    shutil.rmtree(d, ignore_errors=True)
    print("wrote", os.path.relpath(dest, OUT))

def tide(view):
    pts = " ".join(f"{x},{450 - 160*math.sin(x/115 + 0.6) - 30*math.sin(x/37)}" for x in range(0, 1441, 8))
    dial = "".join(f'<line x1="720" y1="190" x2="720" y2="215" stroke="#9cc3e6" stroke-width="3" transform="rotate({a} 720 450)"/>' for a in range(0, 360, 30))
    if view == "dial":
        body = f'<svg width=1440 height=900><circle cx=720 cy=450 r=270 fill="#0f2238" stroke="#2c5b87" stroke-width=4/>{dial}<clipPath id=c><circle cx=720 cy=450 r=268 /></clipPath><path clip-path="url(#c)" d="M440 520 Q 580 470 720 520 T 1000 510 L1000 730 L440 730 Z" fill="#3d7cb8" opacity=.8 /><line x1=720 y1=450 x2=880 y2=300 stroke="#f1d38a" stroke-width=8 stroke-linecap=round/><circle cx=720 cy=450 r=14 fill="#f1d38a"/><text x=720 y=640 fill="#cfe2f3" font-size=34 text-anchor=middle>High tide in 2h 14m</text><text x=720 y=690 fill="#6f97bd" font-size=22 text-anchor=middle>Pier 7 · waxing gibbous</text></svg>'
    elif view == "curve":
        body = f'<svg width=1440 height=900><polyline points="{pts}" fill="none" stroke="#5ea3e0" stroke-width=5/><line x1=610 y1=150 x2=610 y2=750 stroke="#f1d38a" stroke-dasharray="6 8"/><text x=80 y=110 fill="#cfe2f3" font-size=40>Today’s tide</text><text x=80 y=820 fill="#6f97bd" font-size=24>00:00</text><text x=1300 y=820 fill="#6f97bd" font-size=24>24:00</text></svg>'
    else:
        rows = "".join(f'<div style="padding:22px 30px;border-bottom:1px solid #1f3a57;color:#cfe2f3;font-size:26px;display:flex;justify-content:space-between"><span>{n}</span><span style="color:#6f97bd">{m} km</span></div>' for n, m in [("Pier 7", 0.4), ("North Breakwater", 2.1), ("Harbor Light", 3.8), ("Gull Point", 6.5), ("Old Ferry Dock", 9.2)])
        body = f'<div style="padding:80px 300px"><div style="color:#cfe2f3;font-size:40px;margin-bottom:30px">Choose a station</div><div style="background:#0f2238;border-radius:16px;overflow:hidden">{rows}</div></div>'
    return f'<body style="background:#0a1726">{body}'

def moth(view):
    dots = "".join(f'<circle cx="{random.randint(80,1360)}" cy="{random.randint(150,760)}" r="{random.choice([2,3,3,4,6])}" fill="#e8d9a8" opacity="{random.random()*.7+.3}"/>' for _ in range(160))
    if view == "map":
        body = f'<svg width=1440 height=900>{dots}<circle cx=930 cy=380 r=26 fill="none" stroke="#f5c76b" stroke-width=3/><text x=80 y=100 fill="#f3ead2" font-size=44 font-family=Georgia>Moth Radio</text><text x=80 y=145 fill="#8f8a7a" font-size=22>it is night here · 214 microphones listening</text></svg><div style="position:absolute;left:80px;bottom:70px;right:80px;background:#1b1a22;border-radius:14px;padding:26px 30px;color:#f3ead2;font-size:24px;display:flex;gap:30px;align-items:center"><span style="width:56px;height:56px;border-radius:50%;background:#f5c76b;display:inline-block"></span><span>Crickets, Oaxaca · 02:13 local</span><span style="flex:1;height:6px;background:#3a3846;border-radius:3px"><span style="display:block;width:38%;height:6px;background:#f5c76b;border-radius:3px"></span></span></div>'
    else:
        zones = "".join(f'<div style="padding:18px 26px;border-radius:12px;background:{"#2a2733" if i==3 else "#16151c"};color:#f3ead2;font-size:24px">UTC{z:+d} · {c}</div>' for i, (z, c) in enumerate([(-8,"Pacific"),(-6,"Mexico City"),(-3,"São Paulo"),(1,"Lagos"),(5,"Karachi"),(9,"Seoul")]))
        body = f'<div style="padding:90px 320px;display:grid;gap:14px"><div style="color:#f3ead2;font-size:40px;font-family:Georgia;margin-bottom:20px">Pick a time zone</div>{zones}</div>'
    return f'<body style="background:#0d0c12;position:relative">{body}'

def letterpress(view):
    if view == "home":
        body = '<div style="padding:70px 110px;color:#2b2622"><div style="display:flex;justify-content:space-between;font-size:20px;letter-spacing:.2em"><span>HOLLOW OAK PRESS</span><span>WORK · ABOUT · SHOP</span></div><div style="font-family:Georgia;font-size:130px;line-height:1;margin-top:150px;max-width:1000px">Words, pressed<br>into paper.</div><div style="margin-top:50px;font-size:26px;color:#7a6e62;max-width:640px">Wedding suites, broadsides and small books, printed by hand on a 1912 Chandler &amp; Price.</div></div>'
    else:
        cards = "".join(f'<div style="background:{c};height:330px;border-radius:4px;box-shadow:0 2px 0 #d8cfc0"></div>' for c in ["#e9dfcf", "#d6c4a8", "#c8d3cf", "#e3c9b8", "#d9d2c4", "#bfc9b4"])
        body = f'<div style="padding:70px 110px"><div style="font-family:Georgia;font-size:54px;color:#2b2622;margin-bottom:40px">Recent work</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px">{cards}</div></div>'
    return f'<body style="background:#f4eee3">{body}'

def pixel(view):
    cells = []
    for y in range(18):
        for x in range(30):
            v = random.random()
            c = "#1e3b24" if y > 13 else ("#3f8f4a" if v > .93 and y > 6 else ("#e6c34a" if v > .985 else "#14251a"))
            cells.append(f'<div style="background:{c}"></div>')
    grid = "".join(cells)
    hud = '<div style="position:absolute;top:30px;left:40px;color:#e6f2c8;font:28px monospace">SEEDS 12 · DAY 4</div>' if view == "play" else '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:80px monospace;color:#e6f2c8;text-shadow:6px 6px 0 #1e3b24">PIXEL GARDEN</div>'
    return f'<body style="background:#0c160f;position:relative"><div style="display:grid;grid-template-columns:repeat(30,48px);grid-auto-rows:50px">{grid}</div>{hud}'

def loom(view):
    rows = []
    for y in range(36):
        for x in range(57):
            on = ((x // 3 + y // 3) % 4 < 2) ^ ((x + y) % 7 == 0) if view == "pattern" else ((x * y) % 5 < 2)
            rows.append(f'<div style="background:{"#c0472f" if on else "#efe4cc"}"></div>')
    return f'<body style="background:#222"><div style="display:grid;grid-template-columns:repeat(57,25.26px);grid-auto-rows:25px">{"".join(rows)}</div>'

def field(view):
    def wave(seed):
        random.seed(seed)
        return "".join(f'<rect x="{i*6}" y="{40-h}" width="4" height="{2*h}" fill="#b9d8c2"/>' for i, h in enumerate(abs(random.gauss(0, 12)) + 2 for _ in range(150)))
    clips = [("Rain on tin roof", "0:48", "rain, night"), ("Ferry horn, fog", "1:12", "harbor"), ("Starlings at dusk", "2:05", "birds"), ("Kitchen radio", "0:33", "voices"), ("Ice cracking", "1:40", "winter")]
    rows = "".join(f'<div style="display:flex;align-items:center;gap:30px;padding:18px 0;border-bottom:1px solid #263a2e"><span style="width:300px;color:#e7f1e9;font-size:24px">{n}</span><svg width=900 height=80>{wave(i)}</svg><span style="color:#7fa08b;font-size:22px">{d} · {t}</span></div>' for i, (n, d, t) in enumerate(clips))
    return f'<body style="background:#121d17;padding:70px 80px"><div style="color:#e7f1e9;font-size:40px;margin-bottom:30px">Side A · 5 of 12 chosen</div>{rows}'

def zine(view):
    stars = "".join(f'<circle cx="{random.randint(60,1380)}" cy="{random.randint(60,840)}" r="{random.choice([1,1,2,3])}" fill="#fff"/>' for _ in range(260))
    return f'<body style="background:#101018"><svg width=1440 height=900>{stars}<polyline points="300,300 420,260 560,330 640,240 760,280" fill="none" stroke="#7d8cff" stroke-width=2/><text x=720 y=760 fill="#c9cdf7" font-size=64 text-anchor=middle font-family=Georgia>STAR CHART ZINE №3</text></svg>'

P = {
  "tide-clock": [("tide-clock-current", tide, "dial"), ("curve", tide, "curve"), ("stations", tide, "stations")],
  "moth-radio": [("moth-radio-current", moth, "map"), ("time-zones", moth, "zones")],
  "letterpress-site": [("letterpress-current", letterpress, "home"), ("work-grid", letterpress, "grid")],
  "pixel-garden": [("pixel-garden-current", pixel, "play"), ("title", pixel, "title")],
  "loom-sim": [("loom-sim-current", loom, "pattern"), ("twill", loom, "twill")],
  "Sound/field-recordings": [("field-recordings-current", field, "list")],
  "star-chart-zine": [("star-chart-current", zine, "cover")],
}
for folder, shots in P.items():
    if len(sys.argv) > 2 and folder not in sys.argv[2:]: continue
    for name, fn, view in shots:
        shot(fn(view), os.path.join(OUT, folder, "screenshots", name + ".png"))
