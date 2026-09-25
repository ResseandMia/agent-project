import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../../theme";
import { clamp, useSpring } from "../kit";
import { MascotFace, Mood } from "../Mascots";

const INK = C.ink;
export const GOLD = CHAPTER_COLOR["结尾"];
export const GRAY = "#A5A5AE";

export const FUR = {
  dog: { main: "#F6C98B", dark: "#B9763B", belly: "#FFF1DC" },
  cat: { main: "#9FC3FF", dark: "#6E9BE6", belly: "#E6EFFF" },
};

/* ------------------------------------------------------------------ */
/* Full-body mascot with posable arms                                  */
/* ------------------------------------------------------------------ */
// Local space: 200 units wide × 310 high (the head occupies the top 200 units).
export const SHOULDER = { L: [62, 170], R: [138, 170] } as const;
export const ARM_LEN = 72;

/** Paw centre in the 200-unit space. deg: 0 = hanging down, 90 = pointing outward, 180 = straight up, negative = across the body. */
export const pawAt = (side: "L" | "R", deg: number, len = ARM_LEN): [number, number] => {
  const [sx, sy] = SHOULDER[side];
  const a = (deg * Math.PI) / 180;
  const dir = side === "L" ? -1 : 1;
  return [sx + dir * Math.sin(a) * len, sy + Math.cos(a) * len];
};

export const Buddy: React.FC<{
  kind: "dog" | "cat";
  size?: number;
  talking?: number;
  mood?: Mood;
  glint?: number;
  armL?: number;
  armR?: number;
  stomp?: [number, number];
  wag?: number;
  children?: React.ReactNode; // props drawn between the body and the arms (e.g. a hugged star)
  front?: React.ReactNode; // drawn above the arms (e.g. an object held in a paw)
  style?: React.CSSProperties;
}> = ({ kind, size = 220, talking = 0, mood = "normal", glint = 0, armL = 14, armR = 14, stomp = [0, 0], wag = 0, children, front, style }) => {
  const fur = FUR[kind];
  const h = size * 1.55;
  const arm = (side: "L" | "R", deg: number) => {
    const [sx, sy] = SHOULDER[side];
    const [px, py] = pawAt(side, deg);
    return (
      <g key={side}>
        <line x1={sx} y1={sy} x2={px} y2={py} stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <line x1={sx} y1={sy} x2={px} y2={py} stroke={fur.main} strokeWidth={18} strokeLinecap="round" />
        <circle cx={px} cy={py} r={18} fill={fur.main} stroke={INK} strokeWidth={5} />
        <ellipse cx={px} cy={py + 4} rx={7} ry={5} fill="#F7A1B0" />
      </g>
    );
  };
  const tail = kind === "dog" ? "M142 246 Q186 236 180 198" : "M142 252 Q194 258 188 206 Q184 180 198 162";
  return (
    <div style={{ position: "relative", width: size, height: h, ...style }}>
      <svg viewBox="0 0 200 310" width={size} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`rotate(${wag} 146 246)`}>
          <path d={tail} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
          <path d={tail} fill="none" stroke={kind === "dog" ? fur.dark : fur.main} strokeWidth={8} strokeLinecap="round" />
        </g>
        <ellipse cx={72} cy={290 - stomp[0]} rx={27} ry={15} fill={fur.main} stroke={INK} strokeWidth={5} />
        <ellipse cx={128} cy={290 - stomp[1]} rx={27} ry={15} fill={fur.main} stroke={INK} strokeWidth={5} />
        <path
          d="M58 150 C38 192 40 252 56 278 Q100 294 144 278 C160 252 162 192 142 150 Z"
          fill={fur.main}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <ellipse cx={100} cy={232} rx={30} ry={36} fill={fur.belly} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <MascotFace kind={kind} size={size} talking={talking} mood={mood} glint={glint} />
      </div>
      {children}
      <svg viewBox="0 0 200 310" width={size} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {arm("L", armL)}
        {arm("R", armR)}
      </svg>
      {front}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Confetti (deterministic; pass a frozen `t` to freeze it)             */
/* ------------------------------------------------------------------ */
const CONFETTI_COLORS = [C.red, C.blue, C.yellow, C.green, C.purple, C.orange, "#FF7EB6"];

export const Confetti: React.FC<{
  t: number; // frames since the burst
  x: number;
  y: number;
  n?: number;
  seed?: string;
  dir?: number; // degrees from vertical (positive = to the right)
  spread?: number;
  power?: number;
  drop?: number; // extra fall (px) added to every piece
  opacity?: number;
}> = ({ t, x, y, n = 36, seed = "c", dir = 0, spread = 70, power = 40, drop = 0, opacity = 1 }) => {
  if (t <= 0 || opacity <= 0) return null;
  const k = 0.075;
  const e = 1 - Math.exp(-k * t);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const r1 = random(`${seed}a${i}`);
        const r2 = random(`${seed}b${i}`);
        const r3 = random(`${seed}c${i}`);
        const ang = ((dir + (r1 - 0.5) * spread) * Math.PI) / 180;
        const v = power * (0.45 + 0.55 * r2);
        const dx = (Math.sin(ang) * v * e) / k + Math.sin(t * 0.18 + i) * 14 * e;
        const g = 0.32;
        const dy = (-Math.cos(ang) * v * e) / k + (g * (t - e / k)) / k + drop;
        const shape = i % 3;
        const col = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const rot = t * (6 + r3 * 14) * (i % 2 ? 1 : -1) + r3 * 360;
        const flip = Math.abs(Math.cos(t * 0.2 + r3 * 6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + dx - 9,
              top: y + dy - 9,
              width: shape === 1 ? 18 : 16,
              height: shape === 0 ? 30 : shape === 1 ? 18 : 12,
              borderRadius: shape === 1 ? 9 : 3,
              background: col,
              border: `3px solid ${INK}`,
              transform: `rotate(${rot}deg) scaleY(${0.35 + 0.65 * flip})`,
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

/** Paper confetti raining from the top of the screen. */
export const ConfettiRain: React.FC<{ t: number; n?: number; seed?: string; drop?: number; opacity?: number; bottom?: number }> = ({
  t,
  n = 26,
  seed = "rain",
  drop = 0,
  opacity = 1,
  bottom = 1250,
}) => {
  if (opacity <= 0) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const r1 = random(`${seed}x${i}`);
        const r2 = random(`${seed}y${i}`);
        const r3 = random(`${seed}s${i}`);
        const sp = 5 + r2 * 5;
        const y0 = -80 - r3 * 700;
        const y = y0 + t * sp + drop;
        if (y > bottom || y < -60) return null;
        const x = 40 + r1 * 1000 + Math.sin(t * 0.12 + i * 1.7) * 26;
        const col = CONFETTI_COLORS[(i + 3) % CONFETTI_COLORS.length];
        const flip = Math.abs(Math.cos(t * 0.17 + r3 * 5));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 16,
              height: i % 2 ? 28 : 16,
              borderRadius: i % 2 ? 3 : 8,
              background: col,
              border: `3px solid ${INK}`,
              transform: `rotate(${t * (i % 2 ? 7 : -9) + r1 * 360}deg) scaleX(${0.3 + 0.7 * flip})`,
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

/** Party popper cone: tip at bottom-left, opening at top-right (box 150×150). */
export const Popper: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 150, style }) => (
  <svg viewBox="0 0 150 150" width={size} height={size} style={{ position: "absolute", overflow: "visible", ...style }}>
    <path d="M14 136 L62 44 Q88 40 106 88 Z" fill={C.yellow} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M44 78 Q64 70 80 92 M30 106 Q48 100 60 116" fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" />
    <ellipse cx={84} cy={66} rx={24} ry={32} transform="rotate(-38 84 66)" fill="#FFE9A8" stroke={INK} strokeWidth={7} />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Arrows                                                              */
/* ------------------------------------------------------------------ */
export const UpArrow: React.FC<{ color?: string; size?: number; style?: React.CSSProperties }> = ({ color = C.green, size = 60, style }) => (
  <svg viewBox="0 0 60 70" width={size} height={size * (70 / 60)} style={{ overflow: "visible", ...style }}>
    <path d="M30 4 L56 34 L40 34 L40 64 L20 64 L20 34 L4 34 Z" fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);

export const FlatArrow: React.FC<{ color?: string; width?: number; style?: React.CSSProperties }> = ({ color = GRAY, width = 70, style }) => (
  <svg viewBox="0 0 80 50" width={width} height={width * (50 / 80)} style={{ overflow: "visible", ...style }}>
    <path d="M4 17 L50 17 L50 4 L76 25 L50 46 L50 33 L4 33 Z" fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* 4-step checklist (all ✔)                                            */
/* ------------------------------------------------------------------ */
export const CHECK_ROWS = [
  { n: "01", t: "预算是瓶颈吗", c: CHAPTER_COLOR["第1步"] },
  { n: "02", t: "花不出去", c: CHAPTER_COLOR["第2步"] },
  { n: "03", t: "目标太高", c: CHAPTER_COLOR["第3步"] },
  { n: "04", t: "横向扩量", c: CHAPTER_COLOR["第4步"] },
];
export const CHECK_W = 560;
export const CHECK_H = 548;

const Tick: React.FC<{ at: number; size?: number }> = ({ at, size = 66 }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 9, stiffness: 260 });
  const p = interpolate(f, [at, at + 7], [0, 1], clamp);
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: size / 2,
        border: `5px solid ${INK}`,
        background: f >= at ? C.green : "#EEEEF2",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${f >= at ? interpolate(s, [0, 1], [1.5, 1]) : 1})`,
      }}
    >
      {f >= at ? (
        <svg viewBox="0 0 40 40" width={size * 0.66} height={size * 0.66} style={{ overflow: "visible" }}>
          <path d="M7 21 L16 30 L33 10" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        </svg>
      ) : null}
    </div>
  );
};

/** Card with a gold header and the 4 chapter rows, each with a tick popping at tickAt[i]. Unscaled size CHECK_W × CHECK_H. */
export const Checklist: React.FC<{ tickAt: number[]; flash?: number[]; style?: React.CSSProperties }> = ({ tickAt, flash = [], style }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        width: CHECK_W,
        height: CHECK_H,
        background: C.paper,
        border: `${BORDER}px solid ${INK}`,
        borderRadius: 32,
        boxShadow: SHADOW,
        overflow: "hidden",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          height: 92,
          background: GOLD,
          borderBottom: `${BORDER}px solid ${INK}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: FONT.display,
          fontSize: 54,
          color: C.paper,
          textShadow: `3px 3px 0 ${INK}`,
          whiteSpace: "nowrap",
        }}
      >
        扩量前 <span style={{ fontFamily: FONT.num, fontSize: 52 }}>4</span> 步排查
      </div>
      <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {CHECK_ROWS.map((r, i) => {
          const fl = flash[i] !== undefined ? interpolate(f, [flash[i], flash[i] + 4, flash[i] + 14], [0, 1, 0], clamp) : 0;
          return (
            <div
              key={r.n}
              style={{
                height: 94,
                display: "flex",
                alignItems: "center",
                gap: 20,
                borderRadius: 20,
                padding: "0 10px",
                background: fl > 0 ? `rgba(251,188,5,${0.45 * fl})` : undefined,
              }}
            >
              <div
                style={{
                  width: 78,
                  height: 78,
                  flex: "0 0 78px",
                  borderRadius: 20,
                  background: r.c,
                  border: `5px solid ${INK}`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(-6deg)",
                }}
              >
                <span style={{ fontFamily: FONT.num, fontSize: 50, color: C.paper, textShadow: `2px 2px 0 ${INK}` }}>{r.n}</span>
              </div>
              <span style={{ flex: 1, fontFamily: FONT.black, fontSize: 50, color: INK, whiteSpace: "nowrap" }}>{r.t}</span>
              <Tick at={tickAt[i] ?? 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Star sticker                                                        */
/* ------------------------------------------------------------------ */
const starPts = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 10 })
    .map((_, i) => {
      const a = ((-90 + i * 36) * Math.PI) / 180;
      const rr = i % 2 ? r : R;
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    })
    .join(" ");

export const StarSticker: React.FC<{ size: number; label?: string; fontSize?: number; shine?: number; style?: React.CSSProperties }> = ({
  size,
  label,
  fontSize = 100,
  shine = -1,
  style,
}) => {
  const id = `stargrad${Math.round(size)}`;
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id={id} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="45%" stopColor="#FFD233" />
            <stop offset="100%" stopColor="#F2A500" />
          </radialGradient>
          <clipPath id={`${id}c`}>
            <polygon points={starPts(100, 106, 96, 52)} />
          </clipPath>
        </defs>
        <polygon points={starPts(106, 112, 96, 52)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={8} />
        <polygon points={starPts(100, 106, 96, 52)} fill="#fff" stroke="#fff" strokeWidth={16} strokeLinejoin="round" />
        <polygon points={starPts(100, 106, 96, 52)} fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {shine >= 0 && shine <= 1 ? (
          <g clipPath={`url(#${id}c)`}>
            <rect x={-60 + shine * 280} y={-20} width={26} height={260} fill="#fff" opacity={0.7} transform="rotate(20 100 100)" />
          </g>
        ) : null}
        <path d="M62 64 Q70 52 84 50" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
      </svg>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: size * 0.53 - fontSize * 0.62,
            textAlign: "center",
            fontFamily: FONT.display,
            fontSize,
            lineHeight: 1.2,
            color: C.red,
            textShadow: `3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 6px 6px 0 ${INK}`,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Magnifier (lens centre at the box centre)                           */
/* ------------------------------------------------------------------ */
export const Lens: React.FC<{ r?: number; handle?: number; deg?: number; style?: React.CSSProperties }> = ({ r = 70, handle = 120, deg = 45, style }) => {
  const w = (r + handle) * 2 + 40;
  const c = w / 2;
  const rad = (deg * Math.PI) / 180;
  const hx0 = c + Math.cos(rad) * (r + 6);
  const hy0 = c + Math.sin(rad) * (r + 6);
  const hx1 = c + Math.cos(rad) * (r + handle);
  const hy1 = c + Math.sin(rad) * (r + handle);
  return (
    <svg width={w} height={w} style={{ position: "absolute", overflow: "visible", marginLeft: -c, marginTop: -c, ...style }}>
      <line x1={hx0} y1={hy0} x2={hx1} y2={hy1} stroke={INK} strokeWidth={34} strokeLinecap="round" />
      <line x1={hx0} y1={hy0} x2={hx1} y2={hy1} stroke="#8B5A2B" strokeWidth={20} strokeLinecap="round" />
      <circle cx={c} cy={c} r={r} fill="rgba(210,235,255,0.28)" stroke={INK} strokeWidth={13} />
      <circle cx={c} cy={c} r={r - 7} fill="none" stroke="#C9CCD6" strokeWidth={5} />
      <path d={`M${c - r * 0.58} ${c - r * 0.18} A ${r * 0.62} ${r * 0.62} 0 0 1 ${c - r * 0.12} ${c - r * 0.6}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Sparkles / burst                                                    */
/* ------------------------------------------------------------------ */
export const Sparkle: React.FC<{ x: number; y: number; size?: number; color?: string; phase?: number; speed?: number }> = ({
  x,
  y,
  size = 40,
  color = C.yellow,
  phase = 0,
  speed = 0.18,
}) => {
  const f = useCurrentFrame();
  const s = 0.55 + 0.45 * Math.sin(f * speed + phase);
  return (
    <svg
      viewBox="-20 -20 40 40"
      width={size}
      height={size}
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, overflow: "visible", transform: `scale(${s}) rotate(${f * 1.5 + phase * 30}deg)` }}
    >
      <path d="M0 -18 Q3 -3 18 0 Q3 3 0 18 Q-3 3 -18 0 Q-3 -3 0 -18 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

/** Radial burst lines + a ring, p = 0..1 */
export const BurstRing: React.FC<{ p: number; x: number; y: number; r?: number; color?: string; n?: number }> = ({ p, x, y, r = 260, color = C.yellow, n = 12 }) => {
  if (p <= 0 || p >= 1) return null;
  const o = p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
  return (
    <svg width={r * 3} height={r * 3} style={{ position: "absolute", left: x - r * 1.5, top: y - r * 1.5, overflow: "visible", opacity: o }}>
      <circle cx={r * 1.5} cy={r * 1.5} r={r * (0.5 + 0.7 * p)} fill="none" stroke={color} strokeWidth={14 * (1 - p) + 2} />
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.2;
        const r0 = r * (0.62 + 0.55 * p);
        const r1 = r0 + 60 * (1 - p) + 18;
        return (
          <line
            key={i}
            x1={r * 1.5 + Math.cos(a) * r0}
            y1={r * 1.5 + Math.sin(a) * r0}
            x2={r * 1.5 + Math.cos(a) * r1}
            y2={r * 1.5 + Math.sin(a) * r1}
            stroke={INK}
            strokeWidth={9}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** White ➕ icon with an ink outline (reads better than the emoji on coloured buttons). */
export const PlusIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({ size = 70, color = "#fff", style }) => (
  <svg viewBox="0 0 60 60" width={size} height={size} style={{ overflow: "visible", ...style }}>
    <path d="M22 6 H38 V22 H54 V38 H38 V54 H22 V38 H6 V22 H22 Z" fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);
