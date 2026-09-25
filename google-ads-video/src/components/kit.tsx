import React, { useContext } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { allLines, SceneCtxOptional } from "../timeline";
import { BORDER, C, FONT, SHADOW } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 spring starting at frame `at` */
export const useSpring = (at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping: 14, stiffness: 170, mass: 0.8, ...cfg } });
};

/** linear-eased 0→1 progress between frames a and b */
export const useProgress = (a: number, b: number, ease: (t: number) => number = Easing.inOut(Easing.cubic)) => {
  const f = useCurrentFrame();
  return interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });
};

type PopProps = {
  at: number;
  children: React.ReactNode;
  from?: "scale" | "up" | "down" | "left" | "right" | "fade";
  style?: React.CSSProperties;
  distance?: number;
  out?: number; // frame at which it disappears
  damping?: number;
};

/** Entrance animation wrapper */
export const Pop: React.FC<PopProps> = ({ at, children, from = "scale", style, distance = 120, out, damping }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, damping ? { damping } : {});
  const o = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  if (f < at) return null;
  if (out !== undefined && f > out + 8) return null;
  let transform = "";
  if (from === "scale") transform = `scale(${interpolate(s, [0, 1], [0.3, 1])})`;
  if (from === "up") transform = `translateY(${(1 - s) * distance}px)`;
  if (from === "down") transform = `translateY(${-(1 - s) * distance}px)`;
  if (from === "left") transform = `translateX(${-(1 - s) * distance}px)`;
  if (from === "right") transform = `translateX(${(1 - s) * distance}px)`;
  return (
    <div style={{ ...style, opacity: Math.min(1, s * 1.6) * o, transform: `${style?.transform ?? ""} ${transform}` }}>
      {children}
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  bg?: string;
  radius?: number;
  shadow?: boolean;
}> = ({ children, style, bg = C.paper, radius = 32, shadow = true }) => (
  <div
    style={{
      background: bg,
      border: `${BORDER}px solid ${C.ink}`,
      borderRadius: radius,
      boxShadow: shadow ? SHADOW : undefined,
      padding: 32,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 96,
  color = C.ink,
  style,
}) => (
  <div style={{ fontFamily: FONT.display, fontSize: size, color, lineHeight: 1.15, textAlign: "center", ...style }}>{children}</div>
);

export const Txt: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: "black" | "bold" | "medium";
  style?: React.CSSProperties;
}> = ({ children, size = 48, color = C.ink, weight = "black", style }) => (
  <div
    style={{
      fontFamily: weight === "black" ? FONT.black : weight === "bold" ? FONT.bold : FONT.medium,
      fontSize: size,
      color,
      lineHeight: 1.3,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Yellow marker highlight behind text, drawn in from frame `at` */
export const Marker: React.FC<{ at: number; children: React.ReactNode; color?: string; dur?: number }> = ({
  at,
  children,
  color = C.yellow,
  dur = 10,
}) => {
  const p = useProgress(at, at + dur);
  return (
    <span style={{ position: "relative", display: "inline-block", zIndex: 0 }}>
      <span
        style={{
          position: "absolute",
          left: -6,
          right: -6,
          bottom: "4%",
          height: "46%",
          background: color,
          transformOrigin: "left center",
          transform: `scaleX(${p}) skewX(-8deg)`,
          zIndex: -1,
          borderRadius: 6,
          opacity: 0.85,
        }}
      />
      {children}
    </span>
  );
};

/** Big stamp that slams in with rotation */
export const Stamp: React.FC<{ at: number; text: string; color?: string; size?: number; rotate?: number; style?: React.CSSProperties }> = ({
  at,
  text,
  color = C.red,
  size = 90,
  rotate = -12,
  style,
}) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 11, stiffness: 260 });
  if (f < at) return null;
  const sc = interpolate(s, [0, 1], [2.6, 1]);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: FONT.display,
        fontSize: size,
        color,
        border: `10px solid ${color}`,
        borderRadius: 24,
        padding: "6px 34px",
        transform: `rotate(${rotate}deg) scale(${sc})`,
        opacity: Math.min(1, s * 2),
        background: "rgba(255,255,255,0.88)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Counting number */
export const Counter: React.FC<{
  from?: number;
  to: number;
  at: number;
  dur?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ from = 0, to, at, dur = 24, decimals = 0, prefix = "", suffix = "", style }) => {
  const p = useProgress(at, at + dur, Easing.out(Easing.cubic));
  const v = from + (to - from) * p;
  return (
    <span style={{ fontFamily: FONT.num, fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const Emoji: React.FC<{ e: string; size?: number; style?: React.CSSProperties }> = ({ e, size = 120, style }) => (
  <span style={{ fontFamily: "Noto Color Emoji", fontSize: size, lineHeight: 1, display: "inline-block", ...style }}>{e}</span>
);

/** Sound effect at a frame (relative to the enclosing Sequence). Automatically turned down while someone is speaking. */
export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({ name, at, volume = 0.5 }) => {
  const scene = useContext(SceneCtxOptional);
  const from = Math.max(0, Math.round(at));
  const abs = (scene?.start ?? 0) + from;
  const overlapsSpeech = scene ? allLines().some((l) => abs < l.end && abs + 12 > l.start) : false;
  return (
    <Sequence from={from} durationInFrames={150} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={overlapsSpeech ? volume * 0.55 : volume} />
    </Sequence>
  );
};

/** gentle idle float */
export const useFloat = (amp = 8, speed = 0.08, phase = 0) => {
  const f = useCurrentFrame();
  return Math.sin(f * speed + phase) * amp;
};

/** shake offset for emphasis between frames a..a+len */
export const useShake = (at: number, len = 12, amp = 14) => {
  const f = useCurrentFrame();
  if (f < at || f > at + len) return 0;
  const k = 1 - (f - at) / len;
  return Math.sin((f - at) * 2.2) * amp * k;
};

export const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...style }}>{children}</AbsoluteFill>
);

/** Arrow drawn with stroke-dash animation */
export const DrawArrow: React.FC<{
  at: number;
  d: string;
  width: number;
  height: number;
  color?: string;
  stroke?: number;
  dur?: number;
  style?: React.CSSProperties;
  head?: boolean;
}> = ({ at, d, width, height, color = C.ink, stroke = 10, dur = 14, style, head = true }) => {
  const p = useProgress(at, at + dur);
  const id = React.useMemo(() => `ah${Math.round(Math.abs(Math.sin(at * 12.9898 + d.length) * 1e6))}`, [at, d]);
  return (
    <svg width={width} height={height} style={{ position: "absolute", overflow: "visible", ...style }}>
      <defs>
        <marker id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        markerEnd={head && p > 0.95 ? `url(#${id})` : undefined}
      />
    </svg>
  );
};
