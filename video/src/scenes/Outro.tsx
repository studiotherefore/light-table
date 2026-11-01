import React from "react";
import { AbsoluteFill } from "remotion";
import { Appear, Mark } from "../parts";
import { C, FONT } from "../theme";

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 1100 }}>
      <Appear from={4}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Mark size={58} />
          <div style={{ font: `760 100px/1 ${FONT.display}`, fontStretch: "72%", textTransform: "uppercase", color: C.ink }}>Light Table</div>
        </div>
        <div style={{ height: 3, background: C.ink, marginTop: 24 }} />
        <div style={{ marginTop: 28, font: `500 42px/1.25 ${FONT.display}`, fontStretch: "90%", color: C.ink2 }}>
          A board of all your projects, kept current by Claude Code.
        </div>
      </Appear>
      <Appear from={30}>
        <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "auto 1fr", gap: "18px 36px", font: `400 28px/1.3 ${FONT.mono}`, color: C.ink }}>
          <span style={{ color: C.ink3 }}>get it</span><span>github.com/studiotherefore/light-table</span>
          <span style={{ color: C.ink3 }}>try it</span><span style={{ color: C.accent }}>studiotherefore.github.io/light-table</span>
        </div>
      </Appear>
      <Appear from={54}>
        <div style={{ marginTop: 56, font: `400 22px/1 ${FONT.mono}`, color: C.ink3 }}>Free and open source (MIT) · for Mac · runs on your machine</div>
      </Appear>
    </div>
  </AbsoluteFill>
);
