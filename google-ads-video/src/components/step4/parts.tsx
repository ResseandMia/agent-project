import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, FONT, SHADOW } from "../../theme";
import { clamp, Emoji, useSpring } from "../kit";
import { MascotFace, Mood } from "../Mascots";

const INK = C.ink;
export const DOG = { main: "#F6C98B", dark: "#B9763B", belly: "#FFF1DC", patch: "#E3A764" };
export const CAT = { main: "#9FC3FF", dark: "#6E9BE6" };

export type PawSpec = { x: number; y: number; r?: number; color?: string };

/** A single round paw (sticker style), drawn in the 200-unit space of <ChongHead/> */
const PawSvg: React.FC<PawSpec> = ({ x, y, r = 17, color = DOG.main }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={color} stroke={INK} strokeWidth={5} />
    <path
      d={`M${x - r * 0.45} ${y + r * 0.2} L${x - r * 0.45} ${y + r * 0.62} M${x + r * 0.05} ${y + r * 0.28} L${x + r * 0.05} ${y + r * 0.7} M${x + r * 0.5} ${y + r * 0.2} L${x + r * 0.5} ${y + r * 0.62}`}
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
    />
  </g>
);

/** Where 阿冲's stubby arms start: hidden behind the lower part of his head (200-unit space). */
export const CHONG_SHOULDER = { L: [70, 160], R: [130, 160] } as const;
/** Height of the <ChongHead/> box in units of its width (head fills y 34..184, paws/props may hang to ~y 265). */
export const CHONG_BOX_H = 1.35;

/**
 * 阿冲 as a floating head with stubby arms: the same head-only look he has in the hook and in steps 1–3
 * (no torso / legs). Local space = 200 units wide; the head fills x 26..174, y 34..184.
 * Each paw in `paws` is joined to the head by a short arm that starts behind the head (nearest shoulder).
 * `children` (held props) are drawn in front of the head, the paws on top of everything.
 */
export const ChongHead: React.FC<{
  size?: number;
  talking?: number;
  mood?: Mood;
  paws?: PawSpec[];
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ size = 240, talking = 0, mood = "normal", paws = [], children, style }) => {
  const h = size * CHONG_BOX_H;
  const vb = `0 0 200 ${200 * CHONG_BOX_H}`;
  return (
    <div style={{ position: "relative", width: size, height: h, ...style }}>
      {paws.length ? (
        <svg viewBox={vb} width={size} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {paws.map((p, i) => {
            const [sx, sy] = p.x < 100 ? CHONG_SHOULDER.L : CHONG_SHOULDER.R;
            return (
              <g key={i}>
                <line x1={sx} y1={sy} x2={p.x} y2={p.y} stroke={INK} strokeWidth={30} strokeLinecap="round" />
                <line x1={sx} y1={sy} x2={p.x} y2={p.y} stroke={p.color ?? DOG.main} strokeWidth={18} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <MascotFace kind="dog" size={size} talking={talking} mood={mood} />
      </div>
      {children}
      {paws.length ? (
        <svg viewBox={vb} width={size} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {paws.map((p, i) => (
            <PawSvg key={i} {...p} />
          ))}
        </svg>
      ) : null}
    </div>
  );
};

/**
 * Compatibility alias for the old full-body puppy API. 阿冲 is drawn head-only everywhere from the hook to step 4, so this
 * renders <ChongHead/>; `pose`, `stomp` and `wag` are accepted but ignored (there is no body, feet or tail).
 */
export const Puppy: React.FC<{
  size?: number;
  pose?: "stand" | "sit";
  talking?: number;
  mood?: Mood;
  stomp?: [number, number];
  paws?: PawSpec[];
  wag?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = (p) => (
  <ChongHead size={p.size} talking={p.talking} mood={p.mood} paws={p.paws} style={p.style}>
    {p.children}
  </ChongHead>
);

/**
 * 阿冲 (head + arms) taking notes: a notebook held under his chin on the left, a wiggling pencil on the right.
 * `pen` is the pencil wiggle in degrees, `punch` scales the notebook (page-flip emphasis).
 */
export const NoteChong: React.FC<{
  size: number;
  talking?: number;
  mood?: Mood;
  write?: number;
  flip?: number;
  punch?: number;
  pen?: number;
  noteW?: number; // notebook width in head units
}> = ({ size, talking = 0, mood = "normal", write = 1, flip = 0, punch = 1, pen = 0, noteW = 80 }) => {
  const u = size / 200;
  return (
    <ChongHead
      size={size}
      talking={talking}
      mood={mood}
      paws={[
        { x: 30, y: 150 + noteW * 1.25 - 16 },
        { x: 150 + pen * 0.3, y: 198 + Math.abs(pen) * 0.2 },
      ]}
    >
      <div
        style={{
          position: "absolute",
          left: -8 * u,
          top: 150 * u,
          transform: `rotate(-8deg) scale(${punch})`,
          transformOrigin: "50% 60%",
        }}
      >
        <Notebook w={noteW * u} write={write} flip={flip} />
      </div>
      <div style={{ position: "absolute", left: 130 * u, top: 168 * u, transform: `rotate(${-20 + pen}deg)` }}>
        <Emoji e="✏️" size={50 * u} />
      </div>
    </ChongHead>
  );
};

/**
 * A fist with one extended finger pointing DOWN (the wrist/arm enters from the left).
 * Tip is at (size*0.5, size*1.36) of the box; fist centre at (size*0.5, size*0.44).
 */
export const FingerPaw: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 90,
  color = DOG.main,
  style,
}) => (
  <svg viewBox="0 0 100 140" width={size} height={size * 1.4} style={{ overflow: "visible", ...style }}>
    {/* extended index finger */}
    <rect x={37} y={50} width={26} height={84} rx={13} fill={color} stroke={INK} strokeWidth={6} />
    {/* pink pad at the fingertip */}
    <ellipse cx={50} cy={119} rx={8.5} ry={9} fill="#FF9FB2" stroke={INK} strokeWidth={3} />
    {/* fist */}
    <ellipse cx={46} cy={44} rx={38} ry={33} fill={color} stroke={INK} strokeWidth={6} />
    {/* three curled fingers stacked on the right side of the fist */}
    <ellipse cx={80} cy={26} rx={15} ry={12} fill={color} stroke={INK} strokeWidth={5} />
    <ellipse cx={84} cy={45} rx={15} ry={12} fill={color} stroke={INK} strokeWidth={5} />
    <ellipse cx={78} cy={64} rx={15} ry={12} fill={color} stroke={INK} strokeWidth={5} />
    <ellipse cx={30} cy={30} rx={10} ry={6} fill="#fff" opacity={0.55} />
  </svg>
);

/**
 * A bendy cartoon arm (absolute frame coords): ink stroke under a fur-coloured stroke, round caps.
 * `bend` pushes the control point sideways (positive = to the left of the travel direction, i.e. up for a rightward arm).
 */
export const Arm: React.FC<{
  from: [number, number];
  to: [number, number];
  bend?: number;
  width?: number;
  color?: string;
  opacity?: number;
}> = ({ from, to, bend = 40, width = 26, color = DOG.main, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const [x0, y0] = from;
  const [x1, y1] = to;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.max(1, Math.hypot(dx, dy));
  const cx = (x0 + x1) / 2 + (dy / len) * bend;
  const cy = (y0 + y1) / 2 - (dx / len) * bend;
  const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity, pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 12} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
};

/** Magnifier: lens centred at (cx, cy) in its own box, handle towards angle `deg` (0 = down-right). */
export const Magnifier: React.FC<{ r?: number; handle?: number; deg?: number; style?: React.CSSProperties }> = ({
  r = 60,
  handle = 110,
  deg = 45,
  style,
}) => {
  const w = (r + handle) * 2 + 20;
  const c = w / 2;
  const rad = (deg * Math.PI) / 180;
  const hx0 = c + Math.cos(rad) * (r + 4);
  const hy0 = c + Math.sin(rad) * (r + 4);
  const hx1 = c + Math.cos(rad) * (r + handle);
  const hy1 = c + Math.sin(rad) * (r + handle);
  return (
    <svg width={w} height={w} style={{ position: "absolute", overflow: "visible", ...style }}>
      <line x1={hx0} y1={hy0} x2={hx1} y2={hy1} stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <line x1={hx0} y1={hy0} x2={hx1} y2={hy1} stroke="#8B5A2B" strokeWidth={18} strokeLinecap="round" />
      <circle cx={c} cy={c} r={r} fill="rgba(200,230,255,0.35)" stroke={INK} strokeWidth={12} />
      <circle cx={c} cy={c} r={r - 6} fill="none" stroke="#C9CCD6" strokeWidth={5} />
      <path d={`M${c - r * 0.55} ${c - r * 0.2} A ${r * 0.6} ${r * 0.6} 0 0 1 ${c - r * 0.1} ${c - r * 0.6}`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
};

/** Numbered sub-point header for chapter 4 (①②③), centred at the top of the stage. */
export const StepPoint: React.FC<{ at: number; num: string; label: string; out?: number; top?: number }> = ({
  at,
  num,
  label,
  out,
  top = 268,
}) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 12, stiffness: 200 });
  const o = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  if (f < at || o <= 0) return null;
  const sway = Math.sin(f * 0.07) * 1.2;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(1, s * 1.8) * o,
        transform: `translateY(${(1 - s) * -50}px) rotate(${sway}deg)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: C.paper,
          border: `${BORDER}px solid ${INK}`,
          borderRadius: 50,
          boxShadow: `8px 8px 0 ${INK}`,
          padding: "8px 34px 8px 10px",
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            background: C.green,
            border: `5px solid ${INK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.num,
            fontSize: 44,
            color: C.paper,
            transform: `rotate(${interpolate(s, [0, 1], [-200, 0])}deg)`,
          }}
        >
          {num}
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 60, color: INK, whiteSpace: "nowrap", lineHeight: 1.1 }}>{label}</div>
      </div>
    </div>
  );
};

/** Small spiral notebook (open page with scribbled lines). `write` 0..1 shows scribbles, `flip` 0..1 turns a page. */
export const Notebook: React.FC<{ w?: number; write?: number; flip?: number; style?: React.CSSProperties }> = ({
  w = 130,
  write = 1,
  flip = 0,
  style,
}) => {
  const h = w * 1.25;
  const lines = [0.34, 0.5, 0.66, 0.82];
  return (
    <div style={{ position: "relative", width: w, height: h, ...style }}>
      <svg viewBox="0 0 100 125" width={w} height={h} style={{ position: "absolute", overflow: "visible" }}>
        <rect x={4} y={10} width={92} height={112} rx={8} fill={C.green} stroke={INK} strokeWidth={5} />
        <rect x={10} y={14} width={82} height={104} rx={5} fill="#fff" stroke={INK} strokeWidth={4} />
        {lines.map((y, i) => {
          const p = Math.max(0, Math.min(1, write * lines.length - i));
          return (
            <g key={i}>
              <line x1={18} y1={y * 125} x2={84} y2={y * 125} stroke="#D5D7DE" strokeWidth={3} />
              {p > 0 ? (
                <path
                  d={`M18 ${y * 125 - 5} q6 -7 12 0 t12 0 t12 0 t12 0 t12 0`}
                  fill="none"
                  stroke={C.blue}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                />
              ) : null}
            </g>
          );
        })}
        {[20, 38, 56, 74].map((x) => (
          <ellipse key={x} cx={x + 4} cy={12} rx={4} ry={8} fill="none" stroke={INK} strokeWidth={3.5} />
        ))}
        {flip > 0 && flip < 1 ? (
          <path
            // the turned page is foreshortened once it passes the binding, so it never swings far outside the notebook
            d={(() => {
              const c = Math.cos(flip * Math.PI);
              const x = 10 + 82 * c * (c < 0 ? 0.4 : 1);
              const lift = 10 * Math.sin(flip * Math.PI);
              return `M10 14 L${x} ${14 - lift} L${x} ${118 - lift} L10 118 Z`;
            })()}
            fill="#F4F5F8"
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </div>
  );
};

/**
 * A blue bowl of hot tofu (white rounded cubes + rising steam) with a 「热豆腐」 label on its front.
 * Drawn in a 200-unit wide box: rim centre at y = 96, bowl foot at y = 172. `width` sets the pixel size.
 * The steam rises from the outer rim and fans outwards, so a face held just above the bowl stays clear.
 * `t` drives the steam loop.
 */
export const TofuBowl: React.FC<{ width?: number; t: number; style?: React.CSSProperties }> = ({ width = 200, t, style }) => {
  const cube = (x: number, y: number, s: number, rot: number, key: string) => (
    <g key={key} transform={`rotate(${rot} ${x + s / 2} ${y + s / 2})`}>
      <rect x={x} y={y} width={s} height={s} rx={s * 0.2} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
      {/* soft shade on the right edge + a glint, so the cube reads as a solid block */}
      <path d={`M${x + s - 11} ${y + 8} L${x + s - 11} ${y + s - 8}`} stroke="#E6E1D3" strokeWidth={7} strokeLinecap="round" />
      <circle cx={x + s * 0.3} cy={y + s * 0.28} r={s * 0.09} fill="#F1EEE6" />
    </g>
  );
  return (
    <svg viewBox="0 0 200 180" width={width} height={width * 0.9} style={{ overflow: "visible", ...style }}>
      {/* steam wisps: start at the outer rim and fan outwards while rising, fading out */}
      {[
        { x: 22, dir: -1, ph: 0 },
        { x: 178, dir: 1, ph: 13 },
        { x: 34, dir: -1, ph: 26 },
        { x: 166, dir: 1, ph: 33 },
      ].map((w, k) => {
        const q = ((t + w.ph) % 40) / 40;
        const d = "M0 0 q -9 -10 0 -20 q 9 -10 0 -20";
        const sc = k < 2 ? 1.1 : 0.8;
        return (
          <g
            key={k}
            transform={`translate(${w.x + w.dir * q * 34} ${84 - q * 46}) rotate(${w.dir * (26 + q * 14)}) scale(${sc})`}
            opacity={Math.sin(q * Math.PI) * 0.95}
          >
            <path d={d} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      })}
      {/* bowl interior (broth) */}
      <ellipse cx={100} cy={96} rx={92} ry={20} fill="#F2B24C" stroke={INK} strokeWidth={6} />
      {/* tofu cubes: they peek ~30 units above the rim, the rest is hidden by the bowl front */}
      {cube(74, 60, 50, -7, "b")}
      {cube(32, 70, 46, 8, "l")}
      {cube(122, 68, 46, -5, "r")}
      {/* bowl front */}
      <path
        d="M8 96 Q10 150 62 162 L138 162 Q190 150 192 96 Q100 122 8 96 Z"
        fill={C.blue}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <rect x={70} y={158} width={60} height={14} rx={6} fill={C.blue} stroke={INK} strokeWidth={5} />
      <text
        x={100}
        y={150}
        textAnchor="middle"
        fontFamily={FONT.black}
        fontSize={36}
        fill="#FFFFFF"
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        热豆腐
      </text>
    </svg>
  );
};

/** Speech bubble with a tail. */
export const Bubble: React.FC<{
  children: React.ReactNode;
  tail?: "left" | "right" | "down";
  bg?: string;
  style?: React.CSSProperties;
}> = ({ children, tail = "down", bg = C.paper, style }) => (
  <div
    style={{
      position: "absolute",
      background: bg,
      border: `${BORDER}px solid ${INK}`,
      borderRadius: 34,
      boxShadow: `8px 8px 0 ${INK}`,
      padding: "8px 30px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
    <svg
      width={60}
      height={46}
      style={{
        position: "absolute",
        bottom: -40,
        left: tail === "left" ? 24 : tail === "right" ? undefined : "50%",
        right: tail === "right" ? 24 : undefined,
        marginLeft: tail === "down" ? -30 : 0,
        overflow: "visible",
      }}
    >
      <path
        d={tail === "right" ? "M8 0 L44 0 L54 40 Z" : "M16 0 L52 0 L6 40 Z"}
        fill={bg}
        stroke={INK}
        strokeWidth={BORDER}
        strokeLinejoin="round"
      />
      <rect x={10} y={-8} width={44} height={9} fill={bg} />
    </svg>
  </div>
);

/** Simplified web-page thumbnail card (browser bar + content). */
export const WebCard: React.FC<{
  children: React.ReactNode;
  width: number;
  accent?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ children, width, accent = C.green, glow = 0, style }) => (
  <div
    style={{
      width,
      background: C.paper,
      border: `${BORDER}px solid ${INK}`,
      borderRadius: 26,
      boxShadow: glow > 0 ? `${SHADOW}, 0 0 0 ${10 * glow}px ${accent}55` : SHADOW,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: 46,
        background: accent,
        borderBottom: `${BORDER - 1}px solid ${INK}`,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 16px",
      }}
    >
      {[C.red, C.yellow, C.paper].map((c) => (
        <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, border: `3px solid ${INK}` }} />
      ))}
      <div style={{ flex: 1, height: 20, borderRadius: 10, background: "rgba(255,255,255,0.75)", border: `3px solid ${INK}`, marginLeft: 8 }} />
    </div>
    {children}
  </div>
);
