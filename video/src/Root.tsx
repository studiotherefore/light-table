import React from "react";
import { Composition } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Outro } from "./scenes/Outro";
import { Sweep } from "./scenes/Sweep";
import { Title } from "./scenes/Title";
import { T, Tour } from "./scenes/Tour";
import { WrapUp } from "./scenes/WrapUp";
import { FPS, s } from "./theme";

// The scenes, in order, with their lengths in frames.
const SCENES: [React.FC, number][] = [
  [Title, s(4)],
  [Tour, T.end],
  [WrapUp, s(10.5)],
  [Sweep, s(8.5)],
  [Outro, s(7)],
];
const FADE = 15;
const LENGTH = SCENES.reduce((n, [, d]) => n + d, 0) - FADE * (SCENES.length - 1);

const Video: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap(([Scene, d], i) => [
      ...(i ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />] : []),
      <TransitionSeries.Sequence key={i} durationInFrames={d}><Scene /></TransitionSeries.Sequence>,
    ])}
  </TransitionSeries>
);

export const Root: React.FC = () => (
  <Composition id="LightTableDemo" component={Video} durationInFrames={LENGTH} fps={FPS} width={1920} height={1080} />
);
