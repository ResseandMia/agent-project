import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { clamp, Emoji, Sfx, Stamp, useShake, useSpring } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { Panel } from "../components/Shared";
import { Buddy, Confetti, ConfettiRain, FlatArrow, GOLD, GRAY, pawAt, Popper, Sparkle, UpArrow } from "../components/ending/parts";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const INK = C.ink;
const PANEL_W = 470;
const BODY_H = 330;
const LX = 40;
const RX = 570;
const PY = 292;
// big (celebration) state of the Google Ads panel
const BIG = 1.62;
const BIG_LEFT = 540 - (PANEL_W * BIG) / 2;
const BIG_TOP = 156;

const ADS_ROWS = ["转化", "转化价值", "ROAS"];
const LEDGER_ROWS = [
  { e: "👤", t: "新客数量" },
  { e: "📈", t: "净增长" },
  { e: "💰", t: "整体利润" },
];

/* ---------------- left: Google Ads 后台 (all green ↑) ---------------- */
const Spark: React.FC<{ color: string; p: number }> = ({ color, p }) => (
  <svg width={124} height={60} viewBox="0 0 124 60" style={{ overflow: "visible" }}>
    <path
      d="M4 52 L28 42 L50 46 L74 28 L96 22 L120 6"
      fill="none"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  </svg>
);

const AdsPanel: React.FC<{ anim: number; gray: number; pump: number }> = ({ anim, gray, pump }) => {
  const col = interpolateColors(gray, [0, 1], [C.green, GRAY]);
  return (
    <Panel
      title="Google Ads 后台"
      accent={interpolateColors(gray, [0, 1], [C.blue, "#8E8E99"])}
      width={PANEL_W}
      bodyStyle={{ padding: "15px 26px", height: BODY_H, boxSizing: "border-box" }}
    >
      {ADS_ROWS.map((t, i) => {
        const bob = Math.sin(anim * 0.22 + i * 1.4) * 4 - pump * Math.abs(Math.sin(anim * 0.45 + i * 0.9)) * 16;
        const draw = interpolate(anim, [2 + i * 4, 18 + i * 4], [0, 1], clamp);
        return (
          <div
            key={t}
            style={{
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: i < 2 ? "4px dashed #E2E3E8" : undefined,
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontFamily: FONT.black, fontSize: 40, color: INK, whiteSpace: "nowrap" }}>{t}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Spark color={col} p={draw} />
              <UpArrow color={col} size={54} style={{ transform: `translateY(${bob}px)` }} />
            </div>
          </div>
        );
      })}
    </Panel>
  );
};

/* ---------------- right: 自己的后台 ledger ---------------- */
const LedgerRow: React.FC<{ i: number; at: number; flatAt: number }> = ({ i, at, flatAt }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 11, stiffness: 220 });
  const sf = useSpring(flatAt, { damping: 10, stiffness: 240 });
  const r = LEDGER_ROWS[i];
  if (f < at) return <div style={{ height: 100 }} />;
  const flat = f >= flatAt;
  const pulse = 1 + 0.07 * Math.sin(f * 0.25 + i);
  const wig = flat ? Math.sin((f - flatAt) * 0.35) * 5 : 0;
  return (
    <div
      style={{
        height: 100,
        display: "flex",
        alignItems: "center",
        gap: 10,
        transform: `translateX(${(1 - s) * 80}px) scale(${interpolate(s, [0, 1], [0.7, 1])})`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <Emoji e={r.e} size={46} />
      <span style={{ flex: 1, fontFamily: FONT.black, fontSize: 40, color: INK, whiteSpace: "nowrap" }}>{r.t}</span>
      <div
        style={{
          width: 116,
          height: 66,
          borderRadius: 18,
          border: flat ? `5px solid ${INK}` : `5px dashed ${C.muted}`,
          background: flat ? "#EFEFF3" : C.paper,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {flat ? (
          <div style={{ transform: `translateX(${wig}px) scale(${interpolate(sf, [0, 1], [0.3, 1])})`, display: "flex" }}>
            <FlatArrow color={GRAY} width={70} />
          </div>
        ) : (
          <span style={{ fontFamily: FONT.num, fontSize: 46, color: C.muted, transform: `scale(${pulse})`, lineHeight: 1 }}>?</span>
        )}
      </div>
    </div>
  );
};

const Ledger: React.FC<{ rowAt: number[]; flatAt: number[]; glow: number }> = ({ rowAt, flatAt, glow }) => (
  <Panel
    title="自己的后台"
    accent={GOLD}
    width={PANEL_W}
    style={{ boxShadow: glow > 0 ? `${SHADOW}, 0 0 0 ${10 * glow}px ${GOLD}66` : SHADOW }}
    bodyStyle={{
      padding: "15px 26px",
      height: BODY_H,
      boxSizing: "border-box",
      backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 112px, #D6E4F5 112px, #D6E4F5 115px)",
    }}
  >
    {LEDGER_ROWS.map((_, i) => (
      <LedgerRow key={i} i={i} at={rowAt[i]} flatAt={flatAt[i]} />
    ))}
  </Panel>
);

/* ---------------- balance scale ---------------- */
const PIV = { x: 540, y: 806 };
const HALF = 318;
const STR = 168;

const Token: React.FC<{ x: number; y: number; children: React.ReactNode; bg: string; size?: number; rot?: number }> = ({ x, y, children, bg, size = 78, rot = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: 20,
      background: bg,
      border: `5px solid ${INK}`,
      boxShadow: `4px 4px 0 ${INK}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `rotate(${rot}deg)`,
    }}
  >
    {children}
  </div>
);

const Balance: React.FC<{ tilt: number; gray: number; flat: number; neq: number; anim: number }> = ({ tilt, gray, flat, neq, anim }) => {
  const t = (tilt * Math.PI) / 180;
  const L = { x: PIV.x - HALF * Math.cos(t), y: PIV.y + HALF * Math.sin(t) };
  const R = { x: PIV.x + HALF * Math.cos(t), y: PIV.y - HALF * Math.sin(t) };
  const pan = (p: { x: number; y: number }) => {
    const rim = p.y + STR;
    return (
      <g>
        <path d={`M${p.x} ${p.y} L${p.x - 112} ${rim} M${p.x} ${p.y} L${p.x + 112} ${rim}`} stroke={INK} strokeWidth={5} />
        <path d={`M${p.x - 124} ${rim} Q${p.x} ${rim + 78} ${p.x + 124} ${rim} Z`} fill="#D9DCE3" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M${p.x - 124} ${rim} L${p.x + 124} ${rim}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <circle cx={p.x} cy={p.y} r={10} fill={GOLD} stroke={INK} strokeWidth={4} />
      </g>
    );
  };
  const green = interpolateColors(gray, [0, 1], [C.green, GRAY]);
  const tokBg = interpolateColors(gray, [0, 1], [C.greenSoft, "#EDEDF1"]);
  const lr = L.y + STR;
  const rr = R.y + STR;
  return (
    <>
      <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* post + base */}
        <path d={`M${PIV.x - 130} 1262 L${PIV.x + 130} 1262 L${PIV.x + 92} 1222 L${PIV.x - 92} 1222 Z`} fill={GOLD} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <rect x={PIV.x - 14} y={PIV.y} width={28} height={1224 - PIV.y} fill="#C98A10" stroke={INK} strokeWidth={6} />
        <path d={`M${PIV.x} ${PIV.y - 58} L${PIV.x + 22} ${PIV.y - 16} L${PIV.x - 22} ${PIV.y - 16} Z`} fill={GOLD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* beam */}
        <g transform={`rotate(${-tilt} ${PIV.x} ${PIV.y})`}>
          <rect x={PIV.x - HALF - 16} y={PIV.y - 11} width={HALF * 2 + 32} height={22} rx={11} fill={GOLD} stroke={INK} strokeWidth={6} />
        </g>
        {pan(L)}
        {pan(R)}
        <circle cx={PIV.x} cy={PIV.y} r={24} fill={C.paper} stroke={INK} strokeWidth={6} />
      </svg>
      {/* platform pan: a pile of green ↑ */}
      <Token x={L.x - 42} y={lr - 36} bg={tokBg}>
        <UpArrow color={green} size={42} />
      </Token>
      <Token x={L.x + 42} y={lr - 36} bg={tokBg} rot={4}>
        <UpArrow color={green} size={42} />
      </Token>
      <Token x={L.x} y={lr - 108 + Math.sin(anim * 0.2) * 2} bg={tokBg} rot={-5}>
        <UpArrow color={green} size={42} />
      </Token>
      {/* business pan: ? → flat → */}
      <Token x={R.x} y={rr - 36} bg={flat > 0 ? "#EDEDF1" : C.paper} rot={flat > 0 ? 0 : Math.sin(anim * 0.2) * 6}>
        {flat > 0 ? (
          <div style={{ transform: `scale(${flat})`, display: "flex" }}>
            <FlatArrow width={52} />
          </div>
        ) : (
          <span style={{ fontFamily: FONT.num, fontSize: 46, color: C.muted, lineHeight: 1 }}>?</span>
        )}
      </Token>
      {/* pan labels */}
      {[
        { p: L, rim: lr, t: "平台", bg: interpolateColors(gray, [0, 1], [C.green, GRAY]) },
        { p: R, rim: rr, t: "业务", bg: GOLD },
      ].map((o) => (
        <div
          key={o.t}
          style={{
            position: "absolute",
            left: o.p.x - 70,
            width: 140,
            top: o.rim + 50,
            textAlign: "center",
            fontFamily: FONT.black,
            fontSize: 40,
            color: C.paper,
            background: o.bg,
            border: `5px solid ${INK}`,
            borderRadius: 18,
            boxShadow: `4px 4px 0 ${INK}`,
            textShadow: `2px 2px 0 ${INK}`,
            lineHeight: 1.3,
          }}
        >
          {o.t}
        </div>
      ))}
      {/* ≠ badge on the pivot */}
      {neq > 0 ? (
        <div
          style={{
            position: "absolute",
            left: PIV.x - 50,
            top: PIV.y - 50,
            width: 100,
            height: 100,
            borderRadius: 50,
            background: C.red,
            border: `6px solid ${INK}`,
            boxShadow: `5px 5px 0 ${INK}`,
            boxSizing: "border-box",
            transform: `scale(${neq}) rotate(${(1 - neq) * -90}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 60 60" width={58} height={58}>
            <path d="M12 22 L48 22 M12 38 L48 38 M40 8 L20 52" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
    </>
  );
};

/* ---------------- scene ---------------- */
const Reality: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();

  const BURST = 3;
  const FREEZE = at(0) - 4; // record scratch
  const SPLIT = at(0) + 12; // "别只看…" → split screen
  const HEADER = SPLIT + 4;
  const LEDGER_IN = SPLIT + 10;
  const SCALE_IN = at(0) + 46;
  const LINK_AT = at(1) - 2;
  // 新客数量 follows a short breath after 对照自己后台的 — take its onset from the voice envelope
  const l1 = scene.lines[1];
  let firstOnset = -1;
  if (l1) {
    let quiet = 0;
    for (let k = 0; k < l1.env.length && firstOnset < 0; k++) {
      if (l1.env[k] < 0.05) quiet++;
      else {
        if (quiet >= 3 && k > 4) firstOnset = l1.relStart + k;
        quiet = 0;
      }
    }
  }
  const rowAt = [(firstOnset >= 0 ? firstOnset : wordAt(1, "新客数量")) - 4, wordAt(1, "净增长") - 4, wordAt(1, "整体利润") - 4];
  const CHONG_IN = at(2) - 4;
  const TILT_AT = wordAt(2, "平台") - 2;
  const biz = wordAt(2, "业务") - 4;
  const flatAt = [biz, biz + 4, biz + 8];
  const NEQ_AT = biz + 10;
  const GRAY_AT = at(3) - 2;
  const STAMP_AT = at(3) + 40;

  // time that stands still during the freeze-frame
  const anim = f < FREEZE ? f : f < SPLIT ? FREEZE : f - (SPLIT - FREEZE);
  const frozen = f >= FREEZE && f < SPLIT;
  const sp = useSpring(SPLIT, { damping: 16, stiffness: 150 });
  const flash = interpolate(f, [FREEZE, FREEZE + 2, FREEZE + 8], [0, 0.7, 0], clamp);
  const punch = frozen ? 1.045 : 1;

  // party layer
  const partyT = Math.min(f, FREEZE);
  const drop = f > SPLIT ? 1.1 * (f - SPLIT) ** 2 : 0;
  const confO = interpolate(f, [SPLIT + 2, SPLIT + 14], [1, 0], clamp);
  const hop = f < FREEZE ? -Math.abs(Math.sin(partyT * 0.34)) * 34 : 0;
  const recoil = interpolate(f, [BURST, BURST + 3, BURST + 12], [0, -16, 0], clamp);

  // phase B
  const headS = useSpring(HEADER, { damping: 12, stiffness: 200 });
  const ledS = useSpring(LEDGER_IN, { damping: 15, stiffness: 150 });
  const scaleS = useSpring(SCALE_IN, { damping: 14, stiffness: 140 });
  const linkS = useSpring(LINK_AT, { damping: 10, stiffness: 220 });
  const tiltS = useSpring(TILT_AT, { damping: 7, stiffness: 90 });
  const neqS = useSpring(NEQ_AT, { damping: 10, stiffness: 220 });
  const flatS = useSpring(flatAt[0], { damping: 10, stiffness: 220 });
  const chongS = useSpring(CHONG_IN, { damping: 11, stiffness: 180 });
  const gray = interpolate(f, [GRAY_AT, GRAY_AT + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pump = f >= TILT_AT && f < GRAY_AT ? 1 : 0;
  const tilt = 13 * tiltS + Math.sin(f * 0.07) * (f >= TILT_AT ? 1.2 : 0.8);
  const shakeX = useShake(STAMP_AT, 16, 18);
  const shakeY = useShake(STAMP_AT + 1, 14, 10);
  const grayPunch = interpolate(f, [GRAY_AT, GRAY_AT + 3, GRAY_AT + 12], [1, 1.04, 1], clamp);

  // Google Ads panel: big centre → left column
  const panelLeft = interpolate(sp, [0, 1], [BIG_LEFT, LX]);
  const panelTop = interpolate(sp, [0, 1], [BIG_TOP, PY]);
  const panelScale = interpolate(sp, [0, 1], [BIG, 1]) * grayPunch;
  const partyIn = useSpring(0, { damping: 14, stiffness: 160 });

  // 阿冲 (party, phase A)
  const PUP = { x: 540 - 135, y: 872, size: 270 };
  const u = PUP.size / 200;
  const pawL = pawAt("L", 112);
  const pawR = pawAt("R", 112);

  const lookRight = Math.floor((f - CHONG_IN) / 15) % 2 === 1;
  const chongMood = f >= STAMP_AT ? "shock" : f >= at(3) ? "sad" : "sweat";

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${punch})`, transformOrigin: "540px 620px", filter: frozen ? "saturate(0.35) contrast(1.05)" : undefined }}>
        {/* header */}
        {f >= HEADER ? (
          <div
            style={{
              position: "absolute",
              top: 150,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              transform: `translateY(${(1 - headS) * -80}px) scale(${interpolate(headS, [0, 1], [0.6, 1])})`,
              opacity: Math.min(1, headS * 2),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: C.paper,
                border: `${BORDER}px solid ${INK}`,
                borderRadius: 30,
                boxShadow: SHADOW,
                padding: "8px 32px 8px 12px",
                transform: `rotate(${-1.5 + Math.sin(f * 0.06) * 0.6}deg)`,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.display,
                  fontSize: 56,
                  color: C.paper,
                  background: GOLD,
                  border: `5px solid ${INK}`,
                  borderRadius: 20,
                  padding: "0 18px",
                  textShadow: `3px 3px 0 ${INK}`,
                  lineHeight: 1.25,
                }}
              >
                最后
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 64, color: INK, whiteSpace: "nowrap", lineHeight: 1.2 }}>对照你自己的后台</span>
            </div>
          </div>
        ) : null}

        {/* balance scale */}
        {f >= SCALE_IN ? (
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - scaleS) * 520}px)`, opacity: Math.min(1, scaleS * 2) }}>
            <Balance tilt={tilt} gray={gray} flat={f >= flatAt[0] ? flatS : 0} neq={f >= NEQ_AT ? neqS : 0} anim={f} />
          </div>
        ) : null}

        {/* 阿冲 looks left ↔ right */}
        {f >= CHONG_IN ? (
          <div
            style={{
              position: "absolute",
              left: PIV.x - 95,
              top: 1052 + (1 - chongS) * 260,
              opacity: Math.min(1, chongS * 2),
              transform: `rotate(${lookRight ? 7 : -7}deg) translateX(${lookRight ? 10 : -10}px)`,
            }}
          >
            <MascotFace kind="dog" size={190} mood={chongMood} flip={lookRight} talking={talkingAt(idOfKind("dog"), scene.start + f)} />
          </div>
        ) : null}

        {/* ledger: 自己的后台 */}
        {f >= LEDGER_IN ? (
          <div style={{ position: "absolute", left: RX, top: PY, transform: `translateX(${(1 - ledS) * 620}px) rotate(${(1 - ledS) * 8}deg)` }}>
            <Ledger rowAt={rowAt} flatAt={flatAt} glow={interpolate(f, [LINK_AT, LINK_AT + 6, LINK_AT + 30], [0, 1, 0], clamp)} />
          </div>
        ) : null}

        {/* party confetti behind the panel (rain) */}
        <ConfettiRain t={partyT + 26} drop={drop} opacity={confO} bottom={1280} />

        {/* Google Ads 后台 */}
        <div
          style={{
            position: "absolute",
            left: panelLeft,
            top: panelTop,
            transformOrigin: "0 0",
            transform: `scale(${panelScale * interpolate(partyIn, [0, 1], [0.9, 1])})`,
          }}
        >
          <AdsPanel anim={anim} gray={gray} pump={pump} />
        </div>

        {/* 对照 link between the two panels */}
        {f >= LINK_AT ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 46,
              top: PY + 76 + BODY_H / 2 - 46 + 4,
              width: 92,
              height: 92,
              borderRadius: 46,
              background: GOLD,
              border: `6px solid ${INK}`,
              boxShadow: `5px 5px 0 ${INK}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${linkS * (1 + 0.06 * Math.sin(f * 0.2))})`,
            }}
          >
            <svg viewBox="0 0 60 60" width={54} height={54}>
              <path d="M8 22 L46 22 M36 12 L48 22 L36 32 M52 40 L14 40 M24 30 L12 40 L24 50" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : null}

        {/* 阿冲 celebrating with two poppers (leaves at the split) */}
        {sp < 0.99 ? (
          <div
            style={{
              position: "absolute",
              left: PUP.x,
              top: PUP.y + hop + sp * 100,
              transformOrigin: "50% 50%",
              transform: `scale(${1 - 0.4 * Math.min(1, sp)})`,
              opacity: Math.max(0, 1 - sp * 1.3),
            }}
          >
            <Buddy
              kind="dog"
              size={PUP.size}
              mood={f >= FREEZE + 1 ? "shock" : "happy"}
              armL={f < FREEZE ? 112 + Math.sin(partyT * 0.5) * 6 : 125}
              armR={f < FREEZE ? 112 - Math.sin(partyT * 0.5) * 6 : 125}
              wag={f < FREEZE ? Math.sin(partyT * 0.9) * 22 : 0}
              stomp={f < FREEZE ? [Math.max(0, Math.sin(partyT * 0.34)) * 10, Math.max(0, -Math.sin(partyT * 0.34)) * 10] : [0, 0]}
            >
                <div style={{ position: "absolute", left: pawR[0] * u - 14, top: pawR[1] * u - 136, width: 150, height: 150, transform: `rotate(${recoil}deg)`, transformOrigin: "14px 136px" }}>
                  <Popper size={150} style={{ left: 0, top: 0 }} />
                </div>
                <div style={{ position: "absolute", left: pawL[0] * u - 136, top: pawL[1] * u - 136, width: 150, height: 150, transform: `rotate(${-recoil}deg)`, transformOrigin: "136px 136px" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 150, height: 150, transform: "scaleX(-1)" }}>
                    <Popper size={150} style={{ left: 0, top: 0 }} />
                  </div>
                </div>
              </Buddy>
          </div>
        ) : null}

        {/* popper confetti (in front) */}
        <Confetti t={partyT - BURST} x={PUP.x + pawR[0] * u + 70} y={PUP.y + pawR[1] * u - 96} n={34} dir={28} spread={60} power={50} drop={drop} opacity={confO} seed="popR" />
        <Confetti t={partyT - BURST} x={PUP.x + pawL[0] * u - 70} y={PUP.y + pawL[1] * u - 96} n={34} dir={-28} spread={60} power={50} drop={drop} opacity={confO} seed="popL" />
        {f < SPLIT + 10
          ? [
              { x: 150, y: 190, ph: 0 },
              { x: 960, y: 250, ph: 2 },
              { x: 930, y: 860, ph: 4 },
            ].map((s, i) => (
              <div key={i} style={{ opacity: confO }}>
                <Sparkle x={s.x} y={s.y} size={64} phase={s.ph} color={i === 1 ? C.yellow : GOLD} speed={frozen ? 0 : 0.2} />
              </div>
            ))
          : null}
      </AbsoluteFill>

      {/* freeze-frame flash */}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}

      {/* verdict stamp (a light veil pushes the panels back) */}
      {f >= STAMP_AT ? <AbsoluteFill style={{ background: C.cream, opacity: interpolate(f, [STAMP_AT, STAMP_AT + 6], [0, 0.4], clamp) }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 50, top: 892, display: "flex", justifyContent: "center" }}>
        <Stamp at={STAMP_AT} text="不算真正起效" color={C.red} size={100} rotate={-9} style={{ position: "relative" }} />
      </div>

      <Sfx name="pop" at={BURST} volume={0.45} />
      <Sfx name="sparkle" at={BURST + 4} volume={0.3} />
      <Sfx name="whoosh" at={SPLIT} volume={0.35} />
      <Sfx name="pop" at={rowAt[0]} volume={0.3} />
      <Sfx name="pop" at={rowAt[1]} volume={0.3} />
      <Sfx name="pop" at={rowAt[2]} volume={0.3} />
      <Sfx name="swish" at={TILT_AT} volume={0.3} />
      <Sfx name="click" at={flatAt[0]} volume={0.35} />
      <Sfx name="stamp" at={STAMP_AT} volume={0.5} />
    </AbsoluteFill>
  );
};

export default Reality;
