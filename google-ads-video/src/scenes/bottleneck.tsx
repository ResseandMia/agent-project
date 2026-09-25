import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Card, clamp, Emoji, Sfx, Stamp, useFloat, useShake, useSpring } from "../components/kit";
import { MascotFace } from "../components/Mascots";
import { Burst, Coin, Lock } from "../components/opening/props";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

// ── phase-1 geometry (full size; the whole group later shrinks to the top) ──────
const BX = 430; // bottle centre x
const MOUTH_Y = 468; // top of the bottle lip
const TRASH_X = 720;
const TRASH_Y = 820;
const GROUP_ORIGIN = "540px 140px";

// coin pile sitting on the bottle mouth (rows from the bottom)
const PILE: Array<{ x: number; y: number; k: number }> = (() => {
  const out: Array<{ x: number; y: number; k: number }> = [];
  let k = 0;
  for (let r = 0; r < 5; r++) {
    const n = 5 - r;
    for (let c = 0; c < n; c++) {
      out.push({ x: BX + (c - (n - 1) / 2) * 46 + (r % 2 ? 6 : -4), y: MOUTH_Y - 20 - r * 26, k: k++ });
    }
  }
  return out;
})();
const pileAt = (k: number) => 8 + k * 2.6;

const Bottle: React.FC<{ pulse: number }> = ({ pulse }) => (
  <svg width={1080} height={1200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {/* congestion glow around the neck */}
    <ellipse cx={BX} cy={560} rx={90} ry={80} fill={C.red} opacity={0.12 + 0.12 * pulse} />
    <path
      d={`M ${BX - 44} 494 L ${BX - 44} 610 C ${BX - 44} 664, ${BX - 200} 668, ${BX - 200} 732 L ${BX - 200} 1040 Q ${BX - 200} 1090 ${BX - 150} 1090
          L ${BX + 150} 1090 Q ${BX + 200} 1090 ${BX + 200} 1040 L ${BX + 200} 732 C ${BX + 200} 668, ${BX + 44} 664, ${BX + 44} 610 L ${BX + 44} 494 Z`}
      fill="rgba(170,210,255,0.38)"
      stroke={C.ink}
      strokeWidth={8}
      strokeLinejoin="round"
    />
    <path d={`M ${BX - 160} 760 L ${BX - 160} 1010`} stroke="#FFFFFF" strokeWidth={16} strokeLinecap="round" opacity={0.8} />
    <path d={`M ${BX - 22} 510 L ${BX - 22} 590`} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
    <rect x={BX - 64} y={MOUTH_Y - 2} width={128} height={30} rx={10} fill="#CFE6FF" stroke={C.ink} strokeWidth={7} />
  </svg>
);

const TrashCan: React.FC<{ gulp: number }> = ({ gulp }) => (
  <svg
    width={260}
    height={290}
    viewBox="0 0 260 290"
    style={{ position: "absolute", left: TRASH_X, top: TRASH_Y, overflow: "visible", transform: `scale(${1 + gulp * 0.05}, ${1 - gulp * 0.04})`, transformOrigin: "50% 100%" }}
  >
    <path d="M30 62 L230 62 L212 280 L48 280 Z" fill="#A9B4C2" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    {[90, 130, 170].map((x) => (
      <path key={x} d={`M${x} 92 L${x + (x - 130) * 0.08} 252`} stroke="#6F7B8A" strokeWidth={8} strokeLinecap="round" />
    ))}
    <rect x={18} y={50} width={224} height={24} rx={10} fill="#C6CED8" stroke={C.ink} strokeWidth={7} />
    <g transform={`rotate(${-32 - gulp * 8} 18 50)`}>
      <rect x={14} y={24} width={232} height={26} rx={10} fill="#C6CED8" stroke={C.ink} strokeWidth={7} />
      <rect x={104} y={8} width={52} height={20} rx={8} fill="#C6CED8" stroke={C.ink} strokeWidth={6} />
    </g>
  </svg>
);

/** Everything of the "pour money into a bottleneck" illustration. */
const PourScene: React.FC<{ labelAt: number; stampAt: number; tagOut: number }> = ({ labelAt, stampAt, tagOut }) => {
  const f = useCurrentFrame();
  const bagBob = useFloat(6, 0.2);
  const label = useSpring(labelAt, { damping: 11, stiffness: 220 });
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.3);
  const pileTop = MOUTH_Y - 20 - 26 * Math.min(4, Math.floor(PILE.filter((p) => f >= pileAt(p.k)).length / 3.2)) - 26;

  // falling stream from the bag
  const stream: React.ReactNode[] = [];
  for (let b = Math.max(2, f - 16 - ((f - 16) % 2)); b <= f; b += 2) {
    const t = f - b;
    const jx = ((b * 37) % 23) - 11;
    const y = 316 + 5 * t + 0.9 * t * t;
    if (y > pileTop + 10) continue;
    stream.push(<Coin key={`s${b}`} size={46} mark={false} spin={b + t * 0.4} style={{ left: BX + 10 + jx - 23 - t * 1.2, top: y - 23 }} />);
  }
  // coins rolling off the pile and flying into the trash
  const spill: React.ReactNode[] = [];
  let lastLand = -99;
  for (let b = 30; b <= f; b += 3) {
    const t = f - b;
    const D = 20;
    if (t > D) {
      lastLand = Math.max(lastLand, b + D);
      continue;
    }
    const u = t / D;
    const x0 = BX + 96 + ((b * 13) % 17);
    const y0 = MOUTH_Y - 40;
    const x1 = TRASH_X + 120 + ((b * 29) % 60) - 30;
    const y1 = TRASH_Y + 96;
    const x = x0 + (x1 - x0) * u;
    const y = y0 - 150 * 4 * u * (1 - u) * 0.5 + (y1 - y0) * u * u;
    spill.push(<Coin key={`p${b}`} size={48} mark={false} spin={t * 0.5 + b} style={{ left: x - 24, top: y - 24 }} />);
  }
  const gulp = Math.max(0, 1 - (f - lastLand) / 6);
  // a rare coin squeezes through the neck
  const trickle = [24, 50, 76, 102, 128, 154].map((b) => {
    const t = f - b;
    if (t < 0 || t > 18) return null;
    const y = interpolate(t, [0, 18], [MOUTH_Y + 10, 1030], { ...clamp, easing: Easing.in(Easing.quad) });
    return <Coin key={`t${b}`} size={40} mark={false} spin={t * 0.3} style={{ left: BX - 20, top: y - 20 }} />;
  });
  const bottom = [0, 1, 2, 3, 4, 5].map((i) => {
    const land = 42 + i * 26;
    if (f < land) return null;
    return <Coin key={`b${i}`} size={44} mark={false} style={{ left: BX - 90 + i * 34 - (i % 2) * 12, top: 1034 - (i % 3 === 2 ? 22 : 0) }} />;
  });

  return (
    <>
      <Bottle pulse={pulse} />
      {trickle}
      {bottom}
      {/* money bag pouring */}
      <div style={{ position: "absolute", left: BX - 30, top: 150 + bagBob, transform: "rotate(150deg)", transformOrigin: "50% 50%" }}>
        <Emoji e="💰" size={170} />
      </div>
      <div
        style={{
          position: "absolute",
          left: BX + 150,
          top: 190 + bagBob,
          opacity: 1 - tagOut,
          transform: "rotate(8deg)",
          fontFamily: FONT.black,
          fontSize: 46,
          color: C.paper,
          background: C.red,
          border: `5px solid ${C.ink}`,
          borderRadius: 16,
          padding: "0 18px",
          boxShadow: `5px 5px 0 ${C.ink}`,
          whiteSpace: "nowrap",
        }}
      >
        加预算
      </div>
      {stream}
      {PILE.map((p) => {
        const s = interpolate(f, [pileAt(p.k), pileAt(p.k) + 5], [0, 1], clamp);
        if (s <= 0) return null;
        return <Coin key={`pile${p.k}`} size={52} mark={false} spin={0.3 * Math.sin(p.k * 1.7)} style={{ left: p.x - 26, top: p.y - 26 - (1 - s) * 30 }} />;
      })}
      {spill}
      <TrashCan gulp={gulp} />
      <Stamp at={stampAt} text="浪费" size={96} rotate={-12} style={{ left: TRASH_X - 6, top: TRASH_Y + 108 }} />
      {/* 瓶颈 label with pointer */}
      {f >= labelAt ? (
        <div style={{ position: "absolute", left: 70, top: 506, transform: `scale(${label})`, transformOrigin: "100% 50%" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 76,
              lineHeight: 1.1,
              color: C.paper,
              background: C.red,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 22,
              boxShadow: `6px 6px 0 ${C.ink}`,
              padding: "4px 22px",
              whiteSpace: "nowrap",
            }}
          >
            瓶颈
          </div>
          <svg width={110} height={40} style={{ position: "absolute", left: 206, top: 30, overflow: "visible" }}>
            <path d={`M0 20 L${58 + pulse * 8} 20`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
            <path d={`M${50 + pulse * 8} 4 L${76 + pulse * 8} 20 L${50 + pulse * 8} 36 Z`} fill={C.ink} />
          </svg>
        </div>
      ) : null}
    </>
  );
};

// ── cards ─────────────────────────────────────────────────────────────────────
// two rows with a 32px gap (same as the gap between the two top cards); row 2 rests at y 974–1264
const ROW1_Y = 652;
const ROW2_Y = ROW1_Y + 290 + 32;
const FlipCard: React.FC<{
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  from: [number, number];
  emoji: string;
  title: string;
  titleSize?: number;
  accent: string;
  /** spring config for the flight (default is a little bouncy) */
  cfg?: { damping?: number; stiffness?: number; mass?: number };
  children: React.ReactNode;
}> = ({ at, x, y, w, h, from, emoji, title, titleSize = 50, accent, cfg, children }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, cfg ?? { damping: 14, stiffness: 150 });
  const bob = useFloat(4, 0.1, x * 0.01);
  if (f < at) return null;
  const cx = interpolate(s, [0, 1], [from[0], x + w / 2]);
  const cy = interpolate(s, [0, 1], [from[1], y + h / 2]);
  const ry = interpolate(s, [0, 1], [88, 0]);
  const sc = interpolate(s, [0, 1], [0.25, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2 + bob * s,
        width: w,
        height: h,
        transform: `perspective(1400px) rotateY(${ry}deg) scale(${sc})`,
      }}
    >
      <Card style={{ width: "100%", height: "100%", padding: 0, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            height: 84,
            background: accent,
            borderBottom: `${BORDER}px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 22px",
          }}
        >
          <Emoji e={emoji} size={54} />
          <span style={{ fontFamily: FONT.black, fontSize: titleSize, color: C.ink, whiteSpace: "nowrap" }}>{title}</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 84, bottom: 0 }}>{children}</div>
      </Card>
    </div>
  );
};

const TargetMiss: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const hit = at + 10;
  const fly = interpolate(f, [at + 2, hit], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // stuck in the card: short fast quiver instead of a big swing (keeps clear of 「偏了!」)
  const quiver = f >= hit ? Math.sin((f - hit) * 2.4) * 7 * Math.exp(-(f - hit) / 8) : 0;
  const squash = f >= hit && f < hit + 2 ? 0.82 : 1;
  const ring = 1 + 0.08 * Math.sin(f * 0.25);
  // bull's-eye in body coords = (140, 106); outer ring r≈82. The arrow lands just outside it (up-right).
  const BULL: [number, number] = [140, 106];
  const TIP: [number, number] = [250, 40];
  const tipX = interpolate(fly, [0, 1], [560, TIP[0]]);
  const tipY = interpolate(fly, [0, 1], [130, TIP[1]]);
  const miss = interpolate(f, [hit + 3, hit + 11], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <>
      <svg width={200} height={200} style={{ position: "absolute", left: 40, top: 6 }}>
        {[86, 68, 50, 32, 14].map((r, i) => (
          <circle key={r} cx={100} cy={100} r={r * 0.95} fill={i % 2 === 0 ? C.red : "#FFFFFF"} stroke={C.ink} strokeWidth={5} />
        ))}
        <circle cx={100} cy={100} r={26 * ring} fill="none" stroke={C.green} strokeWidth={5} strokeDasharray="8 7" />
      </svg>
      {/* how far it missed: dashed line from the bull's-eye to the tip */}
      {miss > 0 ? (
        <svg width={300} height={200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line
            x1={BULL[0]}
            y1={BULL[1]}
            x2={BULL[0] + (TIP[0] - BULL[0]) * miss}
            y2={BULL[1] + (TIP[1] - BULL[1]) * miss}
            stroke={C.ink}
            strokeWidth={5}
            strokeDasharray="10 9"
            strokeLinecap="round"
            opacity={0.7}
          />
          <circle cx={BULL[0]} cy={BULL[1]} r={9} fill={C.ink} opacity={0.8 * Math.min(1, miss * 3)} />
        </svg>
      ) : null}
      {fly > 0 ? (
        <div style={{ position: "absolute", left: tipX, top: tipY, transformOrigin: "0 50%", transform: `rotate(${16 + quiver}deg) scaleX(${squash})` }}>
          <svg width={150} height={40} style={{ position: "absolute", left: 0, top: -20, overflow: "visible" }}>
            <path d="M8 20 L130 20" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
            <path d="M0 20 L24 8 L24 32 Z" fill={C.ink} />
            <path d="M118 20 L146 4 M118 20 L146 36 M104 20 L130 4 M104 20 L130 36" stroke={C.red} strokeWidth={7} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
      {f >= hit ? <Burst p={(f - hit) / 8} r={26} n={6} style={{ left: TIP[0], top: TIP[1] }} /> : null}
      {f >= hit ? (
        <div
          style={{
            position: "absolute",
            left: 262,
            top: 112,
            fontFamily: FONT.display,
            fontSize: 60,
            color: C.red,
            transform: `scale(${Math.min(1, (f - hit) / 5)}) rotate(10deg)`,
          }}
        >
          偏了!
        </div>
      ) : null}
    </>
  );
};

const BadFeed: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((f - at) * 0.4));
  const badge = useSpring(at + 10, { damping: 9, stiffness: 260 });
  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        top: 22,
        width: 400,
        height: 150,
        border: `5px solid ${C.ink}`,
        borderRadius: 18,
        background: "#FAFAFA",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 14,
          top: 14,
          width: 112,
          height: 112,
          borderRadius: 12,
          border: `5px dashed ${C.muted}`,
          background: "#ECECEF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.num,
          fontSize: 64,
          color: C.muted,
          boxSizing: "border-box",
        }}
      >
        ?
      </div>
      <div style={{ position: "absolute", left: 146, top: 22, width: 200, height: 24, borderRadius: 12, background: "#B9BEC8" }} />
      <div
        style={{
          position: "absolute",
          left: 146,
          top: 62,
          width: 228,
          height: 24,
          borderRadius: 12,
          border: `4px dashed ${C.red}`,
          opacity: blink,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 146,
          top: 100,
          width: 150,
          height: 24,
          borderRadius: 12,
          border: `4px dashed ${C.red}`,
          opacity: 1.35 - blink,
          boxSizing: "border-box",
        }}
      />
      {f >= at + 10 ? (
        <div
          style={{
            position: "absolute",
            right: -22,
            top: -22,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: C.red,
            border: `4px solid ${C.ink}`,
            color: C.paper,
            fontFamily: FONT.num,
            fontSize: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${badge})`,
          }}
        >
          !
        </div>
      ) : null}
    </div>
  );
};

const Overflow: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const bulge = 1 + 0.04 * Math.sin(f * 0.5);
  const boxes = [0, 1, 2, 3].map((i) => {
    const b = at + 6 + i * 7;
    const t = f - b;
    if (t < 0) return null;
    const u = Math.min(1, t / 14);
    const x = 140 + u * (120 + i * 34);
    const y = 130 - Math.sin(u * Math.PI) * 40 + u * 14 - (i % 2) * 8;
    return (
      <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${u * (i % 2 ? -70 : 80)}deg)` }}>
        <Emoji e="📦" size={52} />
      </div>
    );
  });
  return (
    <>
      <svg width={240} height={150} style={{ position: "absolute", left: 20, top: 48, overflow: "visible" }}>
        <path d="M8 52 L120 8 L232 52 Z" fill={C.orange} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={24} y={50} width={192} height={98} fill="#FFF1DC" stroke={C.ink} strokeWidth={6} />
        <rect x={98} y={82} width={60} height={66} fill="#3A3A45" stroke={C.ink} strokeWidth={5} />
      </svg>
      {/* boxes crammed on top of the roof */}
      <div style={{ position: "absolute", left: 84, top: 10, width: 120, height: 60, transform: `scale(${bulge})`, transformOrigin: "50% 100%" }}>
        <Emoji e="📦" size={54} style={{ position: "absolute", left: 0, top: 4 }} />
        <Emoji e="📦" size={54} style={{ position: "absolute", left: 50, top: 0, transform: "rotate(12deg)" }} />
      </div>
      {boxes}
      <MascotFace kind="dog" size={130} mood="sweat" style={{ position: "absolute", right: 20, top: 40, transform: `rotate(${Math.sin(f * 0.3) * 4}deg)` }} />
    </>
  );
};

// ── checklist ─────────────────────────────────────────────────────────────────
const ROWS = [
  { n: "01", t: "预算真的是瓶颈吗？", c: CHAPTER_COLOR["第1步"] },
  { n: "02", t: "预算够却花不出去？", c: CHAPTER_COLOR["第2步"] },
  { n: "03", t: "ROAS 目标定太高？", c: CHAPTER_COLOR["第3步"] },
  { n: "04", t: "横向扩量＋耐心评估", c: CHAPTER_COLOR["第4步"] },
];
const ROW_Y0 = 372;
const ROW_H = 164;
const ROW_GAP = 28;

const CheckRow: React.FC<{ i: number; at: number; focusAt: number }> = ({ i, at, focusAt }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 19, stiffness: 170 });
  const hot = i === 2;
  const dim = hot ? 0 : interpolate(f, [focusAt, focusAt + 8], [0, 1], clamp);
  const liftS = useSpring(focusAt, { damping: 10, stiffness: 200 });
  const lift = hot ? liftS : 0;
  const shake = useShake(focusAt, 16, 10);
  const glow = hot && f >= focusAt ? 0.6 + 0.4 * Math.sin((f - focusAt) * 0.3) : 0;
  const jiggle = hot && f >= focusAt ? Math.sin((f - focusAt) * 0.8) * 10 * Math.exp(-(f - focusAt) / 20) + Math.sin(f * 0.25) * 4 : 0;
  if (f < at) return null;
  const r = ROWS[i];
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: ROW_Y0 + i * (ROW_H + ROW_GAP),
        width: 960,
        height: ROW_H,
        transform: `translate(${hot ? shake : 0}px, ${(1 - s) * 170}px) scale(${1 + 0.03 * lift})`,
        opacity: Math.min(1, s * 2) * (1 - 0.55 * dim),
        filter: dim > 0 ? `saturate(${1 - 0.7 * dim})` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hot && f >= focusAt ? C.purpleSoft : C.paper,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 30,
          boxShadow: hot && glow > 0 ? `${SHADOW}, 0 0 ${30 + 30 * glow}px ${10 * glow}px ${C.purple}AA` : SHADOW,
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
          gap: 30,
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            flex: "0 0 118px",
            borderRadius: 26,
            background: r.c,
            border: `${BORDER}px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-6deg)",
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontFamily: FONT.num, fontSize: 60, color: C.paper, textShadow: `3px 3px 0 ${C.ink}` }}>{r.n}</span>
        </div>
        <span style={{ fontFamily: FONT.black, fontSize: 54, color: C.ink, whiteSpace: "nowrap" }}>{r.t}</span>
      </div>
      <div style={{ position: "absolute", left: 960 - 34 - 74, top: 41, width: 74, height: 82, transform: `rotate(${jiggle}deg)`, transformOrigin: "50% 0" }}>
        <Lock size={74} color={hot && f >= focusAt ? C.purple : C.yellow} />
      </div>
    </div>
  );
};

const MindBlown: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 9, stiffness: 240 });
  if (f < at) return null;
  const wig = Math.sin((f - at) * 0.22) * 2;
  return (
    <div
      style={{
        position: "absolute",
        // sits on row 03's top edge between the title and the padlock, so the lock stays visible
        left: 616,
        top: ROW_Y0 + 2 * (ROW_H + ROW_GAP) - 44,
        transform: `rotate(${6 + wig}deg) scale(${interpolate(s, [0, 1], [2.4, 1])})`,
        opacity: Math.min(1, s * 2.5),
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: C.yellow,
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 24,
        boxShadow: `8px 8px 0 ${C.ink}`,
        padding: "6px 24px 6px 14px",
      }}
    >
      <Emoji e="🤯" size={70} />
      <span style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.1 }}>反直觉</span>
    </div>
  );
};

const CuriousPup: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 12, stiffness: 160 });
  if (f < at) return null;
  const q = interpolate(f, [at + 8, at + 14], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 760, top: 1118, width: 300, height: 176, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 90, top: interpolate(s, [0, 1], [200, 10]), transform: `rotate(${-14 + Math.sin(f * 0.15) * 4}deg)` }}>
        <MascotFace kind="dog" size={180} mood="normal" />
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 8,
          fontFamily: FONT.num,
          fontSize: 96,
          color: C.purple,
          textShadow: `3px 3px 0 ${C.ink}`,
          transform: `scale(${q}) rotate(${-12 + Math.sin(f * 0.3) * 6}deg)`,
        }}
      >
        ?
      </div>
    </div>
  );
};

// ── scene ─────────────────────────────────────────────────────────────────────
const Bottleneck: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useLineStarts();
  const wordAt = useWordTime();

  const labelAt = at(0) + 1;
  const stampAt = wordAt(0, "浪费") - 3;
  const P2 = at(1) - 6; // illustration shrinks to the top, cards flip out
  const cardA = wordAt(1, "定向不准") - 4;
  const cardB = wordAt(1, "商品") - 4;
  const cardC = wordAt(2, "业务") - 6;
  const P3 = at(3) - 8; // cards leave, checklist slides up
  const rowsAt = at(3) - 2;
  const focusAt = wordAt(3, "第3步") - 3;
  const stickerAt = wordAt(3, "反直觉") - 4;

  const shrink = useSpring(P2, { damping: 16, stiffness: 130 });
  const exit = useSpring(P3, { damping: 18, stiffness: 140 });
  const exitFade = interpolate(f, [P3, P3 + 6], [1, 0], clamp); // quick fade so the old cards don't ghost behind the checklist
  const head = useSpring(P3 + 4, { damping: 12, stiffness: 200 }); // after the old cards have faded out
  const bottleCenter: [number, number] = [540 + (BX - 540) * 0.5, 140 + (700 - 140) * 0.5];

  return (
    <AbsoluteFill>
      {/* phase 1 + 2 (leaves at P3) */}
      {exitFade > 0 ? (
        <AbsoluteFill style={{ transform: `translateY(${-260 * exit}px) scale(${1 - 0.15 * exit})`, opacity: exitFade, transformOrigin: "540px 600px" }}>
          <AbsoluteFill style={{ transformOrigin: GROUP_ORIGIN, transform: `translateY(${56 * (1 - shrink)}px) scale(${1 - 0.5 * shrink})` }}>
            <PourScene labelAt={labelAt} stampAt={stampAt} tagOut={shrink} />
          </AbsoluteFill>
          {/* card C is drawn first so its flight from the bottle passes BEHIND the top row (never hides 「偏了!」);
              near-critical spring so it settles without dipping toward the caption bubble (y≈1330) */}
          <FlipCard at={cardC} x={250} y={ROW2_Y} w={580} h={290} from={bottleCenter} emoji="📦" title="业务接不住" accent={C.orangeSoft} cfg={{ damping: 19, stiffness: 170 }}>
            <Overflow at={cardC} />
          </FlipCard>
          <FlipCard at={cardA} x={48} y={ROW1_Y} w={476} h={290} from={bottleCenter} emoji="🎯" title="定向不准" accent={C.redSoft}>
            <TargetMiss at={cardA} />
          </FlipCard>
          <FlipCard at={cardB} x={556} y={ROW1_Y} w={476} h={290} from={bottleCenter} emoji="📋" title="商品 Feed 质量差" titleSize={44} accent={C.blueSoft}>
            <BadFeed at={cardB} />
          </FlipCard>
        </AbsoluteFill>
      ) : null}

      {/* phase 3: 4-step checklist */}
      {f >= P3 + 4 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 222,
            display: "flex",
            justifyContent: "center",
            transform: `scale(${interpolate(head, [0, 1], [0.4, 1])})`,
            opacity: Math.min(1, head * 2),
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 84,
              lineHeight: 1.1,
              color: C.ink,
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: SHADOW,
              padding: "8px 40px",
              whiteSpace: "nowrap",
              transform: "rotate(-2deg)",
            }}
          >
            扩量前 · <span style={{ color: C.red }}><span style={{ fontFamily: FONT.num, fontSize: 76 }}>4</span> 步</span>排查
          </div>
        </div>
      ) : null}
      {ROWS.map((_, i) => (
        <CheckRow key={i} i={i} at={rowsAt + i * 5} focusAt={focusAt} />
      ))}
      <MindBlown at={stickerAt} />
      <CuriousPup at={focusAt + 6} />

      <Sfx name="stamp" at={stampAt} volume={0.4} />
      <Sfx name="swish" at={cardA} volume={0.35} />
      <Sfx name="swish" at={cardB} volume={0.35} />
      <Sfx name="pop" at={cardC} volume={0.4} />
      <Sfx name="sparkle" at={focusAt} volume={0.35} />
      <Sfx name="pop" at={stickerAt} volume={0.45} />
    </AbsoluteFill>
  );
};

export default Bottleneck;
