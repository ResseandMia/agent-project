import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { TL } from "./timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={TL.totalFrames} fps={FPS} width={W} height={H} />
);
