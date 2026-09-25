import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChapterStamp, Tag } from "../components/Shared";
import { clamp, Emoji, Marker, Sfx, useFloat, useShake, useSpring } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { AntiSticker, Person } from "../components/step3/Props";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const PURPLE = CHAPTER_COLOR["第3步"] ?? C.purple;

// ── rig geometry ────────────────────────────────────────────────
const GROUND = 1210;
const yOf = (r: number) => GROUND - r; // ROAS % → y of the bar centre (illustrative scale)
const LP = 400; // left post centre x
const RP = 680; // right post centre x
const POST_W = 26;
const POST_TOP = 500;
const BAR_L = 382;
const BAR_R = 698;
const BAR_H = 44;
const LAND_X = 770;
const COL_L = 890;
const COL_R = 1010;
const COL_TOP = 568;

type Fig = { x: number; y: number; h: number; color: string; row: 0 | 1; i: number };
const FIGS: Fig[] = [
  ...[C.orange, C.blue, C.green, C.yellow, "#FF8FB1"].map((color, i) => ({ x: 352 - i * 62, y: GROUND, h: 100, color, row: 0 as const, i })),
  ...[C.purple, "#5CC8C8", C.blue, "#FF8FB1", C.green].map((color, i) => ({ x: 73 + i * 62, y: GROUND - 30, h: 100, color, row: 1 as const, i })),
];

const easeIO = Easing.inOut(Easing.cubic);
const JUMP_SC = 1.9; // the line-1 jumper is drawn ~1.9x so the 「差一截」 gag reads on a phone
const JUMP_FEET = GROUND - 490 + 100 * JUMP_SC; // feet at the apex so the (scaled) head tops out at the 490% line

export default function Step3Target() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { at, endAt, scene } = useLineStarts();
  const wordAt = useWordTime();

  // ── beats ──────────────────────────────────────────────────────
  const A0 = at(0);
  const STAMP = Math.max(4, A0 - 7); // badge lands on the line-0 drumhit instead of after it
  const SHRINK = A0 + 40; // right after the title finished typing
  const STICK = wordAt(0, "反而") + 1;
  const RIG = SHRINK + 8; // rig + queue rise during 「ROAS 目标定太高」
  const BLOCK = wordAt(0, "卡住") - 4; // front figure hops against the post
  const CASE = at(1) - 3;
  const TAG600 = wordAt(1, "600%") - 4;
  const JUMP = wordAt(1, "实际") - 8;
  const APEX = JUMP + 16;
  const RESET = at(2) - 6;
  const MORE = at(2) + 6;
  const CRANK0 = wordAt(2, "那再调高");
  const CRANK1 = endAt(2) - 2;
  const NO = at(3) + 1;
  const CAT = at(4) + 3;
  const SIGN = wordAt(4, "业务能持续") - 4;
  const TURN0 = at(4) + 14;
  const TURN1 = wordAt(4, "300%") - 2;
  const CAT_OUT = TURN1 + 4;
  const STREAM = TURN1 + 10;
  const COLUMN = Math.max(CAT_OUT + 14, at(5) - 16);
  const LAMP = at(5) - 4;
  const NOTE = at(6) - 3;
  const W1 = wordAt(6, "盈亏平衡点");
  const W2 = wordAt(6, "利润率");

  // ── bar height (ROAS %) over time ──────────────────────────────
  const R_MAX = 686; // cranked to the very top of the posts (illustrative)
  const clank = spring({ frame: f - NO, fps, config: { damping: 8, stiffness: 240 } });
  let r = 600;
  if (f >= CRANK0 && f < NO) r = interpolate(f, [CRANK0, CRANK1], [600, R_MAX], { ...clamp, easing: easeIO });
  if (f >= NO && f < TURN0) r = R_MAX - (R_MAX - 600) * clank;
  if (f >= TURN0) r = interpolate(f, [TURN0, TURN1], [600, 300], { ...clamp, easing: easeIO });
  const barY = yOf(r);
  // knocked bar (line 1): small damped wobble around the left peg, so it still reads as 600%
  const reset = spring({ frame: f - RESET, fps, config: { damping: 12, stiffness: 200 } });
  const kt = f - (APEX + 2);
  const tilt = kt >= 0 ? 11 * Math.exp(-kt * 0.06) * Math.sin(kt * 0.55) * (1 - reset) : 0;
  const barHop = kt >= 0 ? -Math.abs(Math.sin(kt * 0.55)) * 14 * Math.exp(-kt * 0.12) * (1 - reset) : 0;
  const cranking = f >= CRANK0 && f < CRANK1 + 2;
  const crankJitter = cranking ? Math.sin(f * 2.1) * 3 : 0;
  // bump on the post when the front figure hops into it (卡住)
  const blockHit = f >= BLOCK + 5 ? Math.exp(-(f - BLOCK - 5) * 0.35) * Math.sin((f - BLOCK - 5) * 2.2) : 0;

  // ── rig entrance ───────────────────────────────────────────────
  const rise = Math.min(1, useSpring(RIG, { damping: 13, stiffness: 150 }));
  const barDrop = useSpring(RIG + 8, { damping: 10, stiffness: 180 });
  const rigShake = useShake(APEX, 14, 10);
  const rigVisible = f >= RIG;

  // dial angle follows the bar
  const dialAng = (r - 450) * 0.55;

  // ── mascots at the knob ────────────────────────────────────────
  const dogIn = useSpring(RESET, { damping: 12, stiffness: 170 });
  const dogFall = interpolate(f, [NO + 4, NO + 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const catIn = useSpring(CAT, { damping: 12, stiffness: 170 });
  const catOut = interpolate(f, [CAT_OUT, CAT_OUT + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const dogTalk = talkingAt(idOfKind("dog"), scene.start + f);
  const catTalk = talkingAt(idOfKind("cat"), scene.start + f);
  const dogShown = f >= RESET && f < NO + 28;
  const catShown = f >= CAT && f < CAT_OUT + 12;
  const pawOnKnob = (dogShown && f < NO + 2) || (catShown && f >= TURN0 - 6 && f < CAT_OUT);

  // ── figure positions (serpentine queue: front row → right, back row ← left) ──
  const slotPos = (sl: number) => {
    const front = (q: number) => ({ x: 352 - q * 62, y: GROUND, z: 1 });
    const back = (q: number) => ({ x: 73 + (q - 5) * 62, y: GROUND - 30, z: 0.88 });
    if (sl <= 4) return front(Math.max(0, sl));
    if (sl >= 5) return back(sl);
    const a = front(4);
    const b = back(5);
    const t = sl - 4;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  };
  // the jumper grows to JUMP_SC for the jump and shrinks back once it has landed (dizzy)
  const jumpBig =
    interpolate(f, [JUMP - 12, JUMP - 4], [1, JUMP_SC], { ...clamp, easing: Easing.out(Easing.back(2)) }) *
    interpolate(f, [APEX + 18, APEX + 30], [1, 1 / JUMP_SC], { ...clamp, easing: easeIO });
  const figState = (fig: Fig, k: number) => {
    const appear = fig.row === 0 ? RIG + 14 + fig.i * 5 : MORE + fig.i * 7;
    // how far the queue has advanced for this figure
    let adv = 0;
    for (let j = 0; j < k; j++) adv += interpolate(f, [STREAM + j * 13 + 2, STREAM + j * 13 + 12], [0, 1], { ...clamp, easing: easeIO });
    const slot = k - adv;
    const P = slotPos(slot);
    const walking = adv % 1 > 0.02 && adv % 1 < 0.98;
    const bob = walking ? Math.abs(Math.sin(f * 0.9 + k)) * 12 : Math.abs(Math.sin((f + k * 17) * 0.16)) * (k === 0 && f < JUMP ? 14 : 5);
    let x = P.x;
    let y = P.y - bob;
    let rot = 0;
    const sc = spring({ frame: f - appear, fps, config: { damping: 11, stiffness: 200 } }) * P.z;
    const op = f >= appear ? 1 : 0;
    let face: "normal" | "sweat" | "happy" | "dizzy" = f >= MORE && f < STREAM ? "sweat" : "normal";
    // 「卡住」: the front figure hops into the left post and bounces back
    if (k === 0 && f >= BLOCK && f < BLOCK + 24) {
      const t = f - BLOCK;
      if (t < 4) return { x, y: GROUND, rot: 0, sc, sy: 1 - 0.05 * t, op, face: "normal" as const };
      if (t < 12) {
        const u = (t - 4) / 8;
        const hop = Math.sin(u * Math.PI);
        const back = u < 0.3 ? u / 0.3 * 6 : 6 - (u - 0.3) / 0.7 * 30;
        return { x: P.x + back, y: GROUND - 70 * hop, rot: u < 0.3 ? 8 : -14, sc, sy: 1, op, face: "dizzy" as const };
      }
      const u = (t - 12) / 12;
      return { x: P.x - 24 * (1 - u), y: GROUND, rot: -14 * (1 - u), sc, sy: 1 - 0.14 * Math.max(0, 1 - u * 3), op, face: "sweat" as const };
    }
    // line-1 jumper: the front (orange) figure grows to ~1.9x, jumps, its head only reaches 490%, bonks the post
    if (k === 0 && f >= JUMP - 12 && f < RESET + 4) {
      const big = jumpBig;
      const xs = P.x;
      if (f < JUMP) {
        const c = interpolate(f, [JUMP - 6, JUMP], [0, 1], clamp);
        return { x: xs, y: GROUND, rot: 0, sc: big, sy: 1 - 0.18 * c, op, face };
      }
      if (f < APEX) {
        const t = (f - JUMP) / (APEX - JUMP);
        const e = Easing.out(Easing.quad)(t);
        return { x: xs + 40 * t, y: GROUND - (GROUND - JUMP_FEET) * e, rot: 6 * t, sc: big, sy: 1 + 0.1 * (1 - t), op, face: "normal" as const };
      }
      if (f < APEX + 16) {
        const t = (f - APEX) / 16;
        return { x: xs + 40 - 56 * t, y: JUMP_FEET + (GROUND - JUMP_FEET) * Easing.in(Easing.quad)(t), rot: 6 - 40 * t, sc: big, sy: 1, op, face: "dizzy" as const };
      }
      const t = interpolate(f, [APEX + 16, APEX + 22], [0, 1], clamp);
      const back = interpolate(f, [RESET - 6, RESET + 4], [0, 1], clamp);
      return {
        x: xs - 16 * (1 - back),
        y: GROUND,
        rot: (-34 * (1 - t) - 8 * t) * (1 - back),
        sc: big,
        sy: 1 - 0.2 * (1 - t),
        op,
        face: f < RESET - 4 ? ("dizzy" as const) : ("sweat" as const),
      };
    }
    // stream over the lowered bar
    const st = STREAM + k * 13;
    if (f >= st) {
      const dur = 28;
      const x0 = slotPos(0).x;
      if (f < st + dur) {
        const t = (f - st) / dur;
        const e = easeIO(t);
        x = x0 + (LAND_X - x0) * e;
        y = GROUND - 420 * 4 * t * (1 - t);
        rot = 360 * easeIO(interpolate(t, [0.25, 0.8], [0, 1], clamp));
        face = "happy";
        return { x, y, rot, sc: 1, sy: 1, op, face };
      }
      const t2 = (f - st - dur) / 12;
      if (t2 < 1) {
        x = LAND_X + (COL_L + 30 - LAND_X) * t2;
        y = GROUND - 60 * 4 * t2 * (1 - t2);
        return { x, y, rot: 0, sc: 1 - 0.35 * t2, sy: 1 - 0.15 * Math.sin(Math.min(1, t2 * 4) * Math.PI), op: 1 - t2 * t2, face: "happy" as const };
      }
      return { x, y, rot, sc: 0, sy: 1, op: 0, face };
    }
    return { x, y, rot, sc, sy: 1, op, face };
  };

  const absorbed = FIGS.reduce((n, _, k) => n + (f >= STREAM + k * 13 + 40 ? 1 : 0), 0);

  // ── pieces ─────────────────────────────────────────────────────
  const post = (cx: number) => (
    <div
      style={{
        position: "absolute",
        left: cx - POST_W / 2 + (cranking ? Math.sin(f * 2.7 + cx) * 2.5 : 0) + (cx === LP ? blockHit * 3 : 0),
        top: POST_TOP,
        width: POST_W,
        height: GROUND - POST_TOP,
        background: `repeating-linear-gradient(180deg, ${C.paper} 0 34px, ${PURPLE} 34px 68px)`,
        border: `5px solid ${C.ink}`,
        borderRadius: 10,
        transformOrigin: "center bottom",
        transform: `scaleY(${rise})`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -22,
          width: 34,
          height: 34,
          marginLeft: -17,
          borderRadius: 17,
          background: C.yellow,
          border: `5px solid ${C.ink}`,
          boxSizing: "border-box",
        }}
      />
    </div>
  );

  // bar tag content by phase
  let tagPhase = -1;
  let tagLabel: React.ReactNode = null;
  let tagColor: string = PURPLE;
  if (f >= TAG600 && f < CRANK0) {
    tagPhase = TAG600;
    tagLabel = "600%";
  } else if (f >= CRANK0 && f < NO) {
    tagPhase = CRANK0;
    tagLabel = <Chevrons dir="up" color={C.red} f={f} />;
    tagColor = C.red;
  } else if (f >= NO && f < TURN0) {
    tagPhase = NO;
    tagLabel = "600%";
  } else if (f >= TURN0 && f < TURN1) {
    tagPhase = TURN0;
    tagLabel = <Chevrons dir="down" color={C.green} f={f} />;
    tagColor = C.green;
  } else if (f >= TURN1) {
    tagPhase = TURN1;
    tagLabel = "300%";
    tagColor = C.green;
  }
  const tagPunch = tagPhase >= 0 ? 1 + 0.22 * (1 - spring({ frame: f - tagPhase, fps, config: { damping: 9, stiffness: 220 } })) : 1;

  // big arrow (line 2 up → line 3 flips down)
  const arrowIn = useSpring(CRANK0 - 2, { damping: 10, stiffness: 200 });
  const flip = interpolate(f, [NO + 16, NO + 28], [0, 1], { ...clamp, easing: easeIO });
  const arrowOut = interpolate(f, [TURN1 + 2, TURN1 + 12], [1, 0], clamp);
  const arrowUp = flip < 0.5;
  const arrowPulse = 1 + 0.06 * Math.sin(f * 0.5);

  // ✗
  const xS = spring({ frame: f - NO, fps, config: { damping: 9, stiffness: 260 } });
  const xOut = interpolate(f, [NO + 12, NO + 20], [1, 0], clamp);

  const noteS = useSpring(NOTE, { damping: 11, stiffness: 220 });
  const dim = interpolate(f, [NOTE, NOTE + 8], [0, 0.55], clamp);

  // chapter-opener sunburst (same as the 01 / 02 openers), from frame 2 so the chapter never opens on an empty stage
  const rays = interpolate(f, [2, 10, SHRINK, SHRINK + 10], [0, 1, 1, 0], clamp);
  // label chips on the rig fade out completely under the 前提 note (no half-covered fragments)
  const noteHide = interpolate(f, [NOTE - 2, NOTE + 6], [1, 0], clamp);

  const floatA = useFloat(6, 0.09);
  const floatB = useFloat(5, 0.07, 1.7);

  // magnifier taps on the sticky note
  const lensX = interpolate(f, [NOTE + 6, W1 - 2, W2 - 6, W2 - 1], [900, 782, 782, 692], { ...clamp, easing: easeIO });
  const lensY = interpolate(f, [NOTE + 6, W1 - 2, W2 - 6, W2 - 1], [1040, 742, 742, 832], { ...clamp, easing: easeIO });
  const tap = (w: number) => (f >= w && f < w + 10 ? Math.sin(((f - w) / 10) * Math.PI) * 18 : 0);

  return (
    <AbsoluteFill>
      {/* ── chapter opener (compact header after shrink) ── */}
      {rays > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: 557 - 560,
            width: 1120,
            height: 1120,
            borderRadius: "50%",
            opacity: rays * 0.9,
            background: `repeating-conic-gradient(from ${f * 0.6}deg, ${C.purpleSoft} 0deg 9deg, transparent 9deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 30%, transparent 68%)",
          }}
        />
      ) : null}
      <Sfx name="whoosh" at={2} volume={0.2} />
      <AbsoluteFill
        style={{ transform: `scale(${interpolate(f, [SHRINK, SHRINK + 12], [1, 0.82], clamp)})`, transformOrigin: "540px 252px" }}
      >
        <ChapterStamp at={STAMP} num="03" title="ROAS 目标定太高" color={PURPLE} shrinkAt={SHRINK} top={252} />
      </AbsoluteFill>
      <Sfx name="stamp" at={STICK} volume={0.35} />

      {/* 🤯 反直觉 sticker flies back in */}
      {f >= STICK - 10 ? (
        (() => {
          const s = spring({ frame: f - (STICK - 10), fps, config: { damping: 10, stiffness: 150 } });
          const wob = Math.sin(f * 0.12) * 2;
          return (
            <div
              style={{
                position: "absolute",
                left: 652,
                top: 272,
                transform: `translate(${(1 - s) * 520}px, ${(1 - s) * -360}px) rotate(${8 + (1 - s) * 70 + wob}deg) scale(${interpolate(s, [0, 0.7, 1], [1.8, 1.08, 1])})`,
                transformOrigin: "center",
                opacity: Math.min(1, s * 3),
              }}
            >
              <AntiSticker />
            </div>
          );
        })()
      ) : null}

      {/* 案例 label */}
      {f >= CASE && f < CAT ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 300,
            transform: `rotate(-10deg) scale(${spring({ frame: f - CASE, fps, config: { damping: 9, stiffness: 190 } })})`,
            opacity: interpolate(f, [CAT - 8, CAT], [1, 0], clamp),
          }}
        >
          <Tag color={C.yellow} size={42} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
            案例
          </Tag>
        </div>
      ) : null}

      {/* ── high-jump rig ── */}
      {rigVisible ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${rigShake}px)` }}>
          {/* track */}
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              top: GROUND - 2,
              height: 30,
              background: PURPLE,
              border: `5px solid ${C.ink}`,
              borderRadius: 14,
              transform: `scaleX(${rise})`,
              opacity: 0.9,
            }}
          />
          {/* ruler ticks on the left post (illustrative, unlabeled) */}
          {[300, 350, 400, 450, 500, 550, 600, 650].map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: LP - POST_W / 2 - (t % 100 === 0 ? 26 : 16),
                top: yOf(t) - 2,
                width: t % 100 === 0 ? 22 : 12,
                height: 5,
                borderRadius: 3,
                background: C.ink,
                opacity: 0.55 * rise,
              }}
            />
          ))}

          {/* console with the knob (between the posts) */}
          <div
            style={{
              position: "absolute",
              left: 432,
              top: GROUND - 118,
              width: 216,
              height: 118,
              background: C.purpleSoft,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: "22px 22px 8px 8px",
              boxShadow: `6px 0 0 ${C.ink}`,
              transform: `scale(${springAt(f - (RIG + 4), fps)})`,
              transformOrigin: "center bottom",
              boxSizing: "border-box",
            }}
          >
            <span style={{ position: "absolute", left: 16, top: 26, fontFamily: FONT.num, fontSize: 40, color: C.ink }}>−</span>
            <span style={{ position: "absolute", right: 14, top: 26, fontFamily: FONT.num, fontSize: 40, color: C.ink }}>+</span>
            <svg width={112} height={112} viewBox="-56 -56 112 112" style={{ position: "absolute", left: 46, top: -2, overflow: "visible" }}>
              {Array.from({ length: 9 }, (_, i) => -120 + i * 30).map((a) => (
                <line
                  key={a}
                  x1={Math.sin((a * Math.PI) / 180) * 46}
                  y1={-Math.cos((a * Math.PI) / 180) * 46}
                  x2={Math.sin((a * Math.PI) / 180) * 54}
                  y2={-Math.cos((a * Math.PI) / 180) * 54}
                  stroke={C.ink}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              ))}
              <g transform={`rotate(${dialAng})`}>
                <circle r={40} fill={PURPLE} stroke={C.ink} strokeWidth={6} />
                <circle r={26} fill="#A993F5" stroke={C.ink} strokeWidth={3} />
                <rect x={-5} y={-40} width={10} height={30} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
              </g>
            </svg>
          </div>

          {/* mascot arm + paw on the knob (behind the posts) */}
          {pawOnKnob ? (
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              {(() => {
                const isDog = dogShown && f < NO + 2;
                const col = isDog ? "#F6C98B" : "#9FC3FF";
                const ang = (dialAng * Math.PI) / 180;
                const px = 540 + Math.cos(ang) * 30 + 22;
                const py = GROUND - 62 + Math.sin(ang) * 14;
                return (
                  <g>
                    <path d={`M ${760} ${GROUND - 70} Q ${680} ${GROUND - 40} ${px} ${py}`} stroke={C.ink} strokeWidth={34} fill="none" strokeLinecap="round" />
                    <path d={`M ${760} ${GROUND - 70} Q ${680} ${GROUND - 40} ${px} ${py}`} stroke={col} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <circle cx={px} cy={py} r={20} fill={col} stroke={C.ink} strokeWidth={5} />
                  </g>
                );
              })()}
            </svg>
          ) : null}

          {post(LP)}
          {post(RP)}

          {/* the bar */}
          <div
            style={{
              position: "absolute",
              left: BAR_L,
              top: barY - BAR_H / 2 + crankJitter - (1 - barDrop) * 260 + barHop,
              width: BAR_R - BAR_L,
              height: BAR_H,
              opacity: Math.min(1, barDrop * 2),
              transformOrigin: `${LP - BAR_L}px 50%`,
              transform: `rotate(${tilt}deg)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(135deg, ${PURPLE} 0 26px, ${C.paper} 26px 52px)`,
                border: `5px solid ${C.ink}`,
                borderRadius: 12,
                boxShadow: `5px 5px 0 ${C.ink}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                background: C.paper,
                border: `4px solid ${C.ink}`,
                borderRadius: 12,
                padding: "0 14px",
                fontFamily: FONT.black,
                fontSize: 34,
                lineHeight: "44px",
                whiteSpace: "nowrap",
                color: C.ink,
              }}
            >
              目标 ROAS
            </div>
          </div>

        </div>
      ) : null}

      {/* 量 column (fills as figures jump over) */}
      {f >= COLUMN ? (
        <div
          style={{
            position: "absolute",
            left: COL_L,
            top: COL_TOP,
            width: COL_R - COL_L,
            height: GROUND - COL_TOP,
            transform: `scaleY(${springAt(f - COLUMN, fps)})`,
            transformOrigin: "center bottom",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.75)",
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 24,
              boxShadow: SHADOW,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 10 }, (_, b) => {
              const shown = b < absorbed;
              const s = shown ? spring({ frame: f - (STREAM + b * 13 + 40), fps, config: { damping: 10, stiffness: 220 } }) : 0;
              const bh = (GROUND - COL_TOP - 12 - 11 * 5) / 10;
              return (
                <div
                  key={b}
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    bottom: 5 + b * (bh + 5),
                    height: bh,
                    borderRadius: 10,
                    background: b % 2 ? "#4FC06E" : C.green,
                    border: `3px solid ${C.ink}`,
                    transform: `scale(${s})`,
                    opacity: s > 0.01 ? 1 : 0,
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -74,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: FONT.display,
              fontSize: 60,
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            量
            <svg width={40} height={58} viewBox="0 0 170 250" style={{ overflow: "visible", transform: `translateY(${-Math.abs(Math.sin(f * 0.25)) * 8}px)` }}>
              <path d="M85 8 L162 100 L118 100 L118 240 L52 240 L52 100 L8 100 Z" fill={C.green} stroke={C.ink} strokeWidth={20} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : null}

      {/* 盈利 ✅ lamp */}
      {f >= LAMP ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 508,
            transform: `scale(${springAt(f - LAMP, fps)})`,
            transformOrigin: "left center",
            opacity: noteHide,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: C.paper,
            border: `${BORDER}px solid ${C.ink}`,
            borderRadius: 26,
            padding: "12px 24px 12px 14px",
            boxShadow: SHADOW,
          }}
        >
          <div style={{ position: "relative", width: 84, height: 84 }}>
            <div
              style={{
                position: "absolute",
                inset: -18,
                borderRadius: "50%",
                background: `radial-gradient(${C.green}AA, transparent 68%)`,
                opacity: 0.6 + 0.4 * Math.sin(f * 0.3),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #B8F5C8, ${C.green} 60%)`,
                border: `5px solid ${C.ink}`,
              }}
            />
          </div>
          <span style={{ fontFamily: FONT.black, fontSize: 50, color: C.ink, whiteSpace: "nowrap" }}>盈利</span>
          <Emoji e="✅" size={50} />
        </div>
      ) : null}

      {/* big arrow: ↑ (wrong way) → ✗ → ↓ */}
      {f >= CRANK0 - 2 && f < TURN1 + 12 ? (
        <div
          style={{
            position: "absolute",
            left: 770,
            top: 560,
            width: 170,
            height: 250,
            transform: `scale(${arrowIn * arrowOut * arrowPulse}) scaleY(${Math.abs(Math.cos(flip * Math.PI))}) ${arrowUp ? "" : "rotate(180deg)"}`,
            transformOrigin: "center",
          }}
        >
          <svg viewBox="0 0 170 250" width={170} height={250} style={{ overflow: "visible" }}>
            <path
              d="M85 8 L162 100 L118 100 L118 240 L52 240 L52 100 L8 100 Z"
              fill={arrowUp ? C.red : C.green}
              stroke={C.ink}
              strokeWidth={8}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
      {f >= NO && f < NO + 21 ? (
        <div
          style={{
            position: "absolute",
            left: 855 - 150,
            top: 685 - 150,
            width: 300,
            height: 300,
            transform: `scale(${interpolate(xS, [0, 1], [2.2, 1]) * xOut}) rotate(${(1 - xS) * -30}deg)`,
            opacity: Math.min(1, xS * 2),
          }}
        >
          <svg viewBox="0 0 300 300" width={300} height={300}>
            {[45, -45].map((a) => (
              <g key={a} transform={`rotate(${a} 150 150)`}>
                <rect x={20} y={118} width={260} height={64} rx={32} fill={C.ink} transform="translate(8 8)" />
                <rect x={20} y={118} width={260} height={64} rx={32} fill={C.red} stroke={C.ink} strokeWidth={7} />
              </g>
            ))}
          </svg>
        </div>
      ) : null}

      {/* 阿冲 cranks the knob up */}
      {dogShown ? (
        <div
          style={{
            position: "absolute",
            left: 720,
            top: GROUND - 214,
            transform: `translateY(${(1 - dogIn) * 240 + dogFall * 120}px) rotate(${dogFall * 24 + (f < NO ? Math.sin(f * 0.9) * 3 : 0)}deg)`,
            opacity: 1 - dogFall,
            transformOrigin: "center bottom",
          }}
        >
          <MascotFace kind="dog" size={214} mood={f >= NO ? "dizzy" : "money"} talking={dogTalk} />
        </div>
      ) : null}
      {/* 欧姐 turns it down to 300% */}
      {catShown ? (
        <div
          style={{
            position: "absolute",
            left: 722,
            top: GROUND - 212,
            transform: `translateY(${(1 - catIn) * 240 + catOut * 240}px)`,
            opacity: 1 - catOut,
          }}
        >
          <MascotFace
            kind="cat"
            size={210}
            mood={f >= TURN1 ? "smug" : "normal"}
            talking={catTalk}
            glint={interpolate(f, [TURN1, TURN1 + 14], [0, 1], clamp)}
          />
        </div>
      ) : null}

      {/* traffic figures */}
      {rigVisible
        ? [...FIGS.keys()]
            .sort((a, b) => FIGS[b].row - FIGS[a].row)
            .map((k) => {
              const fig = FIGS[k];
              const s = figState(fig, k);
              if (s.op <= 0 || s.sc <= 0.001) return null;
              const w = fig.h * 0.6;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: s.x - w / 2,
                    top: s.y - fig.h,
                    width: w,
                    height: fig.h,
                    transform: `rotate(${s.rot}deg) scale(${s.sc}) scaleY(${s.sy})`,
                    transformOrigin: s.rot !== 0 && f >= STREAM ? "50% 50%" : "50% 100%",
                    opacity: s.op,
                    filter: fig.row === 1 && f < STREAM ? "brightness(0.9)" : undefined,
                  }}
                >
                  <Person color={fig.color} h={fig.h} face={s.face} star={k === 0} />
                </div>
              );
            })
        : null}

      {/* labels drawn above the figures */}
      {rigVisible ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${rigShake}px)` }}>
          {/* green dashed destination line (300%) + sign */}
          {f >= SIGN ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: BAR_L - 6,
                  width: (BAR_R - BAR_L + 12) * interpolate(f, [SIGN, SIGN + 12], [0, 1], clamp),
                  top: yOf(300) - 3,
                  height: 0,
                  borderTop: `7px dashed ${C.green}`,
                  opacity: f < TURN1 + 4 ? 1 : interpolate(f, [TURN1 + 4, TURN1 + 12], [1, 0], clamp),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 1080 - (LP - POST_W / 2 - 14),
                  top: yOf(300) + 42,
                  transform: `scale(${springAt(f - SIGN, fps)}) rotate(-2deg)`,
                  transformOrigin: "right center",
                  opacity: noteHide,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.black,
                    fontSize: 36,
                    color: C.paper,
                    background: C.green,
                    border: `5px solid ${C.ink}`,
                    borderRadius: 16,
                    padding: "4px 16px",
                    boxShadow: `5px 5px 0 ${C.ink}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  业务能持续的水平
                </div>
              </div>
            </>
          ) : null}

          {/* 490% line + gap marker (line 1) */}
          {f >= APEX - 1 && f < RESET + 6 ? (
            (() => {
              const o = interpolate(f, [RESET - 4, RESET + 6], [1, 0], clamp);
              const w = interpolate(f, [APEX - 1, APEX + 8], [0, 1], clamp);
              const gapS = springAt(f - (APEX + 6), fps);
              return (
                <div style={{ position: "absolute", inset: 0, opacity: o }}>
                  <div
                    style={{
                      position: "absolute",
                      left: BAR_L - 10,
                      top: yOf(490) - 3,
                      width: (RP + 30 - BAR_L) * w,
                      borderTop: `7px dashed ${C.red}`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: RP + 34,
                      top: yOf(490) - 40,
                      transform: `scale(${springAt(f - APEX, fps)})`,
                      transformOrigin: "left center",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      background: C.paper,
                      border: `5px solid ${C.ink}`,
                      borderRadius: 18,
                      padding: "2px 18px",
                      boxShadow: `6px 6px 0 ${C.ink}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontFamily: FONT.black, fontSize: 38, color: C.ink }}>实际</span>
                    <span style={{ fontFamily: FONT.num, fontSize: 56, color: C.red }}>490%</span>
                  </div>
                  {/* gap: 490 → 600 */}
                  <svg
                    width={60}
                    height={yOf(490) - yOf(600) - 26}
                    style={{ position: "absolute", left: LP + 24, top: yOf(600) + 24, overflow: "visible", opacity: gapS }}
                  >
                    <path
                      d={`M30 8 L30 ${yOf(490) - yOf(600) - 34}`}
                      stroke={C.red}
                      strokeWidth={7}
                      strokeLinecap="round"
                    />
                    <path d="M16 20 L30 4 L44 20" fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      d={`M16 ${yOf(490) - yOf(600) - 46} L30 ${yOf(490) - yOf(600) - 30} L44 ${yOf(490) - yOf(600) - 46}`}
                      fill="none"
                      stroke={C.red}
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      right: 1080 - (LP - POST_W / 2 - 44),
                      top: yOf(600) + 58,
                      fontFamily: FONT.black,
                      fontSize: 40,
                      lineHeight: "52px",
                      color: C.red,
                      background: C.paper,
                      border: `5px solid ${C.ink}`,
                      borderRadius: 18,
                      padding: "0 18px",
                      boxShadow: `6px 6px 0 ${C.ink}`,
                      opacity: Math.min(1, gapS * 2),
                      transform: `scale(${0.6 + 0.4 * gapS}) rotate(-3deg)`,
                      transformOrigin: "right center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    差一截
                  </div>
                </div>
              );
            })()
          ) : null}

          {/* value tag on the left end of the bar */}
          {tagPhase >= 0 ? (
            <div
              style={{
                position: "absolute",
                right: 1080 - (LP - POST_W / 2 - 12),
                top: barY - 36 + crankJitter,
                height: 72,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.paper,
                border: `5px solid ${C.ink}`,
                borderRadius: 18,
                padding: "0 18px",
                boxShadow: `6px 6px 0 ${C.ink}`,
                transform: `scale(${tagPunch})`,
                transformOrigin: "right center",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                opacity: noteHide,
              }}
            >
              <span style={{ fontFamily: FONT.black, fontSize: 36, color: C.ink }}>目标</span>
              {typeof tagLabel === "string" ? (
                <span style={{ fontFamily: FONT.num, fontSize: 52, color: tagColor }}>{tagLabel}</span>
              ) : (
                tagLabel
              )}
              {tagLabel === "300%" ? (
                <span
                  style={{
                    position: "absolute",
                    left: -30,
                    top: -44,
                    fontFamily: FONT.black,
                    fontSize: 34,
                    color: C.ink,
                    background: C.yellow,
                    border: `4px solid ${C.ink}`,
                    borderRadius: 12,
                    padding: "0 10px",
                    transform: "rotate(-10deg)",
                    lineHeight: 1.3,
                  }}
                >
                  示例
                </span>
              ) : null}
            </div>
          ) : null}

          {/* 流量 label over the queue */}
          {f >= RIG + 30 && f < SIGN ? (
            <div
              style={{
                position: "absolute",
                left: 118,
                top: GROUND - 196 + floatB * 0.6,
                transform: `scale(${springAt(f - (RIG + 30), fps)})`,
                opacity: interpolate(f, [SIGN - 8, SIGN], [1, 0], clamp),
              }}
            >
              <Tag color={C.blueSoft} size={36} style={{ borderRadius: 14 }}>
                👥 流量
              </Tag>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 💢 blocked at the post (卡住) */}
      {f >= BLOCK + 5 && f < BLOCK + 30 ? (
        <div
          style={{
            position: "absolute",
            left: 318,
            top: GROUND - 196,
            transform: `scale(${interpolate(f, [BLOCK + 5, BLOCK + 9, BLOCK + 13], [0.3, 1.25, 1], clamp) * (1 + 0.08 * Math.sin(f * 0.9))}) rotate(-10deg)`,
            opacity: interpolate(f, [BLOCK + 24, BLOCK + 30], [1, 0], clamp),
          }}
        >
          <Emoji e="💢" size={70} />
        </div>
      ) : null}

      {/* 💥 bonk on the post */}
      {f >= APEX && f < APEX + 12 ? (
        <div
          style={{
            position: "absolute",
            left: LP + 14 - 90,
            top: yOf(490) + 40 - 90,
            transform: `scale(${interpolate(f, [APEX, APEX + 4, APEX + 12], [0.3, 1.25, 0.95], clamp)}) rotate(${interpolate(f, [APEX, APEX + 12], [-12, 8], clamp)}deg)`,
            opacity: interpolate(f, [APEX + 7, APEX + 12], [1, 0], clamp),
          }}
        >
          <Emoji e="💥" size={180} />
        </div>
      ) : null}
      {f >= APEX + 16 && f < RESET - 2 ? (
        <div style={{ position: "absolute", left: 300 + Math.sin(f * 0.3) * 22, top: GROUND - 160 - 100 * (jumpBig - 1) + Math.cos(f * 0.3) * 8 }}>
          <Emoji e="💫" size={66} />
        </div>
      ) : null}
      <Sfx name="impact" at={APEX} volume={0.35} />
      <Sfx name="pop" at={TAG600} volume={0.3} />
      <Sfx name="click" at={CRANK0 + 4} volume={0.35} />
      <Sfx name="click" at={CRANK0 + 20} volume={0.35} />
      <Sfx name="ding" at={TURN1} volume={0.3} />
      <Sfx name="pop" at={NOTE} volume={0.4} />

      {/* sticky note: 前提 */}
      {f >= NOTE ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 470, height: 830, background: `linear-gradient(180deg, ${C.cream}00 0%, ${C.cream} 9%, ${C.cream} 88%, ${C.cream}00 100%)`, opacity: dim }} />
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 600 + floatA * 0.4,
              width: 800,
              transform: `rotate(${-3 + (1 - noteS) * 12}deg) scale(${interpolate(noteS, [0, 1], [1.7, 1])})`,
              opacity: Math.min(1, noteS * 2.5),
            }}
          >
            <div
              style={{
                background: "#FFE45C",
                border: `${BORDER}px solid ${C.ink}`,
                borderRadius: 8,
                boxShadow: `14px 14px 0 ${C.ink}`,
                padding: "46px 40px 44px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  left: "50%",
                  width: 220,
                  height: 56,
                  marginLeft: -110,
                  background: "rgba(255,255,255,0.65)",
                  border: `3px solid ${C.ink}33`,
                  transform: "rotate(2deg)",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Emoji e="🧮" size={64} />
                <span style={{ fontFamily: FONT.display, fontSize: 76, color: C.ink }}>前提</span>
              </div>
              <div style={{ fontFamily: FONT.black, fontSize: 64, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.3 }}>
                清楚 <Marker at={W1 - 2} color={C.paper}>盈亏平衡点</Marker>
              </div>
              <div style={{ fontFamily: FONT.black, fontSize: 64, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.3 }}>
                和 <Marker at={W2 - 2} color={C.paper}>利润率</Marker>
              </div>
            </div>
          </div>
          {/* 🔍 taps */}
          <div
            style={{
              position: "absolute",
              left: lensX,
              top: lensY - tap(W1) - tap(W2),
              transform: `rotate(-12deg) scale(${springAt(f - (NOTE + 6), fps)})`,
            }}
          >
            <Emoji e="🔍" size={120} />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
}

/** three bold chevrons (↑↑↑ / ↓↓↓) drawn as SVG so they read big on a phone */
const Chevrons: React.FC<{ dir: "up" | "down"; color: string; f: number }> = ({ dir, color, f }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 0, height: 52 }}>
    {[0, 1, 2].map((i) => {
      const bob = Math.abs(Math.sin(f * 0.45 - i * 0.9)) * 6 * (dir === "up" ? -1 : 1);
      return (
        <svg
          key={i}
          width={44}
          height={42}
          viewBox="0 0 44 42"
          style={{ overflow: "visible", transform: `translateY(${bob}px) ${dir === "down" ? "rotate(180deg)" : ""}` }}
        >
          <path d="M3 30 L22 6 L41 30 L32 39 L22 26 L12 39 Z" fill={color} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
        </svg>
      );
    })}
  </span>
);

/** plain spring value (0→1) for a relative frame, usable inside loops/conditionals */
function springAt(rel: number, fps: number) {
  return spring({ frame: rel, fps, config: { damping: 12, stiffness: 190 } });
}
