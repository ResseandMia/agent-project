import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { allLines, TL } from "../timeline";
import { BORDER, C, FONT, ZONE } from "../theme";
import { clamp } from "./kit";
import { MascotFace, speakerStyle } from "./Mascots";

const renderWithKeywords = (text: string, keywords: string[]) => {
  const kws = keywords.filter((k) => k && text.includes(k)).sort((a, b) => b.length - a.length);
  if (!kws.length) return text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const k = kws.find((kw) => text.startsWith(kw, i));
    if (k) {
      parts.push(
        <span key={key++} style={{ color: C.red, background: `${C.yellow}88`, borderRadius: 8, padding: "0 4px", whiteSpace: "nowrap" }}>
          {k}
        </span>,
      );
      i += k.length;
    } else {
      parts.push(text[i]);
      i++;
    }
  }
  return parts;
};

/** approximate rendered width in em (CJK = 1, Latin ≈ 0.62, space ≈ 0.3); must match vis_len in scripts/build_tts.py */
const visLen = (t: string) => [...t].reduce((a, ch) => a + (ch === " " ? 0.3 : ch.charCodeAt(0) < 128 ? 0.62 : 1), 0);

/** Speech-bubble captions, with the speaker's mascot as the avatar. */
export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const lines = allLines();
  const line = lines.find((l) => f >= l.start - 2 && f < l.end + 6);
  if (!line) return null;
  const chunk =
    line.captions.find((c) => f >= c.start - 2 && f < c.end) ??
    (f < line.captions[0]?.start ? line.captions[0] : line.captions[line.captions.length - 1]);
  if (!chunk) return null;
  const st = speakerStyle(line.speaker);
  const appear = line.start <= 4 ? 1 : interpolate(f, [line.start - 2, line.start + 4], [0, 1], clamp);
  const chunkPop = interpolate(f, [chunk.start - 2, chunk.start + 3], [0.92, 1], clamp);
  const char = TL.characters.find((c) => c.id === line.speaker);
  const left = st.side === "left";
  const talking = line.env[Math.max(0, f - line.start)] ?? 0;
  return (
    <div
      style={{
        position: "absolute",
        top: ZONE.captionY,
        left: 36,
        right: 36,
        display: "flex",
        flexDirection: left ? "row" : "row-reverse",
        alignItems: "flex-start",
        gap: 18,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
      }}
    >
      <div style={{ flex: "0 0 150px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <MascotFace id={line.speaker} size={140} talking={talking} />
        <div
          style={{
            fontFamily: FONT.black,
            fontSize: 34,
            color: C.paper,
            background: st.color,
            border: `4px solid ${C.ink}`,
            borderRadius: 14,
            padding: "0 12px",
            whiteSpace: "nowrap",
          }}
        >
          {char?.name ?? line.speaker}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          background: C.paper,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 30,
          boxShadow: `8px 8px 0 ${C.ink}`,
          padding: "22px 30px",
          minHeight: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transform: `scale(${chunkPop})`,
          transformOrigin: left ? "left center" : "right center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 46,
            [left ? "left" : "right"]: -26,
            width: 0,
            height: 0,
            borderTop: "18px solid transparent",
            borderBottom: "18px solid transparent",
            [left ? "borderRight" : "borderLeft"]: `26px solid ${C.ink}`,
          }}
        />
        <div
          style={{
            fontFamily: FONT.black,
            fontSize: Math.max(...chunk.text.split("\n").map(visLen)) > 13.5 ? 48 : 54,
            lineHeight: 1.32,
            color: C.ink,
            textAlign: "center",
            whiteSpace: "pre-line",
            wordBreak: "normal",
          }}
        >
          {renderWithKeywords(chunk.text, line.keywords)}
        </div>
      </div>
    </div>
  );
};
