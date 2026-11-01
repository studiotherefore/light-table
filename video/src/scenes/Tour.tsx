// One continuous camera move over the demo board: the whole board, one card, its
// status, then the resting rows and the archive.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BoardImage, cameraAt, frameOn, Key, L, Outline } from "../Board";
import { Appear, Caption } from "../parts";
import { SHORT, TOUR } from "../script";
import { C, s } from "../theme";

const B = L.after;
const status = { x: B.now.x, y: B.now.y, w: B.now.w, h: B.calls.y + B.calls.h - B.now.y };
const rest = { x: B.resting.x, y: B.resting.y, w: B.resting.w, h: B.archive.y + B.archive.h - B.resting.y };

// When each beat starts, in frames.
const b = TOUR.beats;
export const T = { card: s(b.card), status: s(b.status), now: s(b.now), next: s(b.next), calls: s(b.calls), rest: s(b.rest), end: s(SHORT.scenes.tour) };

const KEYS: Key[] = [
  { at: 0, ...frameOn({ x: 0, y: 0, w: 1600, h: 900 }, 1.2) },
  { at: T.card - 10, ...frameOn({ x: 0, y: 110, w: 1600, h: 900 }, 1.24) },
  { at: T.card + 45, ...frameOn(B.card, 1.6, 560) },
  { at: T.status, ...frameOn(B.card, 1.64, 560) },
  { at: T.now, ...frameOn({ ...B.card, y: status.y - 140, h: status.h + 280 }, 2.3, 640) },
  { at: T.rest - 15, ...frameOn({ ...B.card, y: status.y - 140, h: status.h + 280 }, 2.36, 640) },
  { at: T.rest + 40, ...frameOn(rest, 1.3, 960, 640) },
  { at: T.end, ...frameOn(rest, 1.34, 960, 640) },
];

const pulse = (f: number, a: number, b: number) =>
  interpolate(f, [a, a + 12, b - 10, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Tour: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(KEYS, f);
  const side: React.CSSProperties = { position: "absolute", left: 1250, right: 80, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" };
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <BoardImage cam={cam} />
      <Outline r={B.now} cam={cam} opacity={pulse(f, T.now, T.next)} />
      <Outline r={B.next} cam={cam} opacity={pulse(f, T.next, T.calls)} />
      <Outline r={B.calls} cam={cam} opacity={pulse(f, T.calls, T.rest - 20)} color={C.wait} />

      {/* the whole board */}
      <AbsoluteFill style={{ background: `linear-gradient(to top, ${C.ground} 0%, ${C.ground}e6 22%, transparent 46%)`, opacity: interpolate(f, [10, 30, T.card - 15, T.card + 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      <Appear from={20} to={T.card} style={{ position: "absolute", left: 140, bottom: 90 }}>
        <Caption {...TOUR.board} size={58} />
      </Appear>

      {/* one card: a dark wash on the right keeps the captions clear of the next card */}
      <AbsoluteFill style={{ background: `linear-gradient(to left, ${C.ground} 0%, ${C.ground} 37%, ${C.ground}00 42%)`, opacity: interpolate(f, [T.card + 20, T.card + 45, T.rest - 10, T.rest + 15], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      <Appear from={T.card + 40} to={T.now - 4} style={side}>
        <Caption {...TOUR.card} kickerColor={C.go} />
      </Appear>
      <Appear from={T.now + 6} to={T.next} style={side}>
        <Caption {...TOUR.now} />
      </Appear>
      <Appear from={T.next + 6} to={T.calls} style={side}>
        <Caption {...TOUR.next} />
      </Appear>
      <Appear from={T.calls + 6} to={T.rest - 16} style={side}>
        <Caption {...TOUR.calls} kickerColor={C.wait} />
      </Appear>

      {/* resting and archive */}
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${C.ground} 0%, ${C.ground}f0 26%, transparent 42%)`, opacity: interpolate(f, [T.rest + 20, T.rest + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      <Appear from={T.rest + 35} style={{ position: "absolute", left: 140, top: 110 }}>
        <Caption {...TOUR.rest} kickerColor={C.ink2} size={52} />
      </Appear>
    </AbsoluteFill>
  );
};
