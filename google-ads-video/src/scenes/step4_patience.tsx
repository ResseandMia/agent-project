import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { clamp, Emoji, Marker, Sfx, Stamp, useFloat, useSpring } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { Panel } from "../components/Shared";
import { Arm, Bubble, CAT, CHONG_SHOULDER, ChongHead, FingerPaw, TofuBowl } from "../components/step4/parts";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const GREEN = CHAPTER_COLOR["第4步"];
const INK = C.ink;

/* ------------------------------------------------------------------ */
/* Part A: impatient 阿冲                                               */
/* ------------------------------------------------------------------ */
const WallClock: React.FC<{ enter: number; stopAt: number }> = ({ enter, stopAt }) => {
  const f = useCurrentFrame();
  const s = useSpring(enter, { damping: 12 });
  const t = Math.min(f, stopAt);
  const tick = Math.floor(t / 8);
  const frac = Math.min(1, (t % 8) / 3);
  const sec = (tick + Easing.out(Easing.back(3))(frac)) * 30;
  const shake = f < stopAt ? Math.sin(f * 0.785) * 3 * (frac < 1 ? 1 : 0.3) : 0;
  const r = 128;
  return (
    <div
      style={{
        position: "absolute",
        left: 820 - r - 14,
        top: 550 - r - 14,
        transform: `scale(${s}) rotate(${shake}deg)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <svg width={(r + 14) * 2} height={(r + 14) * 2} style={{ overflow: "visible" }}>
        <circle cx={r + 24} cy={r + 24} r={r} fill={INK} />
        <circle cx={r + 14} cy={r + 14} r={r} fill={C.paper} stroke={INK} strokeWidth={10} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const r0 = i % 3 === 0 ? r - 34 : r - 24;
          return (
            <line
              key={i}
              x1={r + 14 + Math.sin(a) * r0}
              y1={r + 14 - Math.cos(a) * r0}
              x2={r + 14 + Math.sin(a) * (r - 12)}
              y2={r + 14 - Math.cos(a) * (r - 12)}
              stroke={INK}
              strokeWidth={i % 3 === 0 ? 8 : 5}
              strokeLinecap="round"
            />
          );
        })}
        <g transform={`rotate(${sec / 12 + 40} ${r + 14} ${r + 14})`}>
          <line x1={r + 14} y1={r + 14} x2={r + 14} y2={r + 14 - 62} stroke={INK} strokeWidth={12} strokeLinecap="round" />
        </g>
        <g transform={`rotate(${sec} ${r + 14} ${r + 14})`}>
          <line x1={r + 14} y1={r + 34} x2={r + 14} y2={r + 14 - 96} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
        </g>
        <circle cx={r + 14} cy={r + 14} r={11} fill={C.red} stroke={INK} strokeWidth={4} />
      </svg>
    </div>
  );
};

const PUP = { x: 262, y: 680, size: 250 };
const PANEL = { x: 540, y: 770, w: 450 };
const REFRESH = { x: 640, y: 960 }; // centre of the refresh button (left side of the dashboard, within 阿冲's reach)

const ImpatientPart: React.FC<{
  enter: number;
  bubbleAt: number;
  tapStart: number;
  catIn: number;
  catPress: number;
  out: number;
  absStart: number;
}> = ({ enter, bubbleAt, tapStart, catIn, catPress, out, absStart }) => {
  const f = useCurrentFrame();
  const sIn = useSpring(enter, { damping: 12 });
  const sBubble = useSpring(bubbleAt, { damping: 9, stiffness: 220 });
  const sCat = useSpring(catIn, { damping: 13 });
  const sPress = useSpring(catPress, { damping: 12, stiffness: 220 });
  const sPanel = useSpring(enter + 6, { damping: 13 });
  const o = interpolate(f, [out, out + 8], [1, 0], clamp);
  if (f < enter || o <= 0) return null;
  const calm = f >= catPress;
  // impatient bouncing (a floating head has no feet to stomp with): quick hops + a side-to-side wobble
  const ph = f * 0.55;
  const hop = calm ? 0 : -Math.abs(Math.sin(ph)) * 24;
  const wobble = calm ? 0 : Math.sin(ph) * 6;
  const u = PUP.size / 200;
  const talking = talkingAt(idOfKind("dog"), absStart + f);
  // tapping refresh (every 9 frames until the cat stops him)
  const tapT = f - tapStart;
  const tapping = tapT >= 0 && f < catPress;
  const tp = tapping ? (tapT % 9) / 9 : 1;
  const tapDown = tapping ? Math.max(0, 1 - Math.abs(tp - 0.35) / 0.35) : 0;
  const taps = tapping ? Math.floor(tapT / 9) + tp : tapT >= 0 ? Math.floor((catPress - tapStart) / 9) + 1 : 0;
  const bubblePunch = tapping ? 1 + 0.08 * tapDown : 1;
  const shimmer = ((f * 14) % 600) - 200;
  const pawSize = 84;
  // his right arm reaches over to the refresh button; retracts when 欧姐 stops him
  const pupTop = PUP.y + hop + (1 - sIn) * 400;
  const armIn = interpolate(f, [tapStart - 6, tapStart + 2], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const armGone = calm ? interpolate(f, [catPress, catPress + 10], [0, 1], clamp) : 0;
  const armO = Math.min(1, armIn * 1.5) * (1 - armGone);
  const shoulder: [number, number] = [PUP.x + CHONG_SHOULDER.R[0] * u, pupTop + CHONG_SHOULDER.R[1] * u];
  const fistTarget: [number, number] = [REFRESH.x, REFRESH.y - 44 - pawSize * 0.92 + tapDown * 30 - armGone * 60];
  const reach = armIn * (1 - armGone * 0.5);
  const fist: [number, number] = [
    shoulder[0] + 30 + (fistTarget[0] - shoulder[0] - 30) * reach,
    shoulder[1] - 40 + (fistTarget[1] - shoulder[1] + 40) * reach,
  ];
  // stopwatch (in his left paw); frozen once the cat presses it
  const SW_PAW = { x: 16, y: 226 };
  const swX = PUP.x + SW_PAW.x * u - 60;
  const swY = PUP.y + SW_PAW.y * u - 70;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, transform: `translateY(60px) scale(${1 - (1 - o) * 0.1})`, transformOrigin: "540px 760px" }}>
      <WallClock enter={enter} stopAt={catPress} />
      {/* dashboard with refresh */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y + (1 - sPanel) * 200,
          opacity: Math.min(1, sPanel * 2),
        }}
      >
        <Panel title="广告后台" accent={C.blue} width={PANEL.w} bodyStyle={{ padding: "22px 24px", height: 200, position: "relative", boxSizing: "border-box" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: [220, 160, 190][i],
                height: 26,
                borderRadius: 13,
                marginBottom: 26,
                marginLeft: 150,
                background: `linear-gradient(90deg, #E4E6EC ${shimmer - 120}px, #F6F7FA ${shimmer}px, #E4E6EC ${shimmer + 120}px)`,
              }}
            />
          ))}
        </Panel>
      </div>
      {f >= enter + 6 ? (
        <div
          style={{
            position: "absolute",
            left: REFRESH.x - 62,
            top: REFRESH.y - 62 + (1 - sPanel) * 200,
            width: 124,
            height: 124,
            borderRadius: 62,
            background: C.yellow,
            border: `${BORDER}px solid ${INK}`,
            boxShadow: `6px 6px 0 ${INK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 - 0.1 * tapDown})`,
          }}
        >
          <div style={{ transform: `rotate(${taps * 180}deg)`, height: 78 }}>
            <Emoji e="🔄" size={78} />
          </div>
        </div>
      ) : null}
      {/* tapping finger on an arm from 阿冲's right shoulder */}
      <Arm from={shoulder} to={[fist[0] - 12, fist[1] + 6]} bend={-22} opacity={armO} />
      {armO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: fist[0] - pawSize / 2,
            top: fist[1] - pawSize * 0.44,
            opacity: armO,
          }}
        >
          <FingerPaw size={pawSize} />
        </div>
      ) : null}
      {tapping && tapDown > 0.6 ? (
        <svg width={200} height={200} style={{ position: "absolute", left: REFRESH.x - 100, top: REFRESH.y - 100, overflow: "visible" }}>
          {[0, 1, 2, 3].map((k) => {
            const a = (k * 90 + 45) * (Math.PI / 180);
            return (
              <line key={k} x1={100 + Math.cos(a) * 78} y1={100 + Math.sin(a) * 78} x2={100 + Math.cos(a) * 98} y2={100 + Math.sin(a) * 98} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            );
          })}
        </svg>
      ) : null}
      {/* 阿冲: floating head (same head-only look as in steps 1–3), stopwatch in his left paw */}
      <div style={{ position: "absolute", left: PUP.x, top: PUP.y + hop + (1 - sIn) * 400, transform: `rotate(${wobble}deg)`, transformOrigin: "50% 40%" }}>
        <ChongHead
          size={PUP.size}
          talking={talking}
          mood={calm ? "sweat" : talking > 0.05 ? "normal" : "shock"}
          paws={armO > 0.02 ? [SW_PAW] : [SW_PAW, { x: 194, y: 198 }]}
        >
          <div style={{ position: "absolute", left: SW_PAW.x * u - 60, top: SW_PAW.y * u - 70, transform: `rotate(${calm ? 0 : Math.sin(f * 1.1) * 10}deg)` }}>
            <Emoji e="⏱️" size={110} />
          </div>
        </ChongHead>
      </div>
      {/* "现在？" bubble */}
      {f >= bubbleAt ? (
        <Bubble
          tail="down"
          style={{
            left: 232,
            top: 506,
            transform: `scale(${sBubble * bubblePunch}) rotate(-4deg)`,
            transformOrigin: "50% 100%",
            opacity: calm ? interpolate(f, [catPress, catPress + 8], [1, 0.0], clamp) : 1,
          }}
        >
          <span style={{ fontFamily: FONT.display, fontSize: 76, color: C.red }}>现在？</span>
        </Bubble>
      ) : null}
      {/* 欧姐 stops the stopwatch */}
      {f >= catIn ? (
        <>
          <div style={{ position: "absolute", left: interpolate(sCat, [0, 1], [-260, 40]), top: 738, transform: "rotate(12deg)" }}>
            <MascotFace kind="cat" size={210} mood="smug" talking={talkingAt(idOfKind("cat"), absStart + f)} />
          </div>
          <svg
            width={90}
            height={90}
            style={{
              position: "absolute",
              left: swX + 60 - 45 + interpolate(sPress, [0, 1], [-160, 0]),
              top: swY + 22 - 45 + interpolate(sPress, [0, 1], [-120, 0]),
              overflow: "visible",
              opacity: f >= catPress - 6 ? 1 : 0,
            }}
          >
            <circle cx={45} cy={45} r={36} fill={CAT.main} stroke={INK} strokeWidth={6} />
            <path d="M31 52 L31 66 M45 55 L45 70 M59 52 L59 66" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          </svg>
          {f >= catPress ? (
            <div
              style={{
                position: "absolute",
                left: 64,
                top: 658,
                fontFamily: FONT.black,
                fontSize: 44,
                color: C.paper,
                background: GREEN,
                border: `5px solid ${INK}`,
                borderRadius: 18,
                padding: "0 16px",
                transform: `scale(${sPress}) rotate(-6deg)`,
                boxShadow: `5px 5px 0 ${INK}`,
                whiteSpace: "nowrap",
              }}
            >
              别急
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Part B: two clock cards                                              */
/* ------------------------------------------------------------------ */
const polar = (cx: number, cy: number, r: number, hour: number) => {
  const a = ((hour * 30 - 90) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
};

const ClockFace: React.FC<{ spinFrom: number; wedgeAt: number }> = ({ spinFrom, wedgeAt }) => {
  const f = useCurrentFrame();
  const size = 300;
  const c = size / 2;
  const r = 136;
  // hand: fast spins (3 turns) ending at 2 o'clock, then sweeps towards 6 with the wedge, then idles just before 6
  const spin = interpolate(f, [spinFrom, wedgeAt], [-34, 2], { ...clamp, easing: Easing.out(Easing.cubic) });
  const wedge = interpolate(f, [wedgeAt, wedgeAt + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const REST = 5.6;
  const handHour =
    f < wedgeAt ? spin : f <= wedgeAt + 16 ? 2 + (REST - 2) * wedge : REST + Math.sin((f - wedgeAt - 16) * 0.08) * 0.2;
  const end = 2 + 4 * wedge;
  const [x0, y0] = polar(c, c, r - 16, 2);
  const [x1, y1] = polar(c, c, r - 16, end);
  const [hx, hy] = polar(c, c, r - 62, handHour);
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <circle cx={c + 8} cy={c + 8} r={r} fill={INK} />
      <circle cx={c} cy={c} r={r} fill={C.paper} stroke={INK} strokeWidth={8} />
      {wedge > 0 ? <path d={`M${c} ${c} L${x0} ${y0} A ${r - 16} ${r - 16} 0 0 1 ${x1} ${y1} Z`} fill={C.yellow} stroke={INK} strokeWidth={4} /> : null}
      {Array.from({ length: 12 }).map((_, i) => {
        const [ax, ay] = polar(c, c, r - 10, i);
        const [bx, by] = polar(c, c, r - (i % 3 === 0 ? 30 : 22), i);
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={INK} strokeWidth={i % 3 === 0 ? 7 : 5} strokeLinecap="round" />;
      })}
      <line x1={c} y1={c} x2={hx} y2={hy} stroke={GREEN} strokeWidth={13} strokeLinecap="round" />
      <line x1={c} y1={c} x2={hx} y2={hy} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.25} />
      <circle cx={c} cy={c} r={14} fill={GREEN} stroke={INK} strokeWidth={4} />
      {/* numerals on top of the hand, with a paper halo so the hand never hides them */}
      {[2, 6].map((h) => {
        const [tx, ty] = polar(c, c, r - 50, h);
        return (
          <text
            key={h}
            x={tx}
            y={ty + 15}
            textAnchor="middle"
            fontFamily={FONT.num}
            fontSize={44}
            fill={wedge > 0.5 ? INK : C.muted}
            stroke={C.paper}
            strokeWidth={8}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {h}
          </text>
        );
      })}
    </svg>
  );
};

const Calendar: React.FC<{ flipFrom: number; land: number }> = ({ flipFrom, land }) => {
  const f = useCurrentFrame();
  const w = 290;
  const h = 290;
  const period = 5;
  const flipping = f >= flipFrom && f < land;
  const p = flipping ? ((f - flipFrom) % period) / period : 0;
  const sLand = useSpring(land, { damping: 10, stiffness: 200 });
  const blankPage = (
    <div style={{ position: "absolute", inset: 0, padding: 24, boxSizing: "border-box", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ height: 30, borderRadius: 7, background: "#E6E7EC" }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", left: 8, top: 8, width: w, height: h, borderRadius: 22, background: INK }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          border: `${BORDER}px solid ${INK}`,
          background: C.paper,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 62, background: C.red, borderBottom: `${BORDER}px solid ${INK}` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 62, bottom: 0 }}>
          {f >= land ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${0.6 + 0.4 * sLand})`,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: FONT.num, fontSize: 136, color: INK, lineHeight: 1.05 }}>2</span>
                <span style={{ fontFamily: FONT.black, fontSize: 72, color: INK }}>周</span>
              </div>
            </div>
          ) : (
            blankPage
          )}
          {flipping ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#FBFBFD",
                borderTop: `3px solid #D0D2DA`,
                transformOrigin: "50% 0%",
                transform: `perspective(600px) rotateX(${p * 110}deg)`,
                boxShadow: `0 ${10 * p}px ${14 * p}px rgba(0,0,0,0.15)`,
              }}
            >
              {blankPage}
            </div>
          ) : null}
        </div>
      </div>
      {[0.28, 0.72].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: w * x - 10,
            top: -16,
            width: 20,
            height: 42,
            borderRadius: 10,
            background: "#C9CCD6",
            border: `5px solid ${INK}`,
          }}
        />
      ))}
    </div>
  );
};

const CARD = { y: 410, h: 790, w: 450 };
// Part C stamp: slammed under the rings, then glides up to sit above 阿冲 in Part D (centre ends near y≈380)
const STAMP_TOP = 1040;
const STAMP_CY = STAMP_TOP + 86;
const STAMP_TRAVEL = STAMP_CY - 380;
/** fixed zones inside a delay card so both cards line up: header / visual / label */
const Zone: React.FC<{ h?: number; children: React.ReactNode }> = ({ h, children }) => (
  <div style={{ height: h, flex: h ? undefined : 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    {children}
  </div>
);

const DelayCard: React.FC<{
  x: number;
  enter: number;
  from: -1 | 1;
  active: number;
  done: number;
  children: React.ReactNode;
}> = ({ x, enter, from, active, done, children }) => {
  const f = useCurrentFrame();
  const s = useSpring(enter, { damping: 14, stiffness: 150 });
  const float = useFloat(5, 0.08, from > 0 ? 2 : 0);
  if (f < enter) return null;
  const on = interpolate(f, [active, active + 8], [0, 1], clamp);
  const settled = interpolate(f, [done, done + 8], [0, 1], clamp);
  const lit = on * (1 - settled);
  return (
    <div
      style={{
        position: "absolute",
        left: x + (1 - s) * from * 600,
        top: CARD.y + float,
        width: CARD.w,
        height: CARD.h,
        transform: `scale(${1 + 0.035 * lit}) rotate(${(1 - s) * from * 12}deg)`,
        opacity: interpolate(on, [0, 1], [0.8, 1]),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: C.paper,
          border: `${BORDER}px solid ${INK}`,
          borderRadius: 34,
          boxShadow: lit > 0 ? `${SHADOW}, 0 0 0 ${12 * lit}px ${GREEN}55` : SHADOW,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 20px 20px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Part C: two progress rings → 再下结论                                */
/* ------------------------------------------------------------------ */
const Ring: React.FC<{ cx: number; cy: number; label: string; fillFrom: number; fillTo: number }> = ({ cx, cy, label, fillFrom, fillTo }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [fillFrom, fillTo], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const sDone = useSpring(fillTo, { damping: 8, stiffness: 240 });
  const r = 125;
  const box = 300;
  const c = box / 2;
  const full = f >= fillTo;
  return (
    <div style={{ position: "absolute", left: cx - c, top: cy - c, width: box, height: box, transform: `scale(${full ? 1 + 0.06 * Math.sin(Math.min(1, (f - fillTo) / 10) * Math.PI) : 1})` }}>
      <svg width={box} height={box} style={{ overflow: "visible" }}>
        <circle cx={c + 6} cy={c + 6} r={r + 17} fill={INK} />
        <circle cx={c} cy={c} r={r + 17} fill={full ? C.greenSoft : C.paper} stroke={INK} strokeWidth={6} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#E4E6EC" strokeWidth={26} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={GREEN}
          strokeWidth={26}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${p} 1`}
          transform={`rotate(-90 ${c} ${c})`}
          opacity={p > 0.001 ? 1 : 0}
        />
        <circle cx={c} cy={c} r={r - 17} fill="none" stroke={INK} strokeWidth={5} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.black,
          fontSize: 50,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      {full ? (
        <div style={{ position: "absolute", right: -8, top: -12, transform: `scale(${sDone}) rotate(${(1 - sDone) * -90}deg)` }}>
          <Emoji e="✅" size={70} />
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Part D: zen 阿冲 levitating over the button with hot tofu            */
/* ------------------------------------------------------------------ */
const BOWL_W = 200;
const ZenChong: React.FC<{ enter: number; absStart: number }> = ({ enter, absStart }) => {
  const f = useCurrentFrame();
  const s = useSpring(enter, { damping: 12 });
  const sDog = useSpring(enter + 8, { damping: 10, stiffness: 160 });
  const lev = useFloat(8, 0.1);
  if (f < enter) return null;
  const size = 262;
  const u = size / 200;
  const btnSize = 440;
  const btnH = btnSize * 0.82;
  const floor = 1262;
  const btnTop = floor - btnH;
  const seatY = floor - 252 * (btnSize / 420) + 20; // dome top (+20)
  // head-only 阿冲 floats a little above the dome (the bowl foot hangs ~40px over the button top)
  const dogTop = seatY - 0.945 * size * 1.55 - 40;
  const t = f - enter;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* aura */}
      {[0, 1, 2].map((k) => {
        const q = ((t + k * 20) % 60) / 60;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 540 - 150 - 120 * q,
              top: dogTop + 150 - 150 - 120 * q,
              width: 300 + 240 * q,
              height: 300 + 240 * q,
              borderRadius: "50%",
              border: `6px solid ${C.gold}`,
              opacity: (1 - q) * 0.5 * Math.min(1, sDog * 2),
            }}
          />
        );
      })}
      {/* the button pops in place (above the caption zone) instead of rising through the caption */}
      <div
        style={{
          position: "absolute",
          left: 540 - btnSize / 2,
          top: btnTop,
          opacity: Math.min(1, s * 2),
          transform: `scale(${0.6 + 0.4 * s})`,
          transformOrigin: "50% 100%",
        }}
      >
        <BudgetButton size={btnSize} glow={0.25 + 0.1 * Math.sin(f * 0.1)} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - size / 2,
          top: dogTop + lev - 6 + (1 - Math.min(1, sDog)) * -160, // no overshoot below the seat, so the bowl never hides the 加预算 label
          opacity: Math.min(1, sDog * 2),
        }}
      >
        <ChongHead
          size={size}
          mood="zen"
          talking={talkingAt(idOfKind("dog"), absStart + f)}
          paws={[
            { x: 30, y: 244 },
            { x: 170, y: 244 },
          ]}
        >
          {/* a big bowl of hot tofu (「心急吃不了热豆腐」) held under his chin */}
          <TofuBowl width={BOWL_W} t={t} style={{ position: "absolute", left: 100 * u - BOWL_W / 2, top: 158 * u }} />
        </ChongHead>
      </div>
      {/* sparkles */}
      {[
        [300, dogTop + 60, 0],
        [790, dogTop + 30, 1.7],
        [250, dogTop + 250, 3.1],
        [830, dogTop + 240, 4.4],
      ].map(([x, y, ph], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - 30,
            top: y - 30,
            opacity: Math.min(1, sDog * 2) * (0.4 + 0.6 * Math.abs(Math.sin(f * 0.12 + ph))),
            transform: `scale(${0.7 + 0.3 * Math.abs(Math.sin(f * 0.12 + ph))})`,
          }}
        >
          <Emoji e="✨" size={60} />
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
export default function Step4Patience() {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();

  // Part A
  const bubbleAt = wordAt(0, "马上") - 4;
  const tapStart = 14;
  const catIn = at(1) - 10;
  const catPress = at(1) - 2;
  const aOut = wordAt(1, "转化延迟") - 2;
  // Part B
  const titleAt = aOut + 2;
  const markAt = wordAt(1, "按产品") - 2;
  const leftIn = aOut + 4;
  const rightIn = aOut + 10;
  const leftActive = at(2) - 3;
  const wedgeAt = wordAt(2, "2") - 6;
  const rightActive = at(3) - 3;
  const land = wordAt(3, "最长") - 4;
  const bOut = at(4) - 8;
  // Part C
  const chipsAt = bOut + 4;
  const btnAt = at(4) - 4;
  const press = wordAt(4, "加预算后") + 4;
  const r1From = wordAt(4, "至少") - 2;
  const r1To = r1From + 26;
  const r2To = Math.max(r1To + 24, wordAt(4, "转化周期") - 2);
  const labelAt = wordAt(4, "至少") + 4;
  const stampAt = wordAt(4, "再下结论") - 3;
  // Part D hand-off: first clear Part C out of the button's area (cycle group fades in 6 frames, the stamp glides
  // up to the top), then pop the zen button in place, so nothing ever crosses the caption bubble or the stamp.
  const compactAt = at(5) - 16;
  const zenAt = compactAt + 8;

  const titleS = useSpring(titleAt, { damping: 13 });
  const bO = interpolate(f, [bOut, bOut + 10], [1, 0], clamp);
  const chipS = useSpring(chipsAt, { damping: 12 });
  const btnS = useSpring(btnAt, { damping: 12 });
  const labelS = useSpring(labelAt, { damping: 12 });
  const slotS = useSpring(labelAt + 8, { damping: 12 });
  const compact = interpolate(f, [compactAt, compactAt + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const fadeC = interpolate(f, [compactAt, compactAt + 6], [0, 1], clamp);
  const pressed = interpolate(f, [press, press + 5, press + 14], [0, 0.6, 0], clamp);
  const arrowP = interpolate(f, [btnAt + 6, btnAt + 18], [0, 1], clamp);

  return (
    <AbsoluteFill>
      {/* ---------------- Part A ---------------- */}
      <ImpatientPart enter={0} bubbleAt={bubbleAt} tapStart={tapStart} catIn={catIn} catPress={catPress} out={aOut} absStart={scene.start} />
      <Sfx name="pop" at={bubbleAt} volume={0.3} />
      <Sfx name="click" at={tapStart + 12} volume={0.3} />
      <Sfx name="click" at={tapStart + 39} volume={0.3} />
      <Sfx name="stamp" at={catPress + 2} volume={0.25} />

      {/* ---------------- Part B ---------------- */}
      {f >= titleAt && bO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 270,
            display: "flex",
            justifyContent: "center",
            opacity: Math.min(1, titleS * 2) * bO,
            transform: `translateY(${(1 - titleS) * -60}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 64,
              color: INK,
              background: C.paper,
              border: `${BORDER}px solid ${INK}`,
              borderRadius: 30,
              boxShadow: `8px 8px 0 ${INK}`,
              padding: "6px 34px",
              whiteSpace: "nowrap",
            }}
          >
            转化延迟周期：<Marker at={markAt} color={C.yellow}>按产品设定</Marker>
          </div>
        </div>
      ) : null}
      {bO > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: bO, transform: `translateY(${(1 - bO) * -120}px) scale(${1 - (1 - bO) * 0.2})`, transformOrigin: "540px 330px" }}>
          <DelayCard x={60} enter={leftIn} from={-1} active={leftActive} done={rightActive}>
            <Zone h={200}>
              <Emoji e="⚡" size={96} />
              <div style={{ fontFamily: FONT.black, fontSize: 56, color: INK, marginTop: 6, whiteSpace: "nowrap", lineHeight: 1.3 }}>冲动型消费</div>
            </Zone>
            <Zone h={340}>
              <ClockFace spinFrom={leftActive + 2} wedgeAt={wedgeAt} />
            </Zone>
            <Zone>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  opacity: f >= wedgeAt + 6 ? 1 : 0.0,
                  transform: `scale(${f >= wedgeAt + 6 ? 1 + 0.15 * Math.max(0, 1 - (f - wedgeAt - 6) / 8) : 0.5})`,
                }}
              >
                <Marker at={wedgeAt + 10} color={C.yellow}>
                  <span style={{ fontFamily: FONT.num, fontSize: 76, color: INK }}>2–6</span>
                  <span style={{ fontFamily: FONT.black, fontSize: 56, color: INK, marginLeft: 8 }}>小时</span>
                </Marker>
              </div>
            </Zone>
          </DelayCard>
          <DelayCard x={570} enter={rightIn} from={1} active={rightActive} done={bOut}>
            <Zone h={200}>
              <div style={{ display: "flex", gap: 6 }}>
                <Emoji e="💎" size={72} />
                <Emoji e="🔧" size={72} />
              </div>
              <div style={{ fontFamily: FONT.black, fontSize: 46, color: INK, marginTop: 2, marginBottom: 12, lineHeight: 1.2, textAlign: "center", whiteSpace: "nowrap" }}>
                高客单价 /<br />
                技术型产品
              </div>
            </Zone>
            <Zone h={340}>
              <Calendar flipFrom={rightActive + 5} land={land} />
            </Zone>
            <Zone>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  opacity: f >= land ? 1 : 0,
                  transform: `scale(${f >= land ? 1 + 0.15 * Math.max(0, 1 - (f - land) / 8) : 0.5})`,
                }}
              >
                <Marker at={land + 4} color={C.yellow}>
                  <span style={{ fontFamily: FONT.black, fontSize: 56, color: INK }}>最长</span>
                  <span style={{ fontFamily: FONT.num, fontSize: 76, color: INK, margin: "0 8px" }}>2</span>
                  <span style={{ fontFamily: FONT.black, fontSize: 56, color: INK }}>周</span>
                </Marker>
              </div>
            </Zone>
          </DelayCard>
        </div>
      ) : null}
      <Sfx name="whoosh" at={leftIn} volume={0.3} />
      <Sfx name="swish" at={leftActive + 2} volume={0.3} />
      <Sfx name="pop" at={wedgeAt + 6} volume={0.35} />
      <Sfx name="swish" at={rightActive + 5} volume={0.3} />
      <Sfx name="pop" at={land} volume={0.35} />

      {/* ---------------- Part C ---------------- */}
      {f >= chipsAt ? (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* recap chips */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 320,
              display: "flex",
              justifyContent: "center",
              gap: 28,
              opacity: Math.min(1, chipS * 2) * (1 - fadeC),
              transform: `translateY(${(1 - chipS) * -80}px)`,
            }}
          >
            {[
              { e: ["⚡"], t: "2–6 小时" },
              { e: ["💎", "🔧"], t: "最长 2 周" },
            ].map((c) => (
              <div
                key={c.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.paper,
                  border: `5px solid ${INK}`,
                  borderRadius: 24,
                  padding: "6px 24px 6px 16px",
                  boxShadow: `6px 6px 0 ${INK}`,
                  fontFamily: FONT.black,
                  fontSize: 48,
                  color: INK,
                  whiteSpace: "nowrap",
                }}
              >
                {c.e.map((e) => (
                  <Emoji key={e} e={e} size={52} />
                ))}
                {c.t}
              </div>
            ))}
          </div>
          {/* button → rings → stamp */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - fadeC,
              transform: `scale(${1 - 0.2 * fadeC})`,
              transformOrigin: "540px 750px",
            }}
          >
            <div style={{ position: "absolute", left: 46, top: 650, opacity: Math.min(1, btnS * 2) * (1 - fadeC), transform: `scale(${btnS})` }}>
              <BudgetButton size={240} pressed={pressed} />
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <div
                  style={{
                    fontFamily: FONT.black,
                    fontSize: 40,
                    color: C.paper,
                    background: C.red,
                    border: `4px solid ${INK}`,
                    borderRadius: 16,
                    padding: "0 14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  加预算后
                </div>
              </div>
            </div>
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - fadeC }}>
              {arrowP > 0 ? (
                <path
                  d="M296 750 L362 750"
                  stroke={INK}
                  strokeWidth={10}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - arrowP}
                />
              ) : null}
              {arrowP >= 1 ? <path d="M350 734 L370 750 L350 766" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /> : null}
            </svg>
            {f >= btnAt + 8 ? (
              <>
                <Ring cx={522} cy={750} label="周期 1" fillFrom={r1From} fillTo={r1To} />
                <Ring cx={862} cy={750} label="周期 2" fillFrom={r1To + 2} fillTo={r2To} />
                <div
                  style={{
                    position: "absolute",
                    left: 692 - 16,
                    top: 750 - 30,
                    fontFamily: FONT.num,
                    fontSize: 48,
                    color: INK,
                  }}
                >
                  +
                </div>
              </>
            ) : null}
            {f >= labelAt ? (
              <div
                style={{
                  position: "absolute",
                  left: 378,
                  width: 630,
                  top: 912,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: Math.min(1, labelS * 2) * (1 - fadeC),
                  transform: `translateY(${(1 - labelS) * 30}px)`,
                }}
              >
                <svg width={620} height={34} style={{ overflow: "visible" }}>
                  <path d="M6 4 Q6 22 30 22 L280 22 Q310 22 310 34 Q310 22 340 22 L590 22 Q614 22 614 4" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ fontFamily: FONT.black, fontSize: 46, color: INK, whiteSpace: "nowrap", marginTop: 8 }}>
                  至少等满 <span style={{ fontFamily: FONT.num, color: GREEN }}>2</span> 个完整转化周期
                </div>
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateY(${-STAMP_TRAVEL * compact}px) scale(${1 - 0.28 * compact})`,
              transformOrigin: `540px ${STAMP_CY}px`,
            }}
          >
            {/* waiting slot: a dashed outline with a ticking hourglass where the stamp will land */}
            {f >= labelAt + 8 && f < stampAt + 4 ? (
              <div
                style={{
                  position: "absolute",
                  left: 540 - 230,
                  top: STAMP_TOP + 6,
                  width: 460,
                  height: 160,
                  borderRadius: 24,
                  border: `8px dashed ${GREEN}`,
                  background: "rgba(255,255,255,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  opacity: Math.min(1, slotS * 2) * (0.55 + 0.15 * Math.sin(f * 0.18)) * interpolate(f, [stampAt, stampAt + 4], [1, 0], clamp),
                  transform: `rotate(-7deg) scale(${0.85 + 0.15 * slotS})`,
                }}
              >
                <div style={{ transform: `rotate(${Math.floor(f / 18) * 180 + Easing.out(Easing.back(2))(Math.min(1, (f % 18) / 6)) * 180}deg)`, height: 96 }}>
                  <Emoji e="⏳" size={96} />
                </div>
                {[0, 1, 2].map((k) => (
                  <div
                    key={k}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: GREEN,
                      opacity: 0.35 + 0.65 * Math.max(0, Math.sin(f * 0.2 - k * 0.9)),
                    }}
                  />
                ))}
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 0, right: 0, top: STAMP_TOP, display: "flex", justifyContent: "center" }}>
              <Stamp at={stampAt} text="再下结论" color={GREEN} size={112} rotate={-7} style={{ position: "relative" }} />
            </div>
          </div>
        </div>
      ) : null}
      <Sfx name="pop" at={r1To} volume={0.35} />
      <Sfx name="pop" at={r2To} volume={0.35} />
      <Sfx name="stamp" at={stampAt} volume={0.45} />

      {/* ---------------- Part D ---------------- */}
      <ZenChong enter={zenAt} absStart={scene.start} />
      <Sfx name="chime" at={zenAt + 6} volume={0.35} />
    </AbsoluteFill>
  );
}
