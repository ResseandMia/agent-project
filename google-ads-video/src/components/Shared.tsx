import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { clamp, useSpring } from "./kit";

/**
 * Chapter opener: a big rotated number badge ("01") slams in at `at`, the title types on next to/below it.
 * Use at the top of a chapter's first scene. It can shrink into a header with `shrinkAt`.
 */
export const ChapterStamp: React.FC<{
  at: number;
  num: string; // "01"
  title: string; // "预算真的是瓶颈吗？"
  color: string;
  shrinkAt?: number; // frame at which it shrinks to a compact header at the top of the stage
  top?: number;
}> = ({ at, num, title, color, shrinkAt, top = 270 }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 10, stiffness: 240 });
  const shrink = shrinkAt !== undefined ? interpolate(f, [shrinkAt, shrinkAt + 12], [0, 1], clamp) : 0;
  if (f < at) return null;
  const chars = Math.floor(interpolate(f, [at + 6, at + 6 + title.length * 1.6], [0, title.length], clamp));
  const scale = interpolate(shrink, [0, 1], [1, 0.62]);
  const y = interpolate(shrink, [0, 1], [top + 180, top]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        transform: `scale(${scale})`,
        transformOrigin: "center top",
      }}
    >
      <div
        style={{
          width: 250,
          height: 250,
          borderRadius: 60,
          background: color,
          border: `${BORDER + 2}px solid ${C.ink}`,
          boxShadow: SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(${interpolate(s, [0, 1], [-30, -8])}deg) scale(${interpolate(s, [0, 1], [2.4, 1])})`,
          opacity: Math.min(1, s * 2),
        }}
      >
        <span style={{ fontFamily: FONT.num, fontSize: 150, color: C.paper, textShadow: `6px 6px 0 ${C.ink}` }}>{num}</span>
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 88,
          color: C.ink,
          background: C.paper,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 28,
          padding: "8px 36px",
          boxShadow: SHADOW,
          whiteSpace: "nowrap",
          minHeight: 110,
          opacity: chars > 0 ? 1 : 0,
        }}
      >
        {title.slice(0, chars)}
      </div>
    </div>
  );
};

/** Simplified "ad dashboard" window: title bar with three dots + a text title (no real logos). */
export const Panel: React.FC<{
  title: string;
  children: React.ReactNode;
  accent?: string;
  width?: number | string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ title, children, accent = C.blue, width = 900, style, bodyStyle }) => (
  <div
    style={{
      width,
      background: C.paper,
      border: `${BORDER}px solid ${C.ink}`,
      borderRadius: 30,
      boxShadow: SHADOW,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: 70,
        background: accent,
        borderBottom: `${BORDER}px solid ${C.ink}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 24px",
      }}
    >
      {[C.red, C.yellow, C.green].map((c) => (
        <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, border: `3px solid ${C.ink}` }} />
      ))}
      <div style={{ fontFamily: FONT.black, fontSize: 34, color: C.paper, marginLeft: 12, textShadow: `2px 2px 0 ${C.ink}` }}>{title}</div>
    </div>
    <div style={{ padding: 28, ...bodyStyle }}>{children}</div>
  </div>
);

/** Small rounded label / sticker */
export const Tag: React.FC<{ children: React.ReactNode; color?: string; text?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.yellow,
  text = C.ink,
  size = 34,
  style,
}) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: FONT.black,
      fontSize: size,
      color: text,
      background: color,
      border: `4px solid ${C.ink}`,
      borderRadius: 16,
      padding: "2px 16px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);
