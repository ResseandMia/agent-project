import React from "react";
import { Easing, interpolate, interpolateColors, random, spring, useCurrentFrame } from "remotion";
import { BudgetButton } from "../BudgetButton";
import { BORDER, C, FONT, SHADOW } from "../../theme";
import { clamp, Emoji } from "../kit";

export const ORANGE = C.orange;
export const DOG_FUR = "#F6C98B";

/** hook-free spring 0→1 starting at frame `at` (usable inside loops/conditionals) */
export const sp = (f: number, at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < at ? 0 : spring({ frame: f - at, fps: 30, config: { damping: 14, stiffness: 170, mass: 0.8, ...cfg } });

/** quick scale punch 1 → 1+amp → 1 after frame `at` */
export const punch = (f: number, at: number, amp = 0.14, decay = 5) =>
  f < at ? 1 : 1 + amp * Math.exp(-(f - at) / decay) * Math.abs(Math.cos((f - at) * 0.45));

/* -------------------------------------------------------------------------------------------------
 * Budget button + transparent 「出口」 pipe (outlet on the LEFT, button on the RIGHT).
 * Bills jam inside the pipe; from `flowAt` the jam clears and money streams out of the outlet.
 * Local box: width = `length`, height = button height (btnSize * 0.82).
 * ----------------------------------------------------------------------------------------------- */
export const JamPipe: React.FC<{
  length: number;
  btnSize?: number;
  diameter?: number;
  pressed?: number;
  glow?: number;
  billTimes: number[]; // frame each jammed bill arrives in its slot (<= 0: already there)
  flowAt?: number;
  label?: string;
  labelSize?: number;
  jamShake?: number; // extra horizontal jitter (px) applied to jammed bills
  spray?: { vx: [number, number]; vy: [number, number] }; // launch velocity ranges when leaving the outlet
  outlet?: number; // local x where flowing bills leave the pipe and launch (default: the flare mouth)
  seed?: string;
  style?: React.CSSProperties;
}> = ({ length, btnSize = 250, diameter = 80, pressed = 0, glow = 0, billTimes, flowAt, label = "出口", labelSize = 36, jamShake = 0, spray = { vx: [-12, -5], vy: [-18, -9] }, outlet = 4, seed = "jp", style }) => {
  const f = useCurrentFrame();
  const s = btnSize / 420;
  const H = btnSize * 0.82;
  const D = diameter;
  const btnLeft = length - btnSize;
  const cy = H - 60 * s - 4; // pipe centre: level with the button base
  const x0 = 38; // pipe body starts after the flare
  const x1 = btnLeft + 70 * s; // pipe tucks under the base
  const gap = D * 0.6;
  const billSize = D * 0.82;
  const flowing = flowAt !== undefined && f >= flowAt;
  const tF = flowAt !== undefined ? f - flowAt : -1;
  const ox = outlet; // launch point x
  const LIFE = 24;

  type B = { key: string; x: number; y: number; rot: number; op: number; sc: number; out: boolean };
  const bills: B[] = [];

  const launch = (key: string, tOut: number, xIn: number, rot0: number) => {
    // tOut = frames since this bill left the outlet
    const vx = spray.vx[0] + random(`${seed}vx${key}`) * (spray.vx[1] - spray.vx[0]);
    const vy = spray.vy[0] + random(`${seed}vy${key}`) * (spray.vy[1] - spray.vy[0]);
    const spin = (random(`${seed}sp${key}`) * 2 - 1) * 14;
    const x = ox + vx * tOut;
    const y = cy + vy * tOut + 0.5 * 1.25 * tOut * tOut;
    const op = interpolate(tOut, [LIFE - 9, LIFE], [1, 0], clamp);
    bills.push({ key, x, y, rot: rot0 + spin * tOut, op, sc: 1 + Math.min(0.25, tOut * 0.02), out: true });
    void xIn;
  };

  // jammed bills
  billTimes.forEach((a, i) => {
    const slot = x0 + billSize * 0.42 + i * gap;
    const rot0 = (random(`${seed}r${i}`) * 2 - 1) * 26;
    const dy = (random(`${seed}y${i}`) * 2 - 1) * D * 0.08;
    if (f < a - 7) return;
    if (!flowing) {
      const inP = interpolate(f, [a - 7, a], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const x = x1 + (slot - x1) * inP;
      const jig = Math.sin(f * 1.1 + i * 2.1) * (1.4 + jamShake) + (inP < 1 ? 0 : 0);
      bills.push({ key: `j${i}`, x: x + jig, y: cy + dy + Math.cos(f * 0.9 + i) * 1.2, rot: rot0 + Math.sin(f * 0.7 + i) * 3, op: 1, sc: 1, out: false });
      return;
    }
    // flowing: accelerate towards the outlet, then fly out
    const pos = (t: number) => slot - (4 * t + 1.1 * t * t);
    let tExit = 0;
    while (pos(tExit) > ox && tExit < 80) tExit++;
    if (tF < tExit) {
      bills.push({ key: `j${i}`, x: pos(tF), y: cy + dy * (1 - tF / Math.max(1, tExit)), rot: rot0 * (1 - tF / Math.max(1, tExit)), op: 1, sc: 1, out: false });
    } else if (tF - tExit < LIFE) {
      launch(`j${i}`, tF - tExit, 0, rot0);
    }
  });

  // continuous stream after the jam clears
  if (flowing) {
    const SPEED = 24;
    const travel = (x1 - ox) / SPEED;
    for (let k = 0; k < 60; k++) {
      const born = 8 + k * 4;
      const t = tF - born;
      if (t < 0) break;
      if (t > travel + LIFE) continue;
      const rot0 = (random(`${seed}sr${k}`) * 2 - 1) * 16;
      if (t < travel) {
        bills.push({ key: `s${k}`, x: x1 - SPEED * t, y: cy + (random(`${seed}sy${k}`) * 2 - 1) * D * 0.08, rot: rot0, op: 1, sc: 1, out: false });
      } else {
        launch(`s${k}`, t - travel, 0, rot0);
      }
    }
  }

  const flowGlow = flowing ? interpolate(tF, [0, 6, 30], [0, 1, 0.55], clamp) : 0;

  return (
    <div style={{ position: "relative", width: length, height: H, ...style }}>
      {/* pipe glass body */}
      <div
        style={{
          position: "absolute",
          left: x0,
          width: x1 - x0,
          top: cy - D / 2,
          height: D,
          background: flowing ? `linear-gradient(180deg, rgba(210,240,215,0.75), rgba(160,220,175,0.45))` : "linear-gradient(180deg, rgba(215,235,255,0.8), rgba(170,205,240,0.45))",
          borderTop: `${BORDER}px solid ${C.ink}`,
          borderBottom: `${BORDER}px solid ${C.ink}`,
          boxSizing: "border-box",
          boxShadow: flowGlow > 0 ? `0 0 ${26 * flowGlow}px ${C.yellow}` : undefined,
        }}
      />
      {/* outlet flare */}
      <svg width={48} height={D + 44} style={{ position: "absolute", left: 0, top: cy - D / 2 - 22, overflow: "visible" }}>
        <path
          d={`M${x0 + 4} 22 L2 2 L2 ${D + 42} L${x0 + 4} ${D + 22}`}
          fill={flowing ? "rgba(200,238,208,0.85)" : "rgba(215,235,255,0.85)"}
          stroke={C.ink}
          strokeWidth={BORDER}
          strokeLinejoin="round"
        />
      </svg>
      {/* bills (inside + flying out) */}
      {bills.map((b) => (
        <div
          key={b.key}
          style={{
            position: "absolute",
            left: b.x - billSize / 2,
            top: b.y - billSize / 2,
            width: billSize,
            height: billSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: b.op,
            transform: `rotate(${b.rot}deg) scale(${b.sc})`,
            zIndex: b.out ? 5 : 1,
          }}
        >
          <Emoji e="💵" size={billSize} />
        </div>
      ))}
      {/* glass highlights over the bills */}
      <div
        style={{
          position: "absolute",
          left: x0 + 14,
          width: x1 - x0 - 40,
          top: cy - D / 2 + 10,
          height: 9,
          borderRadius: 5,
          background: "rgba(255,255,255,0.75)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x0 + 30,
          width: (x1 - x0) * 0.35,
          top: cy + D / 2 - 22,
          height: 6,
          borderRadius: 3,
          background: "rgba(255,255,255,0.5)",
          zIndex: 2,
        }}
      />
      {/* speed streaks while flowing */}
      {flowing
        ? [0, 1, 2].map((k) => {
            const w = x1 - x0;
            const px = x0 + (((w - ((tF * 30 + k * w * 0.37) % w)) + w) % w);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: px,
                  top: cy - D / 2 + 16 + k * 18,
                  width: 70,
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.9)",
                  zIndex: 3,
                  opacity: flowGlow,
                }}
              />
            );
          })
        : null}
      {/* collar where the pipe meets the base */}
      <div
        style={{
          position: "absolute",
          left: x1 - 34,
          width: 30,
          top: cy - D / 2 - 10,
          height: D + 20,
          background: "#3A3A45",
          border: `${BORDER - 1}px solid ${C.ink}`,
          borderRadius: 8,
          boxSizing: "border-box",
          zIndex: 3,
        }}
      />
      {/* button */}
      <div style={{ position: "absolute", left: btnLeft, top: 0, zIndex: 4 }}>
        <BudgetButton size={btnSize} pressed={pressed} glow={glow} />
      </div>
      {/* 出口 label */}
      <div style={{ position: "absolute", left: -6, top: cy - D / 2 - 34 - labelSize * 1.4, zIndex: 6 }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT.black,
            fontSize: labelSize,
            lineHeight: 1.25,
            color: C.ink,
            background: flowing ? C.green : C.paper,
            border: `4px solid ${C.ink}`,
            borderRadius: 14,
            padding: "0 14px",
            boxShadow: `4px 4px 0 ${C.ink}`,
            whiteSpace: "nowrap",
            ...(flowing ? { color: C.paper, textShadow: `2px 2px 0 ${C.ink}` } : {}),
          }}
        >
          {label}
        </span>
        <svg width={40} height={30} style={{ position: "absolute", left: 22, top: labelSize * 1.25 + 8, overflow: "visible" }}>
          <path d="M8 2 L8 24 M0 16 L8 26 L16 16" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * A cartoon hammer. Pivot (the paw grip) is the element's origin; angle 0 = head pointing LEFT,
 * positive angles lift the head up (clockwise). `len` = pivot → head centre.
 * ----------------------------------------------------------------------------------------------- */
export const Hammer: React.FC<{ angle: number; len?: number; style?: React.CSSProperties }> = ({ angle, len = 150, style }) => (
  <div style={{ position: "absolute", width: 0, height: 0, transform: `rotate(${angle}deg)`, ...style }}>
    {/* handle */}
    <div
      style={{
        position: "absolute",
        left: -len + 10,
        top: -11,
        width: len + 18,
        height: 22,
        background: "#A86A34",
        border: `4px solid ${C.ink}`,
        borderRadius: 11,
        boxSizing: "border-box",
      }}
    />
    {/* head */}
    <div
      style={{
        position: "absolute",
        left: -len - 30,
        top: -44,
        width: 62,
        height: 88,
        background: "linear-gradient(90deg, #C9CFD8, #8E96A3)",
        border: `5px solid ${C.ink}`,
        borderRadius: 14,
        boxSizing: "border-box",
      }}
    />
    {/* paw grip */}
    <div
      style={{
        position: "absolute",
        left: -24,
        top: -24,
        width: 48,
        height: 48,
        borderRadius: 24,
        background: DOG_FUR,
        border: `5px solid ${C.ink}`,
        boxSizing: "border-box",
      }}
    />
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * 「预算」 sticker that gets struck through with a red line at `crossAt`.
 * ----------------------------------------------------------------------------------------------- */
export const StruckTag: React.FC<{ crossAt: number; size?: number; text?: string; emoji?: string }> = ({ crossAt, size = 48, text = "预算", emoji = "💰" }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [crossAt, crossAt + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const dim = interpolate(f, [crossAt + 4, crossAt + 12], [0, 1], clamp);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT.black,
          fontSize: size,
          lineHeight: 1.2,
          color: C.ink,
          background: interpolateColors(dim, [0, 1], [C.yellow, "#E4DDC8"]),
          border: `5px solid ${C.ink}`,
          borderRadius: 18,
          padding: "4px 20px 4px 12px",
          boxShadow: `6px 6px 0 ${C.ink}`,
          whiteSpace: "nowrap",
        }}
      >
        <Emoji e={emoji} size={size * 0.95} style={{ opacity: 1 - dim * 0.4 }} />
        <span style={{ opacity: 1 - dim * 0.35 }}>{text}</span>
      </div>
      {p > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -14,
            right: -14,
            top: "50%",
            height: 12,
            marginTop: -4,
            borderRadius: 6,
            background: C.red,
            border: `3px solid ${C.ink}`,
            transformOrigin: "left center",
            transform: `rotate(-8deg) scaleX(${p})`,
          }}
        />
      ) : null}
    </div>
  );
};

/* ------------------------------------ checklist illustrations ------------------------------------ */

/** radar with rotating sweep + a tracking tag in the middle */
export const Radar: React.FC<{ size?: number; t: number }> = ({ size = 250, t }) => {
  const r = size / 2 - 8;
  const c = size / 2;
  const ang = (t * 7) % 360;
  const blips = [
    { a: 40, d: 0.62 },
    { a: 160, d: 0.8 },
    { a: 265, d: 0.45 },
  ];
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const wedge = (a0: number, a1: number) =>
    `M${c} ${c} L${c + r * Math.cos(rad(a0))} ${c + r * Math.sin(rad(a0))} A${r} ${r} 0 0 1 ${c + r * Math.cos(rad(a1))} ${c + r * Math.sin(rad(a1))} Z`;
  return (
    <svg width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      <circle cx={c} cy={c} r={r} fill={C.orangeSoft} stroke={C.ink} strokeWidth={6} />
      {[0.33, 0.66].map((k) => (
        <circle key={k} cx={c} cy={c} r={r * k} fill="none" stroke={C.orange} strokeWidth={3} opacity={0.6} />
      ))}
      <path d={`M${c - r} ${c} L${c + r} ${c} M${c} ${c - r} L${c} ${c + r}`} stroke={C.orange} strokeWidth={3} opacity={0.5} />
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={wedge(ang - 12 * (k + 1), ang - 12 * k)} fill={C.orange} opacity={0.55 - k * 0.1} />
      ))}
      <path d={`M${c} ${c} L${c + r * Math.cos(rad(ang))} ${c + r * Math.sin(rad(ang))}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      {blips.map((b, i) => {
        const since = (((ang - b.a) % 360) + 360) % 360; // degrees since the sweep passed
        const lit = Math.max(0, 1 - since / 200);
        const x = c + r * b.d * Math.cos(rad(b.a));
        const y = c + r * b.d * Math.sin(rad(b.a));
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={9 + lit * 12} fill={C.green} opacity={lit * 0.35} />
            <circle cx={x} cy={y} r={9} fill={C.green} stroke={C.ink} strokeWidth={3} opacity={0.35 + lit * 0.65} />
          </g>
        );
      })}
      <circle cx={c} cy={c} r={40} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <foreignObject x={c - 32} y={c - 32} width={64} height={64}>
        <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Emoji e="🏷️" size={46} />
        </div>
      </foreignObject>
    </svg>
  );
};

/** mini product card: fields fill in with `fill` 0..1, a magnifier sweeps across with `scan` 0..1 */
export const FeedCard: React.FC<{ fill: number; scan: number; w?: number }> = ({ fill, scan, w = 230 }) => {
  const fields = [0.9, 0.7, 0.8, 0.55];
  return (
    <div
      style={{
        position: "relative",
        width: w,
        background: C.paper,
        border: `5px solid ${C.ink}`,
        borderRadius: 22,
        boxShadow: `6px 6px 0 ${C.ink}`,
        padding: 14,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 104,
          borderRadius: 14,
          background: C.blueSoft,
          border: `4px solid ${C.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Emoji e="👕" size={74} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {fields.map((wd, i) => {
          const p = interpolate(fill, [i / 4, (i + 1) / 4], [0, 1], clamp);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  position: "relative",
                  width: `${wd * 100}%`,
                  height: 18,
                  borderRadius: 9,
                  border: `3px dashed ${p >= 1 ? "transparent" : "#A9A9B6"}`,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${p * 100}%`, background: i === 0 ? C.orange : C.ink, borderRadius: 9 }} />
              </div>
              {p >= 1 ? (
                <svg width={22} height={22} style={{ flex: "none" }}>
                  <path d="M3 12 L9 18 L19 4" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
      {scan > 0 && scan < 1 ? (
        <div
          style={{
            position: "absolute",
            left: -20 + scan * (w - 60),
            top: 20 + Math.sin(scan * Math.PI * 2) * 30,
            transform: "rotate(-15deg)",
          }}
        >
          <Emoji e="🔍" size={74} />
        </div>
      ) : null}
    </div>
  );
};

/** simple meeple */
export const Meeple: React.FC<{ color: string; h?: number; style?: React.CSSProperties }> = ({ color, h = 70, style }) => (
  <svg viewBox="0 0 60 100" width={h * 0.6} height={h} style={{ overflow: "visible", display: "block", ...style }}>
    <path d="M9 97 L9 66 Q9 46 30 46 Q51 46 51 66 L51 97 Z" fill={color} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={30} cy={24} r={18} fill={color} stroke={C.ink} strokeWidth={5} />
    <circle cx={23} cy={25} r={3.6} fill={C.ink} />
    <circle cx={37} cy={25} r={3.6} fill={C.ink} />
  </svg>
);

/** spotlight whose cone narrows with `narrow` 0..1 until it only lights one figure */
export const Spotlight: React.FC<{ narrow: number; w?: number; h?: number; t: number }> = ({ narrow, w = 270, h = 300, t }) => {
  const cx = w / 2;
  const top = 58;
  const ground = h - 14;
  const hw = interpolate(narrow, [0, 1], [w / 2 + 6, 26]) + Math.sin(t * 0.25) * 2;
  const xs = [0.1, 0.3, 0.5, 0.7, 0.9].map((k) => k * w);
  const cols = [C.blue, C.green, C.orange, C.purple, C.red];
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${cx - 16} ${top} L${cx - hw} ${ground} L${cx + hw} ${ground} L${cx + 16} ${top} Z`} fill={C.yellow} opacity={0.42} />
        <ellipse cx={cx} cy={ground} rx={hw} ry={14} fill={C.yellow} opacity={0.75} stroke={C.ink} strokeWidth={3} />
        {/* lamp */}
        <path d={`M${cx - 34} 8 L${cx + 34} 8 L${cx + 22} ${top} L${cx - 22} ${top} Z`} fill="#3A3A45" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={cx} cy={top} rx={22} ry={7} fill="#FFF3B0" stroke={C.ink} strokeWidth={4} />
      </svg>
      {xs.map((x, i) => {
        const lit = Math.abs(x - cx) < hw - 8;
        return (
          <div key={i} style={{ position: "absolute", left: x - 21, top: ground - 72, transform: lit ? "none" : "scale(0.94)", transformOrigin: "50% 100%" }}>
            <Meeple color={lit ? cols[i] : "#CFCFD6"} h={70} />
          </div>
        );
      })}
    </div>
  );
};

/** a board / card wrapper with the design-system border & shadow */
export const boardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  background: C.paper,
  border: `${BORDER}px solid ${C.ink}`,
  borderRadius: 30,
  boxShadow: SHADOW,
  boxSizing: "border-box",
  ...extra,
});
