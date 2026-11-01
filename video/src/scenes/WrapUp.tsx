// "Wrap up": the words typed at the end of a session, and the Tide Clock card
// changing from how it stood before to how it stands now.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BoardImage, frameOn, L, onScreen } from "../Board";
import { Appear, Caption } from "../parts";
import { C, FONT } from "../theme";

const TYPE_AT = 40, REVEAL_AT = 196;
const PROMPT = "wrap up";
const STEPS: { at: number; text: string; color?: string }[] = [
  { at: 84, text: "Read HANDOFF.md and today's 4 commits" },
  { at: 108, text: "Captured the app at localhost:5173" },
  { at: 132, text: "Rewrote Tide Clock: now, next step, 2 calls" },
  { at: 156, text: "Rebuilt the board" },
  { at: 186, text: "✓ Tide Clock is up to date", color: C.go },
];

const cam = frameOn(L.after.card, 1.4, 1390, 520);

export const WrapUp: React.FC = () => {
  const f = useCurrentFrame();
  const typed = PROMPT.slice(0, Math.max(0, Math.floor((f - TYPE_AT) / 3)));
  const caret = f < STEPS[0].at && Math.floor(f / 15) % 2 === 0;
  const reveal = interpolate(f, [REVEAL_AT, REVEAL_AT + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card = onScreen(L.after.card, cam);
  const edge = card.y + card.h * reveal;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <Appear from={6} style={{ position: "absolute", left: 110, top: 120, width: 820 }}>
        <Caption kicker="Wrap up" text={<>At the end of a session, say “wrap up”. The card rewrites itself.</>} size={50} />
      </Appear>

      {/* a terminal: Claude Code in the project's folder */}
      <Appear from={14} style={{ position: "absolute", left: 110, top: 430, width: 820 }}>
        <div style={{ background: C.sheet, border: `1px solid ${C.ruleHi}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${C.rule}`, background: C.sheet2 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.85 }} />)}
            <span style={{ flex: 1, textAlign: "center", font: `400 19px/1 ${FONT.mono}`, color: C.ink3, marginRight: 60 }}>tide-clock · Claude Code</span>
          </div>
          <div style={{ padding: "28px 32px 34px", font: `400 25px/1.75 ${FONT.mono}`, color: C.ink2, minHeight: 330 }}>
            <div style={{ color: C.ink }}>
              <span style={{ color: C.accent }}>›</span> {typed}
              {caret && <span style={{ display: "inline-block", width: 13, height: 28, background: C.ink2, verticalAlign: -4, marginLeft: 2 }} />}
            </div>
            {STEPS.map(st => (
              <div key={st.text} style={{ opacity: f >= st.at ? 1 : 0, color: st.color ?? C.ink2, marginTop: st.color ? 10 : 0 }}>
                {st.color ? "" : <span style={{ color: C.ink3 }}>· </span>}{st.text}
              </div>
            ))}
          </div>
        </div>
      </Appear>

      {/* the card, before and after */}
      <AbsoluteFill>
          <BoardImage cam={cam} src="board-before" clip={L.before.card} />
          <BoardImage cam={cam} src="board" clip={L.after.card} reveal={reveal} />
          {reveal > 0 && reveal < 1 && (
            <div style={{ position: "absolute", left: card.x, width: card.w, top: edge - 2, height: 4, background: C.accent, boxShadow: `0 0 30px 6px ${C.accent}88` }} />
          )}
      </AbsoluteFill>
      <Appear from={REVEAL_AT + 40} style={{ position: "absolute", left: card.x - 150, width: card.w + 300, top: card.y + card.h + 24, textAlign: "center" }}>
        <div style={{ font: `400 21px/1 ${FONT.mono}`, color: C.ink3 }}>new screenshot · new status · 3 days ago → today</div>
      </Appear>
    </AbsoluteFill>
  );
};
