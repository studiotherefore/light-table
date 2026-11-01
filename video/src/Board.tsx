// The captured demo board as a camera can move over it.
// A camera names the board point (cx, cy, in the page's CSS pixels) shown at the
// centre of the frame, and the zoom s (screen pixels per CSS pixel).
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import layout from "../public/board/layout.json";
import { C } from "./theme";

export type Rect = { x: number; y: number; w: number; h: number };
export type Camera = { cx: number; cy: number; s: number };
export type Key = Camera & { at: number };

export const L = layout;
export const W = 1920, H = 1080;

// Ease between camera keys; zoom moves in log space so push-ins feel even.
export function cameraAt(keys: Key[], frame: number): Camera {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (frame <= b.at) {
      const t = interpolate(frame, [a.at, b.at], [0, 1], { easing: Easing.inOut(Easing.cubic) });
      return {
        cx: a.cx + (b.cx - a.cx) * t,
        cy: a.cy + (b.cy - a.cy) * t,
        s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t),
      };
    }
  }
  return keys[keys.length - 1];
}

// Where a board rect lands on screen under a camera.
export function onScreen(r: Rect, cam: Camera): Rect {
  return { x: W / 2 + (r.x - cam.cx) * cam.s, y: H / 2 + (r.y - cam.cy) * cam.s, w: r.w * cam.s, h: r.h * cam.s };
}

// A camera that puts the centre of rect r at screen point (sx, sy) with zoom s.
export function frameOn(r: Rect, s: number, sx = W / 2, sy = H / 2): Camera {
  return { cx: r.x + r.w / 2 + (W / 2 - sx) / s, cy: r.y + r.h / 2 + (H / 2 - sy) / s, s };
}

export const BoardImage: React.FC<{ cam: Camera; src?: "board" | "board-before"; clip?: Rect; reveal?: number }> = ({ cam, src = "board", clip, reveal = 1 }) => {
  const { w, h } = L.after.page;
  let clipPath: string | undefined;
  if (clip) {
    const r = onScreen(clip, cam);
    const top = r.y, bottom = H - (r.y + r.h * reveal);
    clipPath = `inset(${top}px ${W - (r.x + r.w)}px ${bottom}px ${r.x}px round ${10 * cam.s}px)`;
  } else if (reveal < 1) {
    clipPath = `inset(0 0 ${H * (1 - reveal)}px 0)`;
  }
  return (
    <AbsoluteFill style={{ clipPath }}>
      <Img
        src={staticFile(`board/${src}.png`)}
        style={{
          position: "absolute", left: 0, top: 0, width: w, height: h,
          transformOrigin: "0 0",
          transform: `translate(${W / 2 - cam.cx * cam.s}px, ${H / 2 - cam.cy * cam.s}px) scale(${cam.s})`,
        }}
      />
    </AbsoluteFill>
  );
};

// A grease-pencil outline around part of the board.
export const Outline: React.FC<{ r: Rect; cam: Camera; opacity: number; color?: string; pad?: number }> = ({ r, cam, opacity, color = C.accent, pad = 8 }) => {
  const q = onScreen({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }, cam);
  return (
    <div style={{
      position: "absolute", left: q.x, top: q.y, width: q.w, height: q.h, opacity,
      border: `3px solid ${color}`, borderRadius: 10, boxShadow: `0 0 0 9999px rgba(16,18,21,${0.45 * opacity}), 0 0 40px ${color}55`,
    }} />
  );
};
