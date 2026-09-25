import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { AudioLayer } from "./components/AudioLayer";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { ChapterBar } from "./components/ChapterBar";
import { clamp, Title } from "./components/kit";
import { loadFonts } from "./fonts";
import { SCENES } from "./scenes";
import audioOptions from "./data/audio.json";
import { SceneProvider, TL, useScene } from "./timeline";
import { C, ZONE } from "./theme";

loadFonts();

const Fallback: React.FC = () => {
  const s = useScene();
  return (
    <AbsoluteFill style={{ top: ZONE.stageTop, height: ZONE.stageBottom - ZONE.stageTop, justifyContent: "center", alignItems: "center" }}>
      <Title size={80}>{s.title}</Title>
    </AbsoluteFill>
  );
};

/** scene wrapper: quick entrance/exit so every cut feels intentional */
const SceneShell: React.FC<{ children: React.ReactNode; duration: number; noExit?: boolean }> = ({ children, duration, noExit }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 8], [0, 1], clamp);
  const outP = noExit ? 0 : interpolate(f, [duration - 7, duration], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: inP * (1 - outP),
        transform: `translateY(${(1 - inP) * 60 - outP * 40}px) scale(${0.96 + 0.04 * inP - outP * 0.03})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Background />
      {TL.scenes.map((s) => {
        const Comp = SCENES[s.id] ?? Fallback;
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.duration} name={s.id}>
            <SceneProvider scene={s}>
              <SceneShell duration={s.duration} noExit={s.id === TL.scenes[TL.scenes.length - 1].id}>
                <Comp />
              </SceneShell>
            </SceneProvider>
          </Sequence>
        );
      })}
      <ChapterBar />
      <Captions />
      <AudioLayer {...(audioOptions as { musicCuts?: Array<[number, number]>; musicRestartAt?: number })} />
    </AbsoluteFill>
  );
};
