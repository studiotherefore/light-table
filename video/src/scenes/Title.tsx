import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Appear, Mark } from "../parts";
import { C, FONT } from "../theme";

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const dots = interpolate(f, [6, 36], [0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rule = interpolate(f, [30, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <Mark size={78} dots={dots} />
          <Appear from={22} lift={10}>
            <div style={{ font: `760 136px/1 ${FONT.display}`, fontStretch: "72%", textTransform: "uppercase", color: C.ink, letterSpacing: "-0.01em" }}>
              Light Table
            </div>
          </Appear>
        </div>
        <div style={{ height: 4, background: C.ink, marginTop: 30, width: `${rule * 100}%` }} />
        <Appear from={48}>
          <div style={{ marginTop: 34, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ font: `500 46px/1.2 ${FONT.display}`, fontStretch: "90%", color: C.ink2 }}>Every project on one page.</div>
            <div style={{ font: `400 22px/1 ${FONT.mono}`, color: C.ink3 }}>for Mac · with Claude Code</div>
          </div>
        </Appear>
      </div>
    </AbsoluteFill>
  );
};
