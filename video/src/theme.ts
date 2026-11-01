// The board's own colours and type (core/template.html), so the video looks like the board.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { continueRender, delayRender } from "remotion";

export const C = {
  ground: "#101215",
  sheet: "#181b20",
  sheet2: "#1f232a",
  ink: "#e9ebef",
  ink2: "#aeb5c0",
  ink3: "#757d8a",
  rule: "#2a2f37",
  ruleHi: "#3a414c",
  accent: "#93a6ff",
  go: "#6fd3a0",
  wait: "#f0b45a",
};

export const FONT = {
  display: '"Archivo Variable", "Helvetica Neue", Arial, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
};

export const FPS = 30;
export const s = (seconds: number) => Math.round(seconds * FPS);

// Hold the first frame until the fonts are in, so no frame renders in a fallback face.
const fontsReady = delayRender("Loading fonts");
Promise.all([
  document.fonts.load('700 40px "Archivo Variable"'),
  document.fonts.load('400 20px "Archivo Variable"'),
  document.fonts.load('400 20px "IBM Plex Mono"'),
  document.fonts.load('500 20px "IBM Plex Mono"'),
]).then(() => continueRender(fontsReady), () => continueRender(fontsReady));
