import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { clamp, Emoji, Sfx, useShake, useSpring } from "../components/kit";
import { idOfKind, talkingAt } from "../components/Mascots";
import { BurstRing, Buddy, CHECK_W, Checklist, GOLD, Lens, Sparkle } from "../components/ending/parts";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { useLineStarts, useScene, useWordTime } from "../timeline";

const INK = C.ink;

/** speech onsets (relative frames) that follow a pause of >= minGap frames inside line i */
const useOnsets = () => {
  const s = useScene();
  return (i: number, minGap = 3) => {
    const l = s.lines[i];
    if (!l) return [] as number[];
    const out: number[] = [];
    let quiet = 0;
    l.env.forEach((v, k) => {
      if (v < 0.05) quiet++;
      else {
        if (quiet >= minGap && k > 4) out.push(l.relStart + k);
        quiet = 0;
      }
    });
    return out;
  };
};

/* ---------------- bottle ---------------- */
const BW = 300;
const BH = 480;
const BOTTLE_TOP = 664;
const BOTTLE_X = [200, 540, 880];
const NECK_Y = BOTTLE_TOP + 92; // lens centre over the neck

const ITEMS = [
  { e: "💰", t: "预算" },
  { e: "🎯", t: "ROAS 目标" },
  { e: "⭐", t: "广告质量" },
];

const Bottle: React.FC<{ i: number; at: number; tagAt: number; focus: number; out: number }> = ({ i, at, tagAt, focus, out }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 11, stiffness: 190 });
  const st = useSpring(tagAt, { damping: 9, stiffness: 260 });
  const so = useSpring(out, { damping: 18, stiffness: 120 });
  if (f < at) return null;
  const it = ITEMS[i];
  const bob = Math.sin(f * 0.12 + i * 2) * 6;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.35);
  const tagged = f >= tagAt;
  const flip = tagged ? interpolate(f, [tagAt, tagAt + 6], [0, 1], clamp) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: BOTTLE_X[i] - BW / 2,
        top: BOTTLE_TOP,
        width: BW,
        height: BH,
        transformOrigin: "50% 100%",
        // exit: shrink + fade in place (stays above the caption, never crosses the incoming button's path)
        transform: `translate(${so * (i - 1) * 120}px, ${(1 - s) * 500 + so * 120}px) scale(${(1 + 0.05 * focus) * interpolate(so, [0, 1], [1, 0.6])}) rotate(${so * (i - 1) * 18}deg)`,
        opacity: Math.min(1, s * 2) * Math.max(0, 1 - 1.4 * so),
      }}
    >
      <svg width={BW} height={BH} style={{ position: "absolute", overflow: "visible" }}>
        {focus > 0 ? <ellipse cx={150} cy={96} rx={80} ry={96} fill={C.yellow} opacity={(0.25 + 0.3 * pulse) * focus} /> : null}
        <path
          d="M112 30 L112 150 C112 200 20 190 20 250 L20 420 Q20 460 60 460 L240 460 Q280 460 280 420 L280 250 C280 190 188 200 188 150 L188 30 Z"
          fill="rgba(170,210,255,0.38)"
          stroke={INK}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        {/* coins jammed in the neck */}
        <circle cx={136} cy={140} r={20} fill={C.yellow} stroke={INK} strokeWidth={5} />
        <circle cx={166} cy={128} r={18} fill={C.yellow} stroke={INK} strokeWidth={5} />
        <path d="M44 270 L44 410" stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        <path d="M128 48 L128 118" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.8} />
        <rect x={94} y={10} width={112} height={32} rx={11} fill="#CFE6FF" stroke={INK} strokeWidth={7} />
      </svg>
      {/* content: ? → emoji */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 262 + bob,
          display: "flex",
          justifyContent: "center",
          transform: `scaleX(${tagged ? flip : 1 - interpolate(f, [tagAt - 4, tagAt], [0, 1], clamp)})`,
        }}
      >
        {tagged ? (
          <Emoji e={it.e} size={104} />
        ) : (
          <span style={{ fontFamily: FONT.num, fontSize: 96, color: "#8FA6C4", lineHeight: 1.08 }}>?</span>
        )}
      </div>
      {/* label sticker */}
      {tagged ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 384,
            display: "flex",
            justifyContent: "center",
            transform: `scale(${interpolate(st, [0, 1], [2, 1])}) rotate(${interpolate(st, [0, 1], [-16, i === 1 ? 2 : -3])}deg)`,
            opacity: Math.min(1, st * 3),
          }}
        >
          <div
            style={{
              fontFamily: FONT.black,
              fontSize: 42,
              color: INK,
              background: C.paper,
              border: `5px solid ${INK}`,
              borderRadius: 16,
              boxShadow: `5px 5px 0 ${INK}`,
              padding: "0 16px",
              whiteSpace: "nowrap",
              lineHeight: 1.35,
            }}
          >
            {it.t}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ---------------- scene ---------------- */
const BTN = { size: 620, left: 540 - 310, top: 432 };
const BTN_S = BTN.size / 420;
const DOME_CY = BTN.top + 140.4 * BTN_S; // dome centre (pressed = 0)

const Summary: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();
  const onsets = useOnsets();

  // phase 0: checklist
  const tickAt = [4, 8, 12, 16];
  const SHRINK = at(0) + 20;
  // phase 1: bottles + magnifier
  const popAt = [at(1) + 2, at(1) + 8, at(1) + 14];
  const on = onsets(1).filter((x) => x > at(1) + 20);
  // the TTS runs 先找瓶颈 straight into 预算; the first pause precedes ROAS, the second 广告质量
  const roasOn = on[0] ?? wordAt(1, "ROAS");
  const t0 = roasOn - 18;
  const t1 = roasOn - 4;
  const t2 = (on[1] ?? wordAt(1, "广告质量")) - 4;
  const tagAt = [t0, t1, t2];
  const OUT = at(2) - 18;
  // phase 2: button + quote
  // the new label lands with the line-2 impact; the quote card follows right on 「再决定」 so the thesis holds longer
  const BTN_IN = at(2) - 16;
  const STRIKE = at(2) - 12;
  const SWAP = at(2) - 2;
  const QUOTE = at(2) + 2;

  // checklist: big → top-right
  const shrink = useSpring(SHRINK, { damping: 16, stiffness: 140 });
  const listIn = useSpring(1, { damping: 13, stiffness: 180 });
  const bigS = 1.08;
  const smallS = 0.68;
  const lx = interpolate(shrink, [0, 1], [600 - (CHECK_W * bigS) / 2, 1032 - CHECK_W * smallS]);
  const ly = interpolate(shrink, [0, 1], [492, 150]);
  const ls = interpolate(shrink, [0, 1], [bigS, smallS]) * interpolate(listIn, [0, 1], [0.6, 1]);

  // magnifier path
  const lensIn = useSpring(at(1) + 8, { damping: 13, stiffness: 150 });
  const lensX = interpolate(
    f,
    [at(1) + 8, t0 - 2, t1 - 8, t1 - 2, t2 - 10, t2 - 2, OUT - 2, OUT + 12],
    [70, BOTTLE_X[0], BOTTLE_X[0], BOTTLE_X[1], BOTTLE_X[1], BOTTLE_X[2], BOTTLE_X[2], 1180],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  const lensY = interpolate(f, [at(1) + 8, t0 - 2, OUT - 2, OUT + 12], [930, NECK_Y, NECK_Y, 700], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const hover = Math.sin(f * 0.3) * 6;
  const focusOf = (i: number) => {
    const a = tagAt[i] - 3;
    const b = i < 2 ? tagAt[i + 1] - 7 : OUT - 2;
    return interpolate(f, [a, a + 4, b, b + 4], [0, 1, 1, 0], clamp);
  };

  // button
  // pop in place (no rise): well damped so the dome overshoots < 6 % and never reaches the checklist card
  const btnS = useSpring(BTN_IN, { damping: 16, stiffness: 200 });
  const btnScale = interpolate(btnS, [0, 1], [0.3, 1]);
  const strikeP = interpolate(f, [STRIKE, STRIKE + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const oldOut = interpolate(f, [SWAP - 2, SWAP + 2], [1, 0], clamp);
  const newS = useSpring(SWAP, { damping: 9, stiffness: 230 });
  const swapBounce = useSpring(SWAP, { damping: 6, stiffness: 260 });
  const glow = f >= SWAP ? interpolate(f, [SWAP, SWAP + 8], [0, 1], clamp) * (0.75 + 0.25 * Math.sin(f * 0.25)) : 0;

  // quote
  const qS = useSpring(QUOTE, { damping: 12, stiffness: 230 });
  const shake = useShake(QUOTE + 2, 14, 16);
  const shakeY = useShake(QUOTE + 3, 12, 8);

  // 阿冲
  const talk = talkingAt(idOfKind("dog"), scene.start + f);
  const raise = interpolate(f, [at(0) - 3, at(0) + 5], [14, 165], clamp);
  const cheer = f >= QUOTE;
  const chongIn = useSpring(0, { damping: 12, stiffness: 170 });

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shakeY}px)` }}>
      {/* 阿冲 raises his paw */}
      <div style={{ position: "absolute", left: 66, top: 176 + (1 - chongIn) * 300 + (cheer ? -Math.abs(Math.sin((f - QUOTE) * 0.3)) * 18 : 0) }}>
        <Buddy
          kind="dog"
          size={186}
          talking={talk}
          mood={cheer ? "happy" : f >= SWAP ? "shock" : f >= at(1) ? "normal" : "normal"}
          armL={cheer ? 150 + Math.sin(f * 0.5) * 12 : 14}
          armR={cheer ? 150 - Math.sin(f * 0.5) * 12 : raise + (f < at(1) ? Math.sin(f * 0.6) * 8 : 0)}
          wag={Math.sin(f * 0.5) * 16}
        />
        {f >= at(0) && f < at(1) + 4 ? (
          <div
            style={{
              position: "absolute",
              left: 200,
              top: -6,
              fontFamily: FONT.num,
              fontSize: 80,
              color: GOLD,
              textShadow: `4px 4px 0 ${INK}`,
              transform: `rotate(${12 + Math.sin(f * 0.3) * 8}deg) scale(${interpolate(f, [at(0), at(0) + 6, at(1), at(1) + 4], [0, 1, 1, 0], clamp)})`,
            }}
          >
            ?
          </div>
        ) : null}
      </div>

      {/* swap shockwave (behind the checklist and the button) */}
      <BurstRing p={interpolate(f, [SWAP, SWAP + 16], [0, 1], clamp)} x={540} y={DOME_CY} r={210} color={C.yellow} n={12} />

      {/* checklist (all ✔) */}
      <div style={{ position: "absolute", left: lx, top: ly, transformOrigin: "0 0", transform: `scale(${ls}) rotate(${interpolate(shrink, [0, 1], [-2, 2])}deg)`, opacity: Math.min(1, listIn * 2) }}>
        <Checklist tickAt={tickAt} />
      </div>
      {f < SHRINK + 12
        ? [
            { x: 250, y: 560 },
            { x: 950, y: 620 },
            { x: 920, y: 1070 },
          ].map((p, i) => (
            <div key={i} style={{ opacity: interpolate(f, [SHRINK, SHRINK + 10], [1, 0], clamp) }}>
              <Sparkle x={p.x} y={p.y} size={60} phase={i * 2} color={i === 1 ? C.yellow : GOLD} />
            </div>
          ))
        : null}

      {/* bottles */}
      {[0, 1, 2].map((i) => (
        <Bottle key={i} i={i} at={popAt[i]} tagAt={tagAt[i]} focus={focusOf(i)} out={OUT + i * 2} />
      ))}

      {/* magnifier */}
      {f >= at(1) + 8 && f < OUT + 14 ? (
        <div
          style={{
            position: "absolute",
            left: lensX,
            top: lensY + hover,
            transform: `scale(${lensIn}) rotate(${Math.sin(f * 0.15) * 6}deg)`,
          }}
        >
          <Lens r={74} handle={120} deg={50} />
        </div>
      ) : null}

      {/* the red button, one last time */}
      {f >= BTN_IN ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 540 - 380,
              top: DOME_CY - 250,
              width: 760,
              height: 560,
              borderRadius: "50%",
              background: `radial-gradient(${GOLD}AA, ${GOLD}00 62%)`,
              opacity: glow,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: BTN.left,
              top: BTN.top,
              transform: `scale(${btnScale * (1 + 0.06 * Math.sin(Math.min(1, swapBounce) * Math.PI) * (f >= SWAP ? 1 : 0))})`,
              transformOrigin: "50% 100%",
              opacity: Math.min(1, btnS * 3),
            }}
          >
            <BudgetButton size={BTN.size} label="" />
            {/* old label, crossed out */}
            {oldOut > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: DOME_CY - BTN.top - 60,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scaleY(${oldOut})`,
                }}
              >
                <span
                  style={{
                    position: "relative",
                    fontFamily: FONT.display,
                    fontSize: 64 * BTN_S,
                    color: C.paper,
                    textShadow: `${3 * BTN_S}px ${3 * BTN_S}px 0 ${INK}`,
                    transform: "scaleY(0.78)",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  加预算
                  <svg width={260} height={60} style={{ position: "absolute", left: -20, top: 22, overflow: "visible" }}>
                    <path d="M4 40 L256 18" stroke={C.paper} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - strikeP} />
                    <path d="M4 40 L256 18" stroke={INK} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - strikeP} />
                  </svg>
                </span>
              </div>
            ) : null}
            {/* new two-line label */}
            {f >= SWAP ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: DOME_CY - BTN.top - 66,
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT.display,
                  fontSize: 50,
                  lineHeight: 1.04,
                  color: C.paper,
                  textShadow: `3px 3px 0 ${INK}`,
                  whiteSpace: "nowrap",
                  // never grows past 1.0 — the whole button carries the bounce (swapBounce)
                  transform: `scale(${Math.min(1, interpolate(newS, [0, 1], [0.2, 1]))}) scaleY(0.8)`,
                  opacity: Math.min(1, newS * 2),
                }}
              >
                <span>先找瓶颈，</span>
                <span>再决定加不加钱</span>
              </div>
            ) : null}
          </div>
          {f >= SWAP
            ? [
                { x: 190, y: 560, ph: 0 },
                { x: 900, y: 600, ph: 1.5 },
                { x: 150, y: 860, ph: 3 },
                { x: 940, y: 880, ph: 4.5 },
              ].map((p, i) => (
                <div key={i} style={{ transform: `scale(${newS})` }}>
                  <Sparkle x={p.x} y={p.y} size={58} phase={p.ph} color={i % 2 ? C.yellow : GOLD} />
                </div>
              ))
            : null}
        </>
      ) : null}

      {/* gold quote card */}
      {f >= QUOTE ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 962,
            width: 1000,
            height: 306,
            transformOrigin: "50% 50%",
            // slam stays inside x 0–1080 and above the caption (≤1.08 × 1000 px card)
            transform: `translateY(${interpolate(qS, [0, 1], [-40, 0])}px) scale(${interpolate(qS, [0, 1], [1.08, 1])}) rotate(${interpolate(qS, [0, 1], [-5, -1.5])}deg)`,
            opacity: Math.min(1, qS * 2.5),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, #F7C04A, ${GOLD} 55%, #D48E0A)`,
              border: `${BORDER}px solid ${INK}`,
              borderRadius: 36,
              boxShadow: SHADOW,
              overflow: "hidden",
            }}
          >
            {/* shine sweep */}
            <div
              style={{
                position: "absolute",
                top: -40,
                bottom: -40,
                width: 90,
                left: interpolate(f, [QUOTE + 8, QUOTE + 30], [-200, 1200], clamp),
                background: "rgba(255,255,255,0.45)",
                transform: "rotate(18deg)",
              }}
            />
          </div>
          <div style={{ position: "absolute", left: 30, top: -8, fontFamily: FONT.num, fontSize: 150, color: C.paper, textShadow: `5px 5px 0 ${INK}`, lineHeight: 1 }}>“</div>
          <div
            style={{
              position: "absolute",
              left: 70,
              right: 70,
              top: 30,
              fontFamily: FONT.display,
              fontSize: 102,
              lineHeight: 1.18,
              color: C.paper,
              textShadow: `5px 5px 0 ${INK}`,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ textAlign: "left", paddingLeft: 70 }}>先找瓶颈，</div>
            <div style={{ textAlign: "right", paddingRight: 44 }}>再决定加不加钱</div>
          </div>
          <div style={{ position: "absolute", right: 26, top: 176, fontFamily: FONT.num, fontSize: 150, color: C.paper, textShadow: `5px 5px 0 ${INK}`, lineHeight: 1 }}>”</div>
        </div>
      ) : null}
      {/* slam flash on the quote card */}
      {f >= QUOTE ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 962,
            width: 1000,
            height: 306,
            borderRadius: 36,
            background: "#fff",
            opacity: interpolate(f, [QUOTE + 1, QUOTE + 3, QUOTE + 10], [0, 0.75, 0], clamp),
            transform: "rotate(-1.5deg)",
          }}
        />
      ) : null}
      {f >= QUOTE + 4
        ? [
            { x: 70, y: 950, ph: 0.5 },
            { x: 1010, y: 1000, ph: 2 },
            { x: 1000, y: 1262, ph: 3.5 },
          ].map((p, i) => <Sparkle key={i} x={p.x} y={p.y} size={64} phase={p.ph} color={i === 1 ? C.paper : C.yellow} />)
        : null}

      <Sfx name="sparkle" at={5} volume={0.3} />
      <Sfx name="whoosh" at={SHRINK} volume={0.25} />
      <Sfx name="pop" at={popAt[0]} volume={0.3} />
      <Sfx name="pop" at={tagAt[0]} volume={0.28} />
      <Sfx name="pop" at={tagAt[1]} volume={0.28} />
      <Sfx name="pop" at={tagAt[2]} volume={0.28} />
      <Sfx name="whoosh" at={OUT} volume={0.25} />
      <Sfx name="stamp" at={QUOTE + 1} volume={0.4} />
      <Sfx name="sparkle" at={QUOTE + 10} volume={0.3} />
    </AbsoluteFill>
  );
};

export default Summary;
