import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

const BLOBS = [
  { x: 120, y: 380, r: 360, c: C.blue, sp: 0.011, ph: 0 },
  { x: 960, y: 760, r: 320, c: C.yellow, sp: 0.009, ph: 2 },
  { x: 180, y: 1500, r: 380, c: C.green, sp: 0.008, ph: 4 },
  { x: 900, y: 1750, r: 300, c: C.red, sp: 0.012, ph: 1 },
];

export const Background: React.FC<{ tint?: string }> = ({ tint }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: tint ?? C.cream, overflow: "hidden" }}>
      {BLOBS.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x - b.r + Math.sin(f * b.sp * 0.35 + b.ph) * 40,
            top: b.y - b.r + Math.cos(f * b.sp * 0.45 + b.ph) * 30,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: b.c,
            opacity: 0.1,
            filter: "blur(80px)",
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.ink}22 3px, transparent 3.5px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </AbsoluteFill>
  );
};
