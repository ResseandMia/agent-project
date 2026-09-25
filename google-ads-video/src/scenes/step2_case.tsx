import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { clamp, Counter, Emoji, Sfx, useFloat } from "../components/kit";
import { Tag } from "../components/Shared";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { StruckTag, punch, sp } from "../components/step2/props";

const ORANGE = CHAPTER_COLOR["第2步"];
const GREY = "#BDBDC7";

// gauge card
const G = { l: 60, w: 960, h: 372, top0: 452, top1: 252 }; // settles at scale 1 → same x 60–1020 as the donut card
const BAR = { l: 44, t: 162, w: 860, h: 92 };
// donut card
const D = { l: 60, t: 648, w: 960, h: 636 };
const CX = 300; // donut centre (absolute)
const CY = 958;
const RM = 158; // mid radius
const SW = 76; // ring thickness (inner hole radius ≈ 117)
const CIRC = 2 * Math.PI * RM;

const Step2Case: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");

  // ---------------- timing ----------------
  const T175 = w(0, "175") - 4;
  const FILL0 = T175 + 10;
  const STOP = w(0, "只花掉") + 8;
  const BAND = w(0, "30%") - 4;
  const MOVE = at(1) - 12;
  const DONUT = at(1) - 4;
  const RING = DONUT + 6;
  const BLUE0 = w(1, "只有") - 6;
  const BLUE1 = w(1, "20%") + 2;
  const LEG1 = BLUE1 - 2;
  const LEG2 = LEG1 + 10;
  const RED0 = at(2) + 1;
  const RED1 = w(2, "80%") + 2;
  const V80 = w(2, "80%") - 2;
  const WHY = w(2, "广告评级") - 4;
  const DOG_IN = WHY + 6;
  const CROSS = w(2, "不是预算") - 6;
  const NOTE = CROSS + 5;
  const TURN = CROSS + 2;

  // ---------------- gauge ----------------
  const up = sp(f, MOVE, { damping: 15, stiffness: 120 });
  const gTop = G.top0 + (G.top1 - G.top0) * up;
  const gIn = sp(f, 2, { damping: 14 });
  const fillBase = interpolate(f, [FILL0, STOP], [0, 0.355], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sputter = f > STOP ? Math.sin((f - STOP) * 0.55) * 0.028 * Math.exp(-(f - STOP) / 40) + Math.sin(f * 0.21) * 0.006 : 0;
  const fill = Math.max(0, fillBase + sputter);
  const bandP = sp(f, BAND, { damping: 10, stiffness: 220 });
  const bandBlink = f >= BAND ? 0.55 + 0.45 * Math.abs(Math.sin((f - BAND) * 0.16)) : 0;
  const bandX0 = BAR.l + 0.3 * BAR.w;
  const bandX1 = BAR.l + 0.4 * BAR.w;

  // ---------------- donut ----------------
  const dIn = sp(f, DONUT, { damping: 15, stiffness: 120 });
  const ringP = interpolate(f, [RING, RING + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blueP = interpolate(f, [BLUE0, BLUE1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const redP = interpolate(f, [RED0, RED1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const redPulse = f > RED1 ? Math.sin((f - RED1) * 0.22) * 3 : 0;
  const lossCol = interpolateColors(redP, [0, 1], [GREY, C.red]);
  const centerRed = f >= V80;

  // dog
  const dogTalk = talkingAt(dogId, scene.start + f);
  const dIn2 = sp(f, DOG_IN, { damping: 11 });
  const turn = interpolate(f, [TURN, TURN + 5], [-1, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  const floatA = useFloat(5, 0.1);
  const floatB = useFloat(4, 0.08, 1.7);

  // line 0: eager 阿冲 under the gauge, staring at the stalled fill; drops out when the donut arrives
  const pupIn = sp(f, 12, { damping: 12 });
  const pupOut = interpolate(f, [MOVE, MOVE + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const stalled = f >= STOP;
  const bagBounce = stalled ? Math.sin(f * 0.1) * 3 : -Math.abs(Math.sin(f * 0.32)) * 20;
  const qPop = sp(f, STOP + 6, { damping: 8, stiffness: 220 });

  const sepLine = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const r0 = RM - SW / 2;
    const r1 = RM + SW / 2;
    return `M${CX + r0 * Math.cos(a)} ${CY + r0 * Math.sin(a)} L${CX + r1 * Math.cos(a)} ${CY + r1 * Math.sin(a)}`;
  };

  return (
    <AbsoluteFill>
      {/* ================= daily budget gauge ================= */}
      <div
        style={{
          position: "absolute",
          left: G.l,
          top: gTop,
          width: G.w,
          height: G.h,
          background: C.paper,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 32,
          boxShadow: SHADOW,
          boxSizing: "border-box",
          transform: `translateY(${(1 - gIn) * 400}px) rotate(${(1 - gIn) * -4}deg) scale(${1.04 - 0.04 * up})`,
          transformOrigin: "50% 0%",
          opacity: Math.min(1, gIn * 2),
        }}
      >
        {/* title row */}
        <div style={{ position: "absolute", left: 40, top: 28, display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
          <Emoji e="⛽" size={78} />
          <span style={{ fontFamily: FONT.display, fontSize: 74, color: C.ink, lineHeight: 1 }}>日预算</span>
          <Counter
            to={175}
            at={T175 - 18}
            dur={22}
            prefix="$"
            style={{
              fontSize: 92,
              color: ORANGE,
              lineHeight: 1,
              textShadow: `4px 4px 0 ${C.ink}`,
              display: "inline-block",
              transform: `scale(${punch(f, T175 + 4, 0.16, 5)})`,
              transformOrigin: "left center",
            }}
          />
        </div>

        {/* bar */}
        <div
          style={{
            position: "absolute",
            left: BAR.l,
            top: BAR.t,
            width: BAR.w,
            height: BAR.h,
            borderRadius: 28,
            border: `${BORDER}px solid ${C.ink}`,
            boxSizing: "border-box",
            overflow: "hidden",
            background: `repeating-linear-gradient(-45deg, #EFEFF3 0 16px, #E2E2E8 16px 32px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${fill * 100}%`,
              background: `linear-gradient(180deg, #FFB14D, ${ORANGE} 55%, #E07A00)`,
              borderRight: fill > 0.005 ? `${BORDER}px solid ${C.ink}` : undefined,
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", left: 10, right: 10, top: 12, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.55)" }} />
          </div>
          {/* ticks */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i + 1) * 10}%`, bottom: 0, width: 4, height: i === 4 ? 30 : 18, background: C.ink, opacity: 0.35 }} />
          ))}
          {/* 花不出去 in the unspent part */}
          {f >= STOP + 10 ? (
            <div
              style={{
                position: "absolute",
                left: "45%",
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: interpolate(f, [STOP + 10, STOP + 20], [0, 1], clamp),
              }}
            >
              <Emoji e="💤" size={44} style={{ transform: `translateY(${Math.sin(f * 0.15) * 4}px)` }} />
              <span style={{ fontFamily: FONT.black, fontSize: 40, color: "#8A8A96" }}>花不出去</span>
            </div>
          ) : null}
        </div>

        {/* 30–40% band */}
        {f >= BAND ? (
          <>
            <div
              style={{
                position: "absolute",
                left: bandX0,
                top: BAR.t - 12,
                width: bandX1 - bandX0,
                height: BAR.h + 24,
                borderRadius: 14,
                border: `5px dashed ${C.ink}`,
                background: `rgba(251,188,5,${0.45 * bandBlink})`,
                boxSizing: "border-box",
                transform: `scale(${interpolate(bandP, [0, 1], [1.6, 1])})`,
                opacity: Math.min(1, bandP * 2),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (bandX0 + bandX1) / 2,
                top: BAR.t + BAR.h + 22,
                transform: `translateX(-50%) scale(${bandP})`,
                transformOrigin: "50% 0%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                whiteSpace: "nowrap",
                background: C.yellow,
                border: `5px solid ${C.ink}`,
                borderRadius: 18,
                padding: "2px 18px",
                boxShadow: `5px 5px 0 ${C.ink}`,
              }}
            >
              <span style={{ fontFamily: FONT.black, fontSize: 40, color: C.ink }}>只花掉</span>
              <span style={{ fontFamily: FONT.num, fontSize: 50, color: C.ink }}>30%–40%</span>
              {/* pointer */}
              <svg width={36} height={22} style={{ position: "absolute", left: "50%", top: -22, marginLeft: -18, overflow: "visible" }}>
                <path d="M0 22 L18 2 L36 22" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              </svg>
            </div>
          </>
        ) : null}

        {/* smoke puffs from the stalled fill */}
        {f >= STOP
          ? [0, 1, 2].map((i) => {
              const t = (f - STOP + i * 14) % 42;
              const x = BAR.l + fill * BAR.w + 4 + Math.sin((t + i * 5) * 0.2) * 8 + t * 1.6;
              const y = BAR.t - 2 - t * 0.5;
              const r = 9 + t * 0.25;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: x - r,
                    top: y - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: "50%",
                    background: "#C9C9D1",
                    border: `3px solid #8A8A96`,
                    opacity: interpolate(t, [0, 5, 30, 42], [0, 0.85, 0.5, 0]),
                  }}
                />
              );
            })
          : null}

        {/* 案例 sticker */}
        <div style={{ position: "absolute", right: 30, top: 36, transform: `rotate(6deg) scale(${sp(f, 8, { damping: 9 })})` }}>
          <Tag color={C.yellow} size={42} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
            案例
          </Tag>
        </div>
      </div>

      {/* ================= line 0: 阿冲 waiting for the budget to be spent ================= */}
      {f >= 12 && pupOut < 1 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - pupIn) * 420 + pupOut * 420}px)`, opacity: 1 - pupOut }}>
          <div style={{ position: "absolute", left: 360, top: 912 + (stalled ? 0 : Math.sin(f * 0.25) * 5), transform: `rotate(${stalled ? 5 : -7}deg)` }}>
            <MascotFace kind="dog" size={220} mood={stalled ? "sweat" : "money"} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 612,
              top: 1010 + bagBounce,
              transform: `rotate(${stalled ? 14 : -6 + Math.sin(f * 0.32) * 6}deg) scale(${stalled ? 0.94 : 1})`,
              transformOrigin: "50% 100%",
            }}
          >
            <Emoji e="💰" size={124} />
          </div>
          {stalled ? (
            <div
              style={{
                position: "absolute",
                left: 296,
                top: 866,
                fontFamily: FONT.display,
                fontSize: 124,
                color: ORANGE,
                textShadow: `4px 4px 0 ${C.ink}`,
                transform: `scale(${qPop}) rotate(${-12 + Math.sin(f * 0.15) * 6}deg)`,
              }}
            >
              ?
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ================= impression share donut ================= */}
      {f >= DONUT ? (
        // short rise + scale-pop about the card centre: its bottom edge stays above y≈1290 (caption zone) throughout
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${(1 - dIn) * 80}px) scale(${0.7 + 0.3 * dIn})`,
            transformOrigin: `540px ${D.t + D.h / 2}px`,
            opacity: Math.min(1, dIn * 2),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: D.l,
              top: D.t,
              width: D.w,
              height: D.h,
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 32,
              boxShadow: SHADOW,
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", left: 36, top: 22, display: "flex", alignItems: "center", gap: 12 }}>
              <Emoji e="🔍" size={58} />
              <span style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink, lineHeight: 1.1, whiteSpace: "nowrap" }}>搜索展示份额</span>
            </div>
          </div>

          {/* ring */}
          <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g opacity={ringP}>
              <circle cx={CX} cy={CY} r={RM + SW / 2 + 3} fill="none" stroke={C.ink} strokeWidth={BORDER} />
              <circle cx={CX} cy={CY} r={RM - SW / 2 - 3} fill={C.cream} stroke={C.ink} strokeWidth={BORDER} />
              {/* grey remainder (only visible until the red wipe covers it) */}
              <circle
                cx={CX}
                cy={CY}
                r={RM}
                fill="none"
                stroke={GREY}
                strokeWidth={SW}
                strokeDasharray={`${CIRC * ringP} ${CIRC}`}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            </g>
            {/* red: the whole loss slice (20% → 100%) */}
            {redP > 0 ? (
              <circle
                cx={CX}
                cy={CY}
                r={RM}
                fill="none"
                stroke={C.red}
                strokeWidth={SW + redPulse}
                strokeDasharray={`${CIRC * 0.8 * redP} ${CIRC}`}
                strokeDashoffset={-CIRC * 0.2}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            ) : null}
            {/* blue: the ~20% we got */}
            {blueP > 0 ? (
              <circle
                cx={CX}
                cy={CY}
                r={RM}
                fill="none"
                stroke={C.blue}
                strokeWidth={SW + (f > BLUE1 ? 10 : 0)}
                strokeDasharray={`${CIRC * 0.2 * blueP} ${CIRC}`}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            ) : null}
            {blueP >= 1 ? (
              <>
                <path d={sepLine(0)} stroke={C.ink} strokeWidth={BORDER} />
                <path d={sepLine(72)} stroke={C.ink} strokeWidth={BORDER} />
              </>
            ) : null}
          </svg>
          {/* centre label */}
          {blueP > 0.3 ? (
            <div
              style={{
                position: "absolute",
                left: CX - 110,
                top: CY - 70,
                width: 220,
                height: 140,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${centerRed ? punch(f, V80, 0.12, 5) : punch(f, BLUE1, 0.12, 5)})`,
              }}
            >
              <span style={{ fontFamily: FONT.black, fontSize: 36, color: C.ink, lineHeight: 1.1 }}>{centerRed ? "损失" : "拿到"}</span>
              <span style={{ fontFamily: FONT.num, fontSize: 54, lineHeight: 1.05, color: centerRed ? C.red : C.blue, textShadow: `3px 3px 0 ${C.ink}` }}>
                {centerRed ? "≈80%" : "≈20%"}
              </span>
            </div>
          ) : null}

          {/* legend */}
          {f >= LEG1 ? (
            <div style={{ position: "absolute", left: 560, top: 792, transform: `translateX(${(1 - sp(f, LEG1)) * 120}px)`, opacity: Math.min(1, sp(f, LEG1) * 2) }}>
              <LegendRow color={C.blue}>
                <span style={{ fontFamily: FONT.black, fontSize: 38, color: C.ink }}>拿到的展示份额</span>
                <span style={{ fontFamily: FONT.num, fontSize: 60, color: C.blue, textShadow: `3px 3px 0 ${C.ink}`, lineHeight: 1.15 }}>≈20%</span>
              </LegendRow>
            </div>
          ) : null}
          {f >= LEG2 ? (
            <div style={{ position: "absolute", left: 560, top: 944, transform: `translateX(${(1 - sp(f, LEG2)) * 120}px) scale(${punch(f, RED1, 0.08, 6)})`, transformOrigin: "left center", opacity: Math.min(1, sp(f, LEG2) * 2) }}>
              <LegendRow color={lossCol}>
                {redP <= 0 ? (
                  <span style={{ fontFamily: FONT.black, fontSize: 38, color: "#6B6B76" }}>损失的展示份额</span>
                ) : (
                  <>
                    <span style={{ fontFamily: FONT.black, fontSize: 38, color: C.red }}>展示份额损失</span>
                    {f >= WHY ? (
                      <span
                        style={{
                          fontFamily: FONT.black,
                          fontSize: 38,
                          lineHeight: 1.3,
                          color: C.red,
                          transform: `scale(${interpolate(sp(f, WHY, { damping: 9, stiffness: 240 }), [0, 1], [1.5, 1])})`,
                          transformOrigin: "left center",
                          display: "inline-block",
                          background: C.redSoft,
                          borderRadius: 10,
                        }}
                      >
                        （因广告评级）
                      </span>
                    ) : (
                      // grey placeholder (same as the checklist rows in step2_check) until 「广告评级」 is spoken
                      <div style={{ height: 38 * 1.3, display: "flex", alignItems: "center" }}>
                        <div style={{ width: 260, height: 22, borderRadius: 11, background: "#ECECF0" }} />
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: FONT.num,
                        fontSize: 64,
                        color: C.red,
                        textShadow: `3px 3px 0 ${C.ink}`,
                        lineHeight: 1.15,
                        opacity: f >= V80 ? 1 : 0,
                        display: "inline-block",
                        transform: `scale(${punch(f, V80, 0.25, 5)})`,
                        transformOrigin: "left center",
                      }}
                    >
                      ≈80%
                    </span>
                  </>
                )}
              </LegendRow>
            </div>
          ) : null}

          {/* 阿冲 + his 「预算」 thought, crossed out */}
          {f >= DOG_IN ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 866,
                  top: 1134 + (1 - dIn2) * 160 + (f >= TURN && f < TURN + 8 ? -14 * Math.sin(((f - TURN) / 8) * Math.PI) : 0),
                  // facing away from the chart (daydreaming about budget) → snaps round at TURN
                  transform:
                    f < TURN
                      ? `translateX(18px) rotate(${-25 + Math.sin(f * 0.12) * 3}deg)`
                      : `rotate(${interpolate(turn, [-1, 1], [-25, 0])}deg) scale(${punch(f, TURN, 0.2, 5)})`,
                }}
              >
                <MascotFace kind="dog" size={136} talking={dogTalk} mood={f < TURN ? "money" : "shock"} />
              </div>
              {f >= TURN ? (
                <div style={{ position: "absolute", left: 970, top: 1078, opacity: interpolate(f, [TURN, TURN + 3, TURN + 24, TURN + 30], [0, 1, 1, 0], clamp) }}>
                  <span style={{ fontFamily: FONT.display, fontSize: 60, color: C.red, textShadow: `2px 2px 0 ${C.ink}` }}>!!</span>
                </div>
              ) : null}
              {/* thought bubble: 阿冲 is thinking 「预算」 */}
              <div
                style={{
                  position: "absolute",
                  left: 556,
                  top: 1146 + floatA,
                  transform: `scale(${dIn2})`,
                  transformOrigin: "100% 60%",
                  background: C.paper,
                  border: `5px solid ${C.ink}`,
                  borderRadius: 36,
                  padding: "12px 18px 16px 14px",
                  boxShadow: `5px 5px 0 ${C.ink}`,
                }}
              >
                <StruckTag crossAt={CROSS} size={44} />
              </div>
              {[
                { x: 812, y: 1224, r: 11, d: 3 },
                { x: 842, y: 1200, r: 7, d: 6 },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: b.x - b.r,
                    top: b.y - b.r + floatA * 0.6,
                    width: b.r * 2,
                    height: b.r * 2,
                    borderRadius: "50%",
                    background: C.paper,
                    border: `4px solid ${C.ink}`,
                    transform: `scale(${sp(f, DOG_IN + b.d, { damping: 10 })})`,
                  }}
                />
              ))}
            </>
          ) : null}
          {f >= NOTE ? (
            <div
              style={{
                position: "absolute",
                left: 256,
                top: 1178 + floatB * 0.5,
                fontFamily: FONT.display,
                fontSize: 64,
                color: C.red,
                whiteSpace: "nowrap",
                textShadow: `3px 3px 0 ${C.paper}, -3px -3px 0 ${C.paper}, 3px -3px 0 ${C.paper}, -3px 3px 0 ${C.paper}`,
                transform: `rotate(-5deg) scale(${interpolate(sp(f, NOTE, { damping: 9, stiffness: 240 }), [0, 1], [2.2, 1])})`,
                opacity: Math.min(1, sp(f, NOTE) * 2),
                transformOrigin: "20% 50%",
              }}
            >
              不是预算
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ================= sfx ================= */}
      <Sfx name="coin" at={T175 + 2} volume={0.3} />
      <Sfx name="click" at={STOP} volume={0.3} />
      <Sfx name="pop" at={BAND} volume={0.35} />
      <Sfx name="sparkle" at={BLUE1} volume={0.3} />
      <Sfx name="swish" at={CROSS} volume={0.35} />
      <Sfx name="stamp" at={NOTE} volume={0.3} />
    </AbsoluteFill>
  );
};

const LegendRow: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
    <div style={{ width: 44, height: 44, flex: "none", marginTop: 6, borderRadius: 12, background: color, border: `5px solid ${C.ink}`, boxSizing: "border-box" }} />
    <div style={{ display: "flex", flexDirection: "column", whiteSpace: "nowrap", lineHeight: 1.3 }}>{children}</div>
  </div>
);

export default Step2Case;
