import React from "react";
import { AbsoluteFill } from "remotion";
import { Appear, Mark } from "../parts";
import { OUTRO } from "../script";
import { C, FONT } from "../theme";

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ background: C.ground, alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 1100 }}>
      <Appear from={4}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Mark size={58} />
          <div style={{ font: `760 100px/1 ${FONT.display}`, fontStretch: "72%", textTransform: "uppercase", color: C.ink }}>{OUTRO.name}</div>
        </div>
        <div style={{ height: 3, background: C.ink, marginTop: 24 }} />
        <div style={{ marginTop: 28, font: `500 42px/1.25 ${FONT.display}`, fontStretch: "90%", color: C.ink2 }}>
          {OUTRO.line}
        </div>
      </Appear>
      <Appear from={30}>
        <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "auto 1fr", gap: "18px 36px", font: `400 28px/1.3 ${FONT.mono}`, color: C.ink }}>
          {OUTRO.links.map(l => (
            <React.Fragment key={l.label}>
              <span style={{ color: C.ink3 }}>{l.label}</span>
              <span style={{ color: "accent" in l && l.accent ? C.accent : C.ink }}>{l.text}</span>
            </React.Fragment>
          ))}
        </div>
      </Appear>
      <Appear from={54}>
        <div style={{ marginTop: 56, font: `400 22px/1 ${FONT.mono}`, color: C.ink3 }}>{OUTRO.small}</div>
      </Appear>
    </div>
  </AbsoluteFill>
);
