import React from "react";
import { Composition } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Outro } from "./scenes/Outro";
import { Sweep } from "./scenes/Sweep";
import { Title } from "./scenes/Title";
import { T, Tour } from "./scenes/Tour";
import { WrapUp } from "./scenes/WrapUp";
import { Chapter, Points, Recording } from "./scenes/Long";
import { LONG, Part, SHORT } from "./script";
import { FPS, s } from "./theme";

// The scenes, in order, with their lengths in frames.
const SCENES: [React.FC, number][] = [
  [Title, s(SHORT.scenes.title)],
  [Tour, T.end],
  [WrapUp, s(SHORT.scenes.wrapUp)],
  [Sweep, s(SHORT.scenes.sweep)],
  [Outro, s(SHORT.scenes.outro)],
];
const FADE = s(SHORT.fade);
const LENGTH = SCENES.reduce((n, [, d]) => n + d, 0) - FADE * (SCENES.length - 1);

const Video: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap(([Scene, d], i) => [
      ...(i ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />] : []),
      <TransitionSeries.Sequence key={i} durationInFrames={d}><Scene /></TransitionSeries.Sequence>,
    ])}
  </TransitionSeries>
);

// The long video: built from the parts listed in LONG (script.ts).
const LENGTHS: Record<string, number> = {
  title: s(SHORT.scenes.title), tour: T.end, wrapUp: s(SHORT.scenes.wrapUp),
  sweep: s(SHORT.scenes.sweep), outro: s(SHORT.scenes.outro),
};
const SHARED: Record<string, React.FC> = { title: Title, tour: Tour, wrapUp: WrapUp, sweep: Sweep, outro: Outro };
const lengthOf = (p: Part) =>
  p.type === "chapter" ? s(p.length ?? LONG.chapterLength) : "length" in p ? s(p.length) : LENGTHS[p.type];
const render = (p: Part) =>
  p.type === "chapter" ? <Chapter part={p} /> : p.type === "points" ? <Points part={p} />
    : p.type === "recording" ? <Recording part={p} /> : React.createElement(SHARED[p.type]);
const LONG_FADE = s(LONG.fade);
const LONG_LENGTH = LONG.parts.reduce((n, p) => n + lengthOf(p), 0) - LONG_FADE * (LONG.parts.length - 1);

const LongVideo: React.FC = () => (
  <TransitionSeries>
    {LONG.parts.flatMap((p, i) => [
      ...(i ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: LONG_FADE })} />] : []),
      <TransitionSeries.Sequence key={i} durationInFrames={lengthOf(p)}>{render(p)}</TransitionSeries.Sequence>,
    ])}
  </TransitionSeries>
);

export const Root: React.FC = () => (
  <>
    <Composition id="LightTableDemo" component={Video} durationInFrames={LENGTH} fps={FPS} width={1920} height={1080} />
    <Composition id="LightTableTour" component={LongVideo} durationInFrames={LONG_LENGTH} fps={FPS} width={1920} height={1080} />
  </>
);
