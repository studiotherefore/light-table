// Capture the demo board as stills for the video, in two states:
//   board.png         the demo board as it is (demo/table + demo/projects)
//   board-before.png  the same board with Tide Clock as it stood before its last "wrap up"
// plus layout.json, where each part of the page sits, so the video can zoom to it.
//
//   npm run capture            (needs Python 3 and Google Chrome; on a Mac, also sips, built in)
//
// Everything captured is the invented demo board. Builds happen in a temporary
// folder: the repo's demo files are copied, never changed.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const OUT = path.resolve(HERE, "..", "public", "board");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTH = 1600, HEIGHT = 1000, SCALE = 2;

// Tide Clock a few days earlier: the curve drew, the dial didn't yet.
const BEFORE = {
  now: "The tide curve draws from saved sample data. The dial is sketched on paper, not in code yet.",
  nextStep: "Draw the dial and the moon phase from the same tide data.",
  calls: ["Choose between the two dial designs in docs/dials.md"],
  lastWorked: "2026-09-29",
  updated: "2026-09-29",
};

function build(name, change) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `light-table-video-${name}-`));
  const table = path.join(tmp, "table"), projects = path.join(tmp, "projects");
  fs.cpSync(path.join(REPO, "demo", "projects"), projects, { recursive: true });
  fs.mkdirSync(table);
  for (const f of ["config.json", "projects.json", "notes.json"])
    fs.copyFileSync(path.join(REPO, "demo", "table", f), path.join(table, f));
  change?.(table, projects);
  execFileSync("python3", [path.join(REPO, "core", "build.py")],
    { env: { ...process.env, LIGHT_TABLE_HOME: table }, stdio: "inherit" });
  const file = path.join(table, "dashboard.html");
  // Gallery thumbnails are served from the server's root; here they sit next to the page.
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll('"/thumbs/', '"thumbs/'));
  return { file, tmp };
}

function before(table, projects) {
  const record = JSON.parse(fs.readFileSync(path.join(table, "projects.json"), "utf8"));
  Object.assign(record.projects.find(p => p.id === "tide-clock"), BEFORE);
  fs.writeFileSync(path.join(table, "projects.json"), JSON.stringify(record, null, 1));
  // Its cover was the tide curve then.
  const shots = path.join(projects, "tide-clock", "screenshots");
  fs.rmSync(path.join(shots, "tide-clock-current.png"));
  fs.renameSync(path.join(shots, "curve.png"), path.join(shots, "tide-clock-current.png"));
}

async function capture(browser, file, png) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE });
  await page.goto("file://" + file);
  await page.evaluate(async () => {
    document.getElementById("archive-box").open = true;
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, png), fullPage: true });
  const layout = await page.evaluate(() => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
    const card = document.querySelector('.slide[data-id="tide-clock"]');
    return {
      page: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
      header: box(document.querySelector("header")),
      card: box(card),
      shot: box(card.querySelector(".shot")),
      now: box(card.querySelector(".now")),
      next: box(card.querySelector(".next")),
      calls: box(card.querySelector(".calls")),
      resting: box(document.getElementById("rest-h")?.closest("section")),
      archive: box(document.getElementById("archive-box")),
    };
  });
  await page.close();
  return layout;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const after = build("after"), earlier = build("before", before);
const layout = { scale: SCALE, after: await capture(browser, after.file, "board.png"),
  before: await capture(browser, earlier.file, "board-before.png") };
await browser.close();
for (const b of [after, earlier]) fs.rmSync(b.tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, "layout.json"), JSON.stringify(layout, null, 1) + "\n");

// A guard like the online demo's: no local paths in what gets committed.
const text = fs.readFileSync(path.join(OUT, "layout.json"), "utf8");
if (/file:|\/Users\/|localhost/.test(text)) throw new Error("capture: a local path got into layout.json");
console.log("capture: wrote", path.relative(REPO, OUT));
