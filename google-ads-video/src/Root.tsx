import React from "react";
import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { Main } from "./Main";
import { TL } from "./timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.totalFrames} fps={FPS} width={W} height={H} />
    <Still id="Cover34" component={Cover} width={1080} height={1440} />
    <Still id="Cover916" component={() => <Cover tall />} width={1080} height={1920} />
  </>
);
