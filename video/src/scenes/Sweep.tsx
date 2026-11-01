// The nightly sweep: a pass over every project, reading what changed.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Appear, Caption } from "../parts";
import { SWEEP } from "../script";
import { C, FONT, s } from "../theme";

const COLOR = { updated: C.go, noted: C.wait, unchanged: C.ink3 };
const ROWS = SWEEP.rows.map(r => ({ name: r.name, kind: r.type, result: r.result, color: COLOR[r.kind] }));
const START = s(SWEEP.startAt), EACH = s(SWEEP.eachRow), SCAN = Math.round(EACH * 0.85);

export const Sweep: React.FC = () => {
  const f = useCurrentFrame();
  const minute = Math.min(59, Math.max(0, Math.floor((f - START) / 3)));
  const done = START + ROWS.length * EACH + SCAN;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <Appear from={4} style={{ position: "absolute", left: 110, top: 0, bottom: 0, width: 720, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Caption kicker={SWEEP.kicker} kickerColor={C.wait} text={SWEEP.text} size={50} />
        <Appear from={done + 6}>
          <div style={{ marginTop: 56, padding: "22px 26px", border: `1px solid ${C.accent}66`, borderRadius: 12, background: "#93a6ff12", font: `500 30px/1.35 ${FONT.display}`, color: C.ink }}>
            {SWEEP.promise}
          </div>
        </Appear>
      </Appear>

      <Appear from={12} style={{ position: "absolute", left: 930, right: 110, top: 150 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `2px solid ${C.ink}`, paddingBottom: 16 }}>
          <span style={{ font: `650 20px/1 ${FONT.display}`, letterSpacing: "0.16em", textTransform: "uppercase", color: C.ink2 }}>Sweep</span>
          <span style={{ font: `400 24px/1 ${FONT.mono}`, color: C.ink3 }}>{SWEEP.clock}{String(minute).padStart(2, "0")}</span>
        </div>
        {ROWS.map((r, i) => {
          const at = START + i * EACH;
          const scan = interpolate(f, [at, at + SCAN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const shown = f >= at + SCAN;
          return (
            <div key={r.name} style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 18, padding: "20px 4px", borderBottom: `1px solid ${C.rule}`, opacity: f >= at - 4 ? 1 : 0.35 }}>
              <div style={{ position: "absolute", left: 0, bottom: -1, height: 2, width: `${scan * 100}%`, background: C.accent, opacity: shown ? 0 : 1 }} />
              <span style={{ font: `600 30px/1 ${FONT.display}`, fontStretch: "90%", color: C.ink, width: 300 }}>{r.name}</span>
              <span style={{ font: `400 20px/1 ${FONT.mono}`, color: C.ink3, flex: 1 }}>{r.kind}</span>
              <span style={{ font: `400 22px/1 ${FONT.mono}`, color: r.color, opacity: shown ? 1 : 0 }}>{r.result}</span>
            </div>
          );
        })}
      </Appear>
    </AbsoluteFill>
  );
};
