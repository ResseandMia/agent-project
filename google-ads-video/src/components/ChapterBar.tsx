import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { TL } from "../timeline";
import { BORDER, C, FONT, ZONE } from "../theme";
import { clamp } from "./kit";

const STEPS = [
  { key: "第1步", label: "预算是瓶颈吗", color: C.blue },
  { key: "第2步", label: "花不出去", color: C.orange },
  { key: "第3步", label: "目标太高", color: C.purple },
  { key: "第4步", label: "横向扩量", color: C.green },
];

const stepIndex = (chapter: string) => STEPS.findIndex((s) => chapter.includes(s.key));

/** Top progress bar showing the 4 diagnostic steps; visible only during steps 1-4 */
export const ChapterBar: React.FC = () => {
  const f = useCurrentFrame();
  const scene = TL.scenes.find((s) => f >= s.start && f < s.start + s.duration);
  if (!scene) return null;
  const idx = stepIndex(scene.chapter);
  // visible range: first step-scene start → last step-scene end
  const stepScenes = TL.scenes.filter((s) => stepIndex(s.chapter) >= 0);
  if (!stepScenes.length) return null;
  const a = stepScenes[0].start;
  const b = stepScenes[stepScenes.length - 1].start + stepScenes[stepScenes.length - 1].duration;
  const vis = interpolate(f, [a - 10, a + 6, b - 6, b + 6], [0, 1, 1, 0], clamp);
  if (vis <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: ZONE.chapterY,
        left: 40,
        right: 40,
        display: "flex",
        gap: 14,
        opacity: vis,
        transform: `translateY(${(1 - vis) * -40}px)`,
      }}
    >
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = idx > i || (idx < 0 && f >= b);
        return (
          <div
            key={s.key}
            style={{
              flex: active ? 1.9 : 1,
              height: 92,
              borderRadius: 20,
              border: `${BORDER - 1}px solid ${C.ink}`,
              background: active ? s.color : done ? `${s.color}38` : C.paper,
              color: active ? C.paper : done ? C.ink : C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontFamily: FONT.black,
              fontSize: active ? 34 : 30,
              boxShadow: active ? `6px 6px 0 ${C.ink}` : undefined,
              transition: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <span style={{ fontFamily: FONT.num, fontSize: active ? 40 : 34 }}>{i + 1}</span>
            {done ? <span style={{ fontFamily: FONT.black, fontSize: 32, color: s.color, textShadow: `1px 1px 0 ${C.ink}` }}>✓</span> : null}
            {active ? <span>{s.label}</span> : null}
          </div>
        );
      })}
    </div>
  );
};
