import React from "react";
import { C, FONT } from "../../theme";

const INK = C.ink;
export const DOG_FUR = "#F6C98B";

/** Gold coin. `spin` (radians) fakes a 3D flip by squashing X. `mark` draws a "$". */
export const Coin: React.FC<{ size?: number; spin?: number; mark?: boolean; style?: React.CSSProperties }> = ({
  size = 64,
  spin = 0,
  mark = true,
  style,
}) => {
  const sx = Math.max(0.16, Math.abs(Math.cos(spin)));
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 34% 30%, #FFF0A8, ${C.yellow} 52%, #D98E00)`,
        border: `${Math.max(3, Math.round(size * 0.075))}px solid ${INK}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scaleX(${sx})`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: size * 0.12,
          borderRadius: "50%",
          border: `${Math.max(2, size * 0.05)}px solid #C98300`,
          opacity: 0.8,
        }}
      />
      {mark && size >= 62 ? (
        <span style={{ fontFamily: FONT.num, fontSize: size * 0.56, color: "#9A5F00", lineHeight: 1, position: "relative" }}>$</span>
      ) : null}
    </div>
  );
};

/** Puppy arm with a paw at the end. Rotates around the shoulder (bottom centre). angle 0 = pointing up. */
export const Paw: React.FC<{ length?: number; width?: number; angle?: number; style?: React.CSSProperties }> = ({
  length = 160,
  width = 56,
  angle = 0,
  style,
}) => {
  const r = width * 0.72;
  return (
    <div
      style={{
        position: "absolute",
        width: r * 2,
        height: length + r,
        marginLeft: -r,
        marginTop: -(length + r),
        transformOrigin: `50% 100%`,
        transform: `rotate(${angle}deg)`,
        ...style,
      }}
    >
      <svg width={r * 2} height={length + r} viewBox={`0 0 ${r * 2} ${length + r}`} style={{ overflow: "visible" }}>
        <rect x={r - width / 2} y={r} width={width} height={length} rx={width / 2} fill={DOG_FUR} stroke={INK} strokeWidth={6} />
        <circle cx={r} cy={r} r={r} fill={DOG_FUR} stroke={INK} strokeWidth={6} />
        <ellipse cx={r} cy={r + r * 0.18} rx={r * 0.42} ry={r * 0.34} fill="#F7A1B0" />
        {[-0.5, 0, 0.5].map((k) => (
          <circle key={k} cx={r + k * r * 0.9} cy={r - r * 0.45 + Math.abs(k) * r * 0.2} r={r * 0.17} fill="#F7A1B0" />
        ))}
      </svg>
    </div>
  );
};

/** Motion streaks behind a flying object. `dir` = direction of travel in degrees (0 = right). */
export const SpeedLines: React.FC<{ t: number; dir: number; len?: number; opacity?: number; color?: string }> = ({
  t,
  dir,
  len = 220,
  opacity = 1,
  color = INK,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${dir + 180}deg)`, opacity }}>
    {[-70, -24, 22, 66].map((dy, i) => {
      const ph = ((t * 0.09 + i * 0.31) % 1 + 1) % 1;
      const w = len * (0.55 + 0.45 * Math.sin(i * 2.1 + 1));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 110 + ph * 60,
            top: dy - 5,
            width: w * (1 - ph * 0.5),
            height: 11,
            borderRadius: 6,
            background: color,
            opacity: 0.85 - ph * 0.6,
          }}
        />
      );
    })}
  </div>
);

/** Cartoon smoke puff; p = 0..1 progress. */
export const Puff: React.FC<{ p: number; size?: number; style?: React.CSSProperties }> = ({ p, size = 260, style }) => {
  if (p <= 0 || p >= 1) return null;
  const o = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  return (
    <div style={{ position: "absolute", width: 0, height: 0, ...style }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.4;
        const d = size * 0.34 * (0.3 + p);
        const r = size * (0.2 + 0.08 * Math.sin(i * 3.1)) * (0.5 + p * 0.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.cos(a) * d - r,
              top: Math.sin(a) * d - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `5px solid ${INK}`,
              opacity: o,
            }}
          />
        );
      })}
    </div>
  );
};

/** Red octagon stop paddle with 「停」 on a stick. Anchor = centre of the sign. */
export const StopSign: React.FC<{ size?: number; stick?: number; style?: React.CSSProperties }> = ({ size = 170, stick = 200, style }) => {
  const oct = "polygon(29% 0, 71% 0, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0 71%, 0 29%)";
  return (
    <div style={{ position: "absolute", width: size, height: size + stick, ...style }}>
      <div
        style={{
          position: "absolute",
          left: size / 2 - 11,
          top: size * 0.8,
          width: 22,
          height: stick + size * 0.2,
          background: "#8A6A4A",
          border: `5px solid ${INK}`,
          borderRadius: 8,
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size, background: INK, clipPath: oct }} />
      <div style={{ position: "absolute", left: 7, top: 7, width: size - 14, height: size - 14, background: "#FFFFFF", clipPath: oct }} />
      <div
        style={{
          position: "absolute",
          left: 15,
          top: 15,
          width: size - 30,
          height: size - 30,
          background: C.red,
          clipPath: oct,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: FONT.display, fontSize: size * 0.56, color: "#FFFFFF", lineHeight: 1 }}>停</span>
      </div>
    </div>
  );
};

/** Padlock drawn with divs. Anchor = top-left. `open` 0..1 lifts the shackle. */
export const Lock: React.FC<{ size?: number; open?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 80,
  open = 0,
  color = C.yellow,
  style,
}) => {
  const u = size / 80;
  return (
    <div style={{ position: "absolute", width: size, height: size * 1.1, ...style }}>
      <div
        style={{
          position: "absolute",
          left: 16 * u,
          top: -open * 18 * u,
          width: 48 * u,
          height: 52 * u,
          border: `${9 * u}px solid ${INK}`,
          borderBottom: "none",
          borderRadius: `${26 * u}px ${26 * u}px 0 0`,
          boxSizing: "border-box",
          transformOrigin: "85% 100%",
          transform: `rotate(${open * 24}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 40 * u,
          width: 80 * u,
          height: 58 * u,
          background: color,
          border: `${6 * u}px solid ${INK}`,
          borderRadius: 14 * u,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 12 * u, height: 20 * u, borderRadius: 6 * u, background: INK }} />
      </div>
    </div>
  );
};

/** Starburst impact lines around a point (p 0..1). */
export const Burst: React.FC<{ p: number; r?: number; n?: number; color?: string; style?: React.CSSProperties }> = ({
  p,
  r = 70,
  n = 8,
  color = INK,
  style,
}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{ position: "absolute", width: 0, height: 0, ...style }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * 360;
        const d = r * (0.6 + p * 0.8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: -5,
              width: r * 0.55 * (1 - p),
              height: 10,
              borderRadius: 5,
              background: color,
              transformOrigin: "0 50%",
              transform: `rotate(${a}deg) translateX(${d}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
