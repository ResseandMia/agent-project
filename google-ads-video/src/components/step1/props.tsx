import React from "react";
import { random, useCurrentFrame } from "remotion";
import { BudgetButton } from "../BudgetButton";
import { C, FONT } from "../../theme";

/**
 * The 「加预算」 button with its glass cover and the little hanging sign 「还没排查」.
 * The sign rides on the cover (lifts and fades with it).
 */
export const CoveredButton: React.FC<{
  size?: number;
  cover?: number;
  pressed?: number;
  tone?: "red" | "green" | "gray";
  glow?: number;
  swing?: number; // sign rotation in deg
  sign?: string;
  signColor?: string;
  signTextColor?: string;
  signFlip?: number; // 0..1: the sign flips around its vertical axis (text swap happens at 0.5 by the caller)
  style?: React.CSSProperties;
}> = ({ size = 300, cover = 1, pressed = 0, tone = "red", glow = 0, swing = 0, sign = "还没排查", signColor = C.yellow, signTextColor = C.ink, signFlip = 0, style }) => {
  const s = size / 420;
  const coverY = -(1 - cover) * 320 * s;
  return (
    <div style={{ position: "relative", width: size, height: size * 0.82, ...style }}>
      <BudgetButton size={size} cover={cover} pressed={pressed} tone={tone} glow={glow} />
      {sign && cover > 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 200 * s,
            transform: `translate(-50%, ${coverY}px)`,
            // fades out during the first third of a lift so it never trails across content above
            opacity: Math.max(0, Math.min(1, cover * 3 - 2)),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* hook on the glass */}
          <div style={{ width: 16, height: 16, borderRadius: 8, background: C.ink }} />
          <div style={{ transformOrigin: "50% -8px", transform: `rotate(${swing}deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={90} height={22} style={{ marginTop: -8, overflow: "visible" }}>
              <path d="M45 0 L12 22 M45 0 L78 22" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            </svg>
            <div
              style={{
                fontFamily: FONT.black,
                fontSize: 34,
                lineHeight: 1.2,
                color: signTextColor,
                background: signColor,
                border: `4px solid ${C.ink}`,
                borderRadius: 12,
                transform: `scaleX(${Math.max(0.04, Math.abs(Math.cos(signFlip * Math.PI)))})`,
                padding: "2px 14px",
                whiteSpace: "nowrap",
                boxShadow: `4px 4px 0 ${C.ink}`,
              }}
            >
              {sign}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CONFETTI = [C.blue, C.red, C.yellow, C.green, C.purple, C.orange];

/** Deterministic confetti (+ optional coins) burst from (x, y), in the parent's coordinates. */
export const Burst: React.FC<{
  at: number;
  x: number;
  y: number;
  seed: string;
  n?: number;
  coins?: number;
  power?: number;
  dur?: number;
  spread?: number; // half-angle in degrees around straight up
}> = ({ at, x, y, seed, n = 36, coins = 0, power = 26, dur = 50, spread = 70 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const g = 1.25;
  const fade = t > dur * 0.6 ? 1 - (t - dur * 0.6) / (dur * 0.4) : 1;
  const items: React.ReactNode[] = [];
  const total = n + coins;
  for (let i = 0; i < total; i++) {
    const isCoin = i >= n;
    const a = ((-90 + (random(`${seed}a${i}`) * 2 - 1) * spread) * Math.PI) / 180;
    const sp = power * (0.55 + 0.65 * random(`${seed}s${i}`));
    const vx = Math.cos(a) * sp;
    const vy = Math.sin(a) * sp;
    const drag = 0.96;
    // integrate with drag analytically-ish
    const k = (1 - Math.pow(drag, t)) / (1 - drag);
    const px = x + vx * k;
    const py = y + vy * k + 0.5 * g * t * t * 0.55;
    const rot = random(`${seed}r${i}`) * 360 + t * (random(`${seed}w${i}`) * 24 - 12);
    if (isCoin) {
      items.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: px - 26,
            top: py - 26,
            width: 52,
            height: 52,
            borderRadius: 26,
            background: `radial-gradient(circle at 35% 35%, #FFE58A, ${C.yellow} 55%, ${C.gold})`,
            border: `4px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.num,
            fontSize: 26,
            color: C.ink,
            transform: `rotateY(${(t * 18 + i * 40) % 360}deg)`,
            opacity: fade,
          }}
        >
          $
        </div>,
      );
    } else {
      const col = CONFETTI[Math.floor(random(`${seed}c${i}`) * CONFETTI.length)];
      const round = random(`${seed}o${i}`) > 0.7;
      items.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: px - 9,
            top: py - 14,
            width: round ? 20 : 16,
            height: round ? 20 : 30,
            borderRadius: round ? 10 : 4,
            background: col,
            border: `3px solid ${C.ink}`,
            transform: `rotate(${rot}deg) scaleX(${Math.cos((t + i) * 0.3)})`,
            opacity: fade,
          }}
        />,
      );
    }
  }
  return <>{items}</>;
};

/** Little stars orbiting above a dizzy head; (x, y) is the orbit center. */
export const DizzyStars: React.FC<{ x: number; y: number; rx?: number; ry?: number; n?: number; opacity?: number }> = ({
  x,
  y,
  rx = 80,
  ry = 22,
  n = 3,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = f * 0.22 + (i * Math.PI * 2) / n;
        const px = x + Math.cos(a) * rx;
        const py = y + Math.sin(a) * ry;
        const front = Math.sin(a) > 0;
        return (
          <svg
            key={i}
            width={46}
            height={46}
            viewBox="-12 -12 24 24"
            style={{ position: "absolute", left: px - 23, top: py - 23, opacity, transform: `scale(${front ? 1.1 : 0.8}) rotate(${f * 6}deg)`, zIndex: front ? 3 : 1 }}
          >
            <path
              d="M0 -10 L2.9 -3.2 L10 -3.1 L4.4 1.6 L6.2 9 L0 4.8 L-6.2 9 L-4.4 1.6 L-10 -3.1 L-2.9 -3.2 Z"
              fill={C.yellow}
              stroke={C.ink}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </>
  );
};

/** damped swing (deg) triggered at frame `at` */
export const swingAfter = (f: number, at: number, amp = 18, decay = 14, speed = 0.45) =>
  f < at ? 0 : amp * Math.exp(-(f - at) / decay) * Math.sin((f - at) * speed);

/** A gold coin with a $ (spin = rotateY degrees). */
export const Coin: React.FC<{ size?: number; spin?: number; style?: React.CSSProperties }> = ({ size = 56, spin = 0, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `radial-gradient(circle at 35% 35%, #FFE58A, ${C.yellow} 55%, ${C.gold})`,
      border: `${Math.max(3, size / 14)}px solid ${C.ink}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT.num,
      fontSize: size * 0.5,
      color: C.ink,
      transform: `rotateY(${spin % 360}deg)`,
      ...style,
    }}
  >
    $
  </div>
);

/** spring-like 0→1 value computed without hooks (usable inside conditionals) */
export const springVal = (f: number, at: number, dur = 30) => {
  if (f < at) return 0;
  const t = (f - at) / dur;
  return 1 - Math.exp(-t * 9) * Math.cos(t * 14);
};
