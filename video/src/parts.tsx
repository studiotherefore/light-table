import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";

// The ∴ mark, as drawn at the top of the board.
export const Mark: React.FC<{ size: number; dots?: number }> = ({ size, dots = 3 }) => (
  <svg viewBox="13.4 15.4 37.2 33.4" style={{ height: size, width: "auto", color: C.accent, flex: "none" }} aria-hidden>
    <g fill="currentColor">
      {[[32, 20], [18, 44.2], [46, 44.2]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={4.6} opacity={Math.max(0, Math.min(1, dots - i))} />
      ))}
    </g>
  </svg>
);

// Fades and lifts its children in from `from`, and out again at `to` (frames, local to the scene).
export const Appear: React.FC<{ from: number; to?: number; lift?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ from, to, lift = 16, style, children }) => {
  const f = useCurrentFrame();
  const inn = interpolate(f, [from, from + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = to === undefined ? 1 : interpolate(f, [to - 10, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity: inn * out, transform: `translateY(${(1 - inn) * lift}px)`, ...style }}>{children}</div>;
};

// A caption in the board's label style: a small uppercase kicker and a line of text.
export const Caption: React.FC<{ kicker?: string; kickerColor?: string; text: React.ReactNode; size?: number }> = ({ kicker, kickerColor = C.accent, text, size = 44 }) => (
  <div style={{ fontFamily: FONT.display }}>
    {kicker && (
      <div style={{ font: `650 20px/1 ${FONT.display}`, letterSpacing: "0.16em", textTransform: "uppercase", color: kickerColor, marginBottom: 18 }}>{kicker}</div>
    )}
    <div style={{ fontSize: size, lineHeight: 1.18, fontWeight: 560, fontStretch: "88%", color: C.ink, letterSpacing: "-0.01em" }}>{text}</div>
  </div>
);
