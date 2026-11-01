// Scenes only the long video uses: chapter cards, lists of points, and recording slots.
import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { cameraAt } from "../Board";
import { Appear, Caption, Mark } from "../parts";
import type { Part } from "../script";
import { C, FONT, s } from "../theme";

type Of<T extends Part["type"]> = Extract<Part, { type: T }>;

export const Chapter: React.FC<{ part: Of<"chapter"> }> = ({ part }) => {
  const f = useCurrentFrame();
  const rule = interpolate(f, [4, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.ground, justifyContent: "center", padding: "0 160px" }}>
      <Appear from={0}>
        <div style={{ font: `400 30px/1 ${FONT.mono}`, color: C.accent }}>{part.n}</div>
        <div style={{ font: `760 120px/1.05 ${FONT.display}`, fontStretch: "72%", textTransform: "uppercase", color: C.ink, marginTop: 22 }}>{part.title}</div>
      </Appear>
      <div style={{ height: 3, background: C.ink, marginTop: 28, width: `${rule * 100}%` }} />
      <Appear from={10}>
        <div style={{ marginTop: 30, font: `500 44px/1.25 ${FONT.display}`, fontStretch: "90%", color: C.ink2 }}>{part.line}</div>
      </Appear>
    </AbsoluteFill>
  );
};

export const Points: React.FC<{ part: Of<"points"> }> = ({ part }) => (
  <AbsoluteFill style={{ background: C.ground, justifyContent: "center", padding: "0 160px" }}>
    <Appear from={2}>
      <div style={{ font: `650 20px/1 ${FONT.display}`, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, marginBottom: 40 }}>{part.kicker}</div>
    </Appear>
    {part.points.map((p, i) => (
      <Appear key={p} from={10 + i * s(Math.min(2.4, (part.length - 3) / part.points.length))}>
        <div style={{ display: "flex", gap: 28, alignItems: "baseline", padding: "22px 0", borderTop: `1px solid ${C.rule}` }}>
          <Mark size={22} />
          <div style={{ font: `500 40px/1.3 ${FONT.display}`, fontStretch: "90%", color: C.ink }}>{p}</div>
        </div>
      </Appear>
    ))}
  </AbsoluteFill>
);

// A screen recording, with captions and optional zooms. Until the clip exists
// (its `file` is set in script.ts), a placeholder says what to record.
export const Recording: React.FC<{ part: Of<"recording"> }> = ({ part }) => {
  const f = useCurrentFrame();
  const caps = part.captions ?? [];
  const cap = [...caps].reverse().find(c => f >= s(c.at));
  const capEnd = cap ? (caps[caps.indexOf(cap) + 1]?.at ?? part.length) : 0;
  const zoom = part.zoom?.length
    ? cameraAt(part.zoom.map(z => ({ at: s(z.at), cx: z.x, cy: z.y, s: z.s })), f)
    : { cx: 960, cy: 540, s: 1 };
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      {part.file ? (
        <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${960 - zoom.cx * zoom.s}px, ${540 - zoom.cy * zoom.s}px) scale(${zoom.s})` }}>
          <OffthreadVideo src={staticFile(part.file)} startFrom={s(part.start ?? 0)} playbackRate={part.speed ?? 1} muted style={{ width: 1920, height: 1080, objectFit: "contain" }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ padding: 90 }}>
          <div style={{ flex: 1, border: `3px dashed ${C.ruleHi}`, borderRadius: 24, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 110px", background: C.sheet }}>
            <div style={{ font: `400 24px/1 ${FONT.mono}`, color: C.wait }}>recording to come · {part.length}s · public/recordings/{part.id}.mov</div>
            <div style={{ font: `700 72px/1.1 ${FONT.display}`, fontStretch: "80%", color: C.ink, marginTop: 26 }}>{part.title}</div>
            <div style={{ font: `400 34px/1.4 ${FONT.display}`, color: C.ink2, marginTop: 26, maxWidth: 1300 }}>{part.what}</div>
          </div>
        </AbsoluteFill>
      )}
      {cap && part.file && (
        <Appear key={cap.at} from={s(cap.at)} to={s(capEnd)} style={{ position: "absolute", left: 90, bottom: 70, maxWidth: 1100, background: `${C.ground}e8`, borderRadius: 14, padding: "22px 30px", border: `1px solid ${C.rule}` }}>
          <Caption text={cap.text} size={36} />
        </Appear>
      )}
    </AbsoluteFill>
  );
};
