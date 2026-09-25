import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { clamp, Counter, Emoji, Pop, Sfx, useFloat, useShake, useSpring } from "../components/kit";
import { ChapterStamp, Panel, Tag } from "../components/Shared";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { Burst, CoveredButton, DizzyStars, springVal, swingAfter } from "../components/step1/props";

const BLUE = CHAPTER_COLOR["第1步"];

// ---------- gauge geometry (right column of the dashboard) ----------
const VMAX = 6.5;
const GX = 249; // pivot x inside the gauge column
const GY = 236; // pivot y
const GR = 175; // arc radius
const GW = 34; // arc stroke
const ang = (v: number) => 180 - (Math.min(VMAX, Math.max(0, v)) / VMAX) * 180; // math angle (deg)
const pt = (v: number, r: number) => {
  const a = (ang(v) * Math.PI) / 180;
  return [GX + r * Math.cos(a), GY - r * Math.sin(a)] as const;
};
const arc = (v0: number, v1: number, r = GR) => {
  const [x0, y0] = pt(v0, r);
  const [x1, y1] = pt(v1, r);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

const Step1Case: React.FC = () => {
  const f = useCurrentFrame();
  const { at, endAt, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");

  // ---------- timing ----------
  const shrinkAt = endAt(0) - 4;
  const tSpend = w(1, "花费") - 4;
  const tRoas = w(1, "ROAS") - 4;
  const tArrow = tRoas + 8;
  const tArrive = tArrow + 30;
  const tCeil = w(1, "预算") - 6;
  const tStuck = w(1, "卡住") - 2;
  const g1Out = at(2) - 8;
  const tPanel = at(2) - 4;
  const t600 = w(2, "600");
  const tGauge = at(2) + 8;
  const tGaugeHi = at(3) - 4;
  const tTarget = w(3, "2.2") - 4;
  const tGrey = w(3, "表面") - 4;
  const tHit = at(4) - 2;
  const tRev = w(4, "先加") - 4; // "先加了再说！": dizziness gone, $ eyes, lunge at the button
  const tDash = tHit - 14;
  const tBtn = tPanel + 24;
  const bottomOut = at(5) - 4;
  const tScan = at(5);
  const tScanEnd = w(5, "实际") + 2;
  const tLand = w(5, "5.3") - 2;
  const tRoll = tScan + 26;
  const tLagTag = w(5, "转化延迟") - 8; // lands (spring settled) as 转化延迟 is spoken, so it is readable for its whole life

  // ---------- header (chapter stamp + rays) ----------
  // shrunken header stays readable (title ≈ 88 × 0.62 × 0.8 ≈ 44px) and is lifted a little so it clears the panel
  const hdrScale = interpolate(f, [shrinkAt, shrinkAt + 12], [1, 0.8], clamp);
  const hdrLift = interpolate(f, [shrinkAt, shrinkAt + 12], [0, -20], clamp);
  // rays start almost at once so the chapter never opens on an empty stage
  const rays = interpolate(f, [0, 5, shrinkAt, shrinkAt + 10], [0, 1, 1, 0], clamp);
  const tStamp = Math.max(4, at(0) - 7); // spring overshoot peaks on the line-0 drum hit

  // ---------- group 1: metric cards + growth arrow under a ceiling ----------
  const g1o = interpolate(f, [g1Out, g1Out + 9], [1, 0], clamp);
  const drawP = interpolate(f, [tArrow, tArrive], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pushing = f >= tArrive;
  const push = pushing ? ((1 - Math.cos((f - tArrive) * 0.42)) / 2) * 12 : 0;
  const stuckShake = useShake(tStuck, 14, 10);
  const ceilIn = useSpring(tCeil, { damping: 16 });
  const qBlink = 0.55 + 0.45 * Math.abs(Math.sin(f * 0.18));

  // growth path (absolute canvas coords)
  const P: Array<[number, number]> = [
    [150, 1225],
    [300, 1105],
    [410, 1150],
    [560, 990],
    [665, 1040],
    [826, 822],
  ];
  const pathD = P.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const [ex, ey] = P[P.length - 1];
  const [px, py] = P[P.length - 2];
  const headRot = (Math.atan2(ey - py, ex - px) * 180) / Math.PI;
  const CEIL_Y = 796;
  const tipX = 842;

  // ---------- panel ----------
  const panelS = useSpring(tPanel, { damping: 15 });
  const panelFloat = useFloat(4, 0.07);
  const gaugeDraw = interpolate(f, [tGauge, tGauge + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const targetS = useSpring(tTarget, { damping: 11, stiffness: 220 });
  const greyP = interpolate(f, [tGrey, tGrey + 12], [0, 1], clamp);
  // needle: rises into the grey zone, wobbles, then swings to 5.3
  const landS = useSpring(tLand, { damping: 9, stiffness: 140 });
  const wobble = 2.2 + Math.sin(f * 0.23) * 0.32 + Math.sin(f * 0.61) * 0.12;
  const needleIn = useSpring(tGrey, { damping: 12 });
  const needleV = f < tLand ? needleIn * wobble : wobble + (5.3 - wobble) * landS;
  const needleA = ang(needleV);
  const greenP = interpolate(f, [tLand, tLand + 10], [0, 1], clamp);
  // 5.3 is the hero: punch 1 → 1.25 → 1, then a gentle breathing so it keeps drawing the eye
  const landPunch =
    f >= tLand ? interpolate(f, [tLand, tLand + 4, tLand + 9], [1, 1.25, 1], clamp) + (f > tLand + 9 ? 0.03 * Math.sin((f - tLand - 9) * 0.2) : 0) : 1;
  const heroGlow = f >= tLand ? interpolate(f, [tLand, tLand + 6], [0, 1], clamp) * (0.6 + 0.4 * Math.sin((f - tLand) * 0.2)) : 0;
  // once 5.3 lands, the $600 column steps back so 5.3 is the only hero
  const spendDim = interpolate(f, [tLand, tLand + 8], [1, 0.55], clamp);

  // scan band
  const scanP = interpolate(f, [tScan, tScanEnd], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const scanVis = f >= tScan - 2 && f <= tScanEnd + 6;
  const scanO = interpolate(f, [tScan - 2, tScan + 4, tScanEnd, tScanEnd + 6], [0, 1, 1, 0], clamp);
  const lagTagS = useSpring(tLagTag, { damping: 10, stiffness: 220 });

  // slot roll
  const ROLL_N = 14;
  const CELL = 116; // readout window height
  const RW = 264; // readout window width
  // readout box centre in canvas coords: panel (60, 452) + border 6 + title bar 70 + 6 + body padding 28,
  // then the spend column (372) + gap 22 inside the body; the box sits at (GX, GY + 26 + CELL / 2) of the gauge column
  const RO_CX = 60 + BORDER + 28 + 372 + 22 + GX;
  const RO_CY = 452 + BORDER + 70 + BORDER + 28 + GY + 26 + CELL / 2;
  const rollP =
    interpolate(f, [tRoll, tLand], [0, 1], clamp) +
    (f > tLand ? -0.012 * Math.exp(-(f - tLand) / 4) * Math.sin((f - tLand) * 0.9) : 0);
  // even-odd clip for the confetti layer: the whole canvas minus the (scaled) readout box + its 6px shadow
  const holeW = (RW * landPunch) / 2 + 4;
  const holeH = (CELL * landPunch) / 2 + 4;
  const hy = RO_CY + panelFloat;
  const readoutHole =
    `M0 0 H1080 V1920 H0 Z ` +
    `M${(RO_CX - holeW).toFixed(1)} ${(hy - holeH).toFixed(1)} H${(RO_CX + holeW + 6).toFixed(1)} V${(hy + holeH + 6).toFixed(1)} H${(RO_CX - holeW).toFixed(1)} Z`;

  // ---------- bottom zone: button + 阿冲 bonk ----------
  const btnS = useSpring(tBtn, { damping: 13 });
  // exits in place (fade + shrink) so it never slides down behind the caption bubble
  const bOut = interpolate(f, [bottomOut, bottomOut + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const coverShake = useShake(tHit, 16, 9) + useShake(tRev + 8, 10, 5);
  const signSwing = swingAfter(f, tHit, 22, 16, 0.42) + swingAfter(f, tRev + 8, 10) + Math.sin(f * 0.09) * 2;
  const BTN_L = 90;
  const BTN_SIZE = 260;
  const HIT_X = BTN_L + BTN_SIZE - 50;
  const REST_X = 560;
  const DOG_SIZE = 180;
  const DOG_Y = 1098;
  let dogX = 1140;
  let dogY = DOG_Y;
  let squash = 1;
  if (f >= tDash && f < tHit) {
    dogX = interpolate(f, [tDash, tHit], [1140, HIT_X], { ...clamp, easing: Easing.in(Easing.quad) });
    dogY = DOG_Y - Math.abs(Math.sin((f - tDash) * 0.9)) * 16;
  } else if (f >= tHit && f < tHit + 6) {
    dogX = HIT_X;
    squash = interpolate(f, [tHit, tHit + 2, tHit + 6], [1, 0.72, 0.9], clamp);
  } else if (f >= tHit + 6) {
    const b = interpolate(f, [tHit + 6, tHit + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
    dogX = HIT_X + (REST_X - HIT_X) * b;
    dogY = DOG_Y - Math.sin(b * Math.PI) * 70;
  }
  const revved = f >= tRev;
  const lunge = springVal(f, tRev, 20);
  if (revved) dogX -= 70 * lunge;
  const dizzy = f >= tHit && !revved;
  const dogTalk = talkingAt(dogId, scene.start + f);
  const dogTilt = revved ? -10 + Math.sin(f * 0.35) * 4 : dizzy ? Math.sin(f * 0.16) * 9 : -8;

  // ---------- comparison bars ----------
  const barsIn = useSpring(at(5) + 6, { damping: 14 });
  const MAXW = 560;
  const tgtW = interpolate(f, [at(5) + 10, at(5) + 24], [0, (2.2 / 5.3) * MAXW], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lagW = interpolate(f, [tScanEnd - 4, tLand], [0, MAXW], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <AbsoluteFill>
      {/* ================= header ================= */}
      {rays > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: 575 - 560,
            width: 1120,
            height: 1120,
            borderRadius: "50%",
            opacity: rays * 0.9,
            background: `repeating-conic-gradient(from ${f * 0.6}deg, ${C.blueSoft} 0deg 9deg, transparent 9deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 30%, transparent 68%)",
          }}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${hdrLift}px) scale(${hdrScale})`, transformOrigin: "540px 270px" }}>
        <ChapterStamp at={tStamp} num="01" title="预算真的是瓶颈吗？" color={BLUE} shrinkAt={shrinkAt} />
      </div>

      {/* ================= group 1: 花费 / ROAS + ceiling ================= */}
      {f < g1Out + 10 ? (
        <div style={{ position: "absolute", inset: 0, opacity: g1o, transform: `scale(${0.9 + 0.1 * g1o})`, transformOrigin: "540px 860px" }}>
          <Pop at={tSpend} style={{ position: "absolute", left: 70, top: 470 }}>
            <MetricCard emoji="💸" label="花费" labelFont={FONT.display} color={BLUE} phase={0} />
          </Pop>
          <Pop at={tRoas} style={{ position: "absolute", left: 570, top: 470 }}>
            <MetricCard emoji="📈" label="ROAS" labelFont={FONT.num} labelSize={70} color={C.green} phase={1.4} />
          </Pop>

          {/* axes + growth arrow + ceiling */}
          <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {f >= tArrow - 6 ? (
              <g opacity={interpolate(f, [tArrow - 6, tArrow + 2], [0, 1], clamp)}>
                <path d="M110 752 L110 1250 L1000 1250" fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M96 770 L110 748 L124 770" fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null}
            {/* ceiling */}
            {f >= tCeil ? (
              <g opacity={ceilIn}>
                <path
                  d={`M110 ${CEIL_Y} L${tipX - 90} ${CEIL_Y} Q${tipX} ${CEIL_Y - push * 1.4 - Math.abs(stuckShake)} ${tipX + 90} ${CEIL_Y} L1000 ${CEIL_Y}`}
                  fill="none"
                  stroke={C.ink}
                  strokeWidth={7}
                  strokeDasharray="24 16"
                  strokeDashoffset={-f * 1.2}
                  strokeLinecap="round"
                  transform={`translate(0 ${(1 - ceilIn) * -40})`}
                />
              </g>
            ) : null}
            {/* growth arrow */}
            {f >= tArrow ? (
              <g transform={`translate(${stuckShake * 0.4} ${-push * 0.6})`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={C.green}
                  strokeWidth={26}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - drawP}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={C.ink}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - drawP}
                  opacity={0.12}
                />
                {drawP > 0.97 ? (
                  <g transform={`translate(${ex} ${ey}) rotate(${headRot}) scale(${1 - push * 0.02}, ${1 + push * 0.015})`}>
                    <path d="M-8 -34 L44 0 L-8 34 Z" fill={C.green} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
                  </g>
                ) : null}
              </g>
            ) : null}
            {/* impact marks when it hits the ceiling */}
            {pushing && push > 7 ? (
              <g stroke={C.red} strokeWidth={7} strokeLinecap="round">
                <path d={`M${tipX - 46} ${CEIL_Y + 18} L${tipX - 70} ${CEIL_Y + 4}`} />
                <path d={`M${tipX + 46} ${CEIL_Y + 18} L${tipX + 70} ${CEIL_Y + 4}`} />
                <path d={`M${tipX + 36} ${CEIL_Y + 44} L${tipX + 64} ${CEIL_Y + 44}`} />
              </g>
            ) : null}
          </svg>
          {f >= tCeil + 2 ? (
            <Pop at={tCeil + 2} style={{ position: "absolute", left: 150, top: CEIL_Y - 78 }} from="down" distance={40}>
              <Tag color={C.yellow} size={44} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                预算上限<span style={{ display: "inline-block", opacity: qBlink, transform: `scale(${0.9 + qBlink * 0.2})` }}>？</span>
              </Tag>
            </Pop>
          ) : null}
          {/* stuck: "卡住？" growth sticker */}
          <Pop at={tStuck} style={{ position: "absolute", left: 610, top: 1100 }} damping={9}>
            <div style={{ transform: `rotate(-6deg) translateY(${bobAt(f, 5, 0.12)}px)` }}>
              <Tag color={C.paper} size={40} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                增长被卡住了？
              </Tag>
            </div>
          </Pop>
          <Sfx name="pop" at={tSpend} volume={0.35} />
          <Sfx name="pop" at={tRoas} volume={0.35} />
          <Sfx name="impact" at={tStuck} volume={0.25} />
        </div>
      ) : null}

      {/* ================= dashboard panel ================= */}
      {f >= tPanel ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 452,
            width: 960,
            transform: `translateX(${(1 - panelS) * 900}px) rotate(${(1 - panelS) * 6}deg) translateY(${panelFloat}px)`,
          }}
        >
          <Panel title="Google Ads · 广告系列" width={960} bodyStyle={{ display: "flex", gap: 22, padding: 28 }}>
            {/* left: daily spend */}
            <div style={{ width: 372, display: "flex", flexDirection: "column", gap: 18, opacity: spendDim }}>
              <div
                style={{
                  background: C.blueSoft,
                  border: `4px solid ${C.ink}`,
                  borderRadius: 24,
                  padding: "18px 16px 14px",
                }}
              >
                <div style={{ fontFamily: FONT.bold, fontSize: 38, color: C.ink, lineHeight: 1.2 }}>每日花费</div>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, whiteSpace: "nowrap" }}>
                  <Counter
                    to={600}
                    at={t600 - 30}
                    dur={32}
                    prefix="$"
                    style={{ fontSize: 86, color: C.ink, lineHeight: 1.05, transform: `scale(${f >= t600 + 2 ? 1 + 0.12 * Math.exp(-(f - t600 - 2) / 5) : 1})`, display: "inline-block", transformOrigin: "left bottom" }}
                  />
                  <span style={{ fontFamily: FONT.black, fontSize: 42, color: C.ink, marginLeft: 4 }}>/天</span>
                </div>
              </div>
              {/* bills stacking while the counter runs */}
              <div style={{ position: "relative", height: 150 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Pop key={i} at={t600 - 28 + i * 6} from="down" distance={80} style={{ position: "absolute", left: 20 + i * 58, top: 20 + (i % 2) * 18 }}>
                    <Emoji e="💵" size={84} style={{ transform: `rotate(${(i % 2 ? 8 : -8) + Math.sin(f * 0.1 + i) * 4}deg)` }} />
                  </Pop>
                ))}
              </div>
            </div>

            {/* right: ROAS gauge */}
            <div style={{ position: "relative", width: 498, height: 430 }}>
              <div style={{ position: "absolute", right: 4, top: 0, fontFamily: FONT.num, fontSize: 40, color: C.muted }}>ROAS</div>
              <svg width={498} height={300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {/* track */}
                <path d={arc(0, VMAX)} fill="none" stroke={C.ink} strokeWidth={GW + 12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - gaugeDraw} />
                <path d={arc(0, VMAX)} fill="none" stroke="#EDEDF3" strokeWidth={GW} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - gaugeDraw} />
                {/* line-3 highlight sweep over the track */}
                {f >= tGaugeHi && f < tGaugeHi + 26 ? (
                  <path
                    d={arc(0, VMAX)}
                    fill="none"
                    stroke={BLUE}
                    strokeWidth={GW}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - interpolate(f, [tGaugeHi, tGaugeHi + 12], [0, 1], clamp)}
                    opacity={interpolate(f, [tGaugeHi + 12, tGaugeHi + 26], [0.7, 0], clamp)}
                  />
                ) : null}
                {/* grey "surface" zone */}
                {greyP > 0 ? <path d={arc(1.55, 2.85)} fill="none" stroke="#A9A9B6" strokeWidth={GW} opacity={greyP * (1 - greenP * 0.35)} /> : null}
                {/* green zone after the lag scan */}
                {greenP > 0 ? <path d={arc(4.75, 5.85)} fill="none" stroke={C.green} strokeWidth={GW} opacity={greenP} /> : null}
                {/* target tick */}
                {f >= tTarget ? (
                  <g opacity={Math.min(1, targetS * 2)}>
                    {(() => {
                      const [x0, y0] = pt(2.2, GR - GW / 2 - 12);
                      const [x1, y1] = pt(2.2, GR + GW / 2 + 16 + (1 - targetS) * 30);
                      return <path d={`M${x0} ${y0} L${x1} ${y1}`} stroke={BLUE} strokeWidth={10} strokeLinecap="round" />;
                    })()}
                  </g>
                ) : null}
                {/* needle */}
                {f >= tGrey ? (
                  <g transform={`rotate(${-needleA} ${GX} ${GY})`}>
                    <path d={`M${GX - 18} ${GY - 9} L${GX + GR - 34} ${GY} L${GX - 18} ${GY + 9} Z`} fill={f >= tLand ? C.green : C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
                  </g>
                ) : null}
                {gaugeDraw > 0 ? <circle cx={GX} cy={GY} r={17} fill={C.paper} stroke={C.ink} strokeWidth={6} /> : null}
              </svg>
              {/* target label */}
              {f >= tTarget
                ? (() => {
                    const [lx, ly] = pt(2.2, GR + 78);
                    return (
                      <div
                        style={{
                          position: "absolute",
                          left: lx,
                          top: ly,
                          transform: `translate(-50%, -50%) scale(${targetS})`,
                        }}
                      >
                        <Tag color={BLUE} text={C.paper} size={36}>
                          目标 <span style={{ fontFamily: FONT.num }}>2.2</span>
                        </Tag>
                      </div>
                    );
                  })()
                : null}
              {/* reading box (never a reported number: "--" until the lag scan) */}
              {gaugeDraw > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: GX - RW / 2,
                    top: GY + 26,
                    width: RW,
                    height: CELL,
                    borderRadius: 24,
                    border: `6px solid ${C.ink}`,
                    background: f >= tLand ? C.greenSoft : C.paper,
                    overflow: "hidden",
                    boxSizing: "border-box",
                    transform: `scale(${landPunch})`,
                    boxShadow: heroGlow > 0 ? `0 0 0 ${4 + heroGlow * 8}px ${C.green}66, 6px 6px 0 ${C.ink}` : `6px 6px 0 ${C.ink}`,
                  }}
                >
                  {f < tRoll ? (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT.num,
                        fontSize: 80,
                        color: C.muted,
                        opacity: 0.55 + 0.45 * Math.abs(Math.sin(f * 0.14)),
                      }}
                    >
                      --
                    </div>
                  ) : (
                    <div style={{ transform: `translateY(${-rollP * (ROLL_N - 1) * (CELL - 12)}px)` }}>
                      {Array.from({ length: ROLL_N }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: CELL - 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: FONT.num,
                            fontSize: i === ROLL_N - 1 ? 100 : 76,
                            lineHeight: 1,
                            color: i === ROLL_N - 1 ? C.green : C.muted,
                            filter: rollP < 0.9 && i !== ROLL_N - 1 ? "blur(1.5px)" : undefined,
                          }}
                        >
                          {i === ROLL_N - 1 ? "5.3" : "??"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              {/* grey tag → green tag */}
              {f >= tGrey ? (
                <div style={{ position: "absolute", left: 0, right: 0, top: GY + CELL + 34, display: "flex", justifyContent: "center" }}>
                  <Pop at={tGrey + 2} from="up" distance={30}>
                    {f < tLand ? (
                      <Tag color="#D9D9E1" size={36}>
                        表面：一般 <Emoji e="😐" size={34} style={{ verticalAlign: "-4px" }} />
                      </Tag>
                    ) : (
                      <div style={{ transform: `scale(${interpolate(f, [tLand, tLand + 6], [0.6, 1], clamp)})` }}>
                        <Tag color={C.green} text={C.paper} size={36}>
                          实际 <Emoji e="😎" size={34} style={{ verticalAlign: "-4px" }} />
                        </Tag>
                      </div>
                    )}
                  </Pop>
                </div>
              ) : null}
            </div>
          </Panel>

          {/* 案例 sticker */}
          <Pop at={tPanel + 8} style={{ position: "absolute", left: -18, top: -30 }} damping={9}>
            <div style={{ transform: "rotate(-10deg)" }}>
              <Tag color={C.yellow} size={40} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                案例
              </Tag>
            </div>
          </Pop>

          {/* 转化延迟 scan band */}
          {scanVis ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: -160 + scanP * 1120,
                  width: 150,
                  opacity: scanO,
                  background: `linear-gradient(90deg, transparent, ${C.blue}55 40%, #FFFFFFcc 50%, ${C.blue}55 60%, transparent)`,
                  borderLeft: `3px solid ${C.blue}66`,
                  borderRight: `3px solid ${C.blue}66`,
                }}
              />
            </div>
          ) : null}
          {/* 转化延迟 label: pinned in the empty right end of the title bar (clear of the title text,
              the chapter header above and the panel content below); pulses as the band passes under it */}
          {f >= tLagTag && f <= tScanEnd + 14 ? (
            <div
              style={{
                position: "absolute",
                right: 30,
                top: 8,
                opacity: interpolate(f, [tScanEnd + 4, tScanEnd + 14], [1, 0], clamp),
                transform: `scale(${Math.min(1.05, lagTagS) * (1 + 0.1 * Math.exp(-Math.pow((-85 + scanP * 1120 - 830) / 70, 2)))})`,
                transformOrigin: "100% 50%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: C.paper,
                border: `4px solid ${C.ink}`,
                borderRadius: 16,
                padding: "0 14px 0 8px",
                height: 66,
                boxSizing: "border-box",
                fontFamily: FONT.black,
                fontSize: 48,
                lineHeight: 1,
                color: BLUE,
                whiteSpace: "nowrap",
              }}
            >
              <Emoji e="⏳" size={44} style={{ transform: `rotate(${Math.floor(f / 10) % 2 ? 180 : 0}deg)` }} />
              转化延迟
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ================= bottom: covered button + 阿冲 bonk ================= */}
      {f >= tBtn && f < bottomOut + 7 ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - 0.15 * bOut})`, transformOrigin: "380px 1180px", opacity: 1 - bOut }}>
          <div
            style={{
              position: "absolute",
              left: BTN_L + coverShake,
              top: 1282 - BTN_SIZE * 0.82,
              transform: `scale(${btnS})`,
              transformOrigin: "50% 100%",
            }}
          >
            <CoveredButton size={BTN_SIZE} cover={1} swing={signSwing} />
          </div>
          {/* speed lines */}
          {(f >= tDash && f < tHit) || (f >= tRev && f < tRev + 9)
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: dogX + DOG_SIZE - 10 + i * 18,
                    top: dogY + 50 + i * 36,
                    width: 120 - i * 20,
                    height: 8,
                    borderRadius: 4,
                    background: C.ink,
                    opacity: f >= tRev ? 0.35 * interpolate(f, [tRev, tRev + 9], [1, 0], clamp) : 0.35,
                  }}
                />
              ))
            : null}
          {f >= tDash ? (
            <div
              style={{
                position: "absolute",
                left: dogX,
                top: dogY,
                transform: `rotate(${dogTilt}deg) scale(${squash}, ${2 - squash})`,
                transformOrigin: "0% 60%",
              }}
            >
              <MascotFace kind="dog" size={DOG_SIZE} talking={dogTalk} mood={dizzy ? "dizzy" : "money"} />
            </div>
          ) : null}
          {/* "先加了再说！": $$$ sparkles around the eager face */}
          {revved && f < bottomOut + 7 ? (
            <div style={{ position: "absolute", left: dogX - 20, top: dogY - 34, transform: `scale(${Math.min(1, lunge)})` }}>
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: [0, 170, 196][k],
                    top: [10, -6, 96][k],
                    opacity: 0.5 + 0.5 * Math.abs(Math.sin(f * 0.22 + k * 1.3)),
                    transform: `scale(${0.75 + 0.35 * Math.abs(Math.sin(f * 0.22 + k * 1.3))})`,
                  }}
                >
                  <Emoji e="✨" size={46} />
                </div>
              ))}
            </div>
          ) : null}
          {dizzy && f >= tHit + 8 && f < tRev ? <DizzyStars x={dogX + DOG_SIZE / 2} y={dogY + 4} rx={78} ry={20} /> : null}
          {/* 💥 at impact */}
          {f >= tHit && f < tHit + 14 ? (
            <div
              style={{
                position: "absolute",
                left: HIT_X - 40,
                top: DOG_Y - 10,
                transform: `scale(${interpolate(f, [tHit, tHit + 4, tHit + 14], [0.3, 1.15, 0.9], clamp)})`,
                opacity: interpolate(f, [tHit + 9, tHit + 14], [1, 0], clamp),
              }}
            >
              <Emoji e="💥" size={120} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ================= comparison bars ================= */}
      {f >= at(5) + 6 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 1048,
            width: 960,
            transform: `translateY(${-(1 - Math.min(1, barsIn)) * 40}px) scale(${0.85 + 0.15 * barsIn})`,
            transformOrigin: "50% 100%",
            opacity: Math.min(1, barsIn * 1.5),
          }}
        >
          <div
            style={{
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: SHADOW,
              padding: "20px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <BarRow label="目标" width={tgtW} color="#9DB9F2" value="2.2" show={f >= at(5) + 20} />
            <BarRow label="算上延迟" width={lagW} color={C.green} value="5.3" show={f >= tLand} big />
          </div>
        </div>
      ) : null}

      {/* confetti when 5.3 lands: it bursts out from BEHIND the readout. The layer is clipped (even-odd
          path) around the readout box — tracking its punch scale and the panel float — so no piece is
          ever drawn over the 5.3 digits */}
      {f >= tLand && f <= tLand + 48 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `path(evenodd, "${readoutHole}")`, pointerEvents: "none" }}>
          <Burst at={tLand} x={RO_CX} y={RO_CY} seed="s1case" n={34} power={24} dur={48} spread={80} />
        </div>
      ) : null}
      <Sfx name="swish" at={tDash} volume={0.3} />
      <Sfx name="swish" at={tRev} volume={0.25} />
      <Sfx name="pop" at={tTarget} volume={0.3} />
      <Sfx name="sparkle" at={tLand} volume={0.4} />
    </AbsoluteFill>
  );
};

// small deterministic float without hooks (usable inside conditionals)
const bobAt = (f: number, amp: number, speed: number) => Math.sin(f * speed) * amp;

const MetricCard: React.FC<{ emoji: string; label: string; labelFont: string; labelSize?: number; color: string; phase: number }> = ({
  emoji,
  label,
  labelFont,
  labelSize = 84,
  color,
  phase,
}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f * 0.09 + phase) * 6;
  return (
    <div
      style={{
        width: 440,
        height: 180,
        background: C.paper,
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 32,
        boxShadow: SHADOW,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 30px",
        boxSizing: "border-box",
        transform: `translateY(${bob}px)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: color, borderRight: `4px solid ${C.ink}` }} />
      <div style={{ marginLeft: 14 }}>
        <Emoji e={emoji} size={92} />
      </div>
      <div style={{ fontFamily: labelFont, fontSize: labelSize, color: C.ink, lineHeight: 1, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

const BarRow: React.FC<{ label: string; width: number; color: string; value: string; show: boolean; big?: boolean }> = ({ label, width, color, value, show, big }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", height: 84 }}>
      <div style={{ width: 176, fontFamily: FONT.black, fontSize: 40, color: C.ink, whiteSpace: "nowrap" }}>{label}</div>
      <div
        style={{
          width: Math.max(0, width),
          height: 62,
          background: color,
          border: width > 4 ? `5px solid ${C.ink}` : "none",
          borderRadius: 16,
          boxSizing: "border-box",
          boxShadow: width > 4 ? `5px 5px 0 ${C.ink}` : undefined,
        }}
      />
      {show ? (
        <div
          style={{
            marginLeft: 18,
            fontFamily: FONT.num,
            fontSize: big ? 80 : 48,
            lineHeight: 1,
            color: big ? C.green : C.ink,
            textShadow: big ? `3px 3px 0 ${C.ink}` : undefined,
            transform: `scale(${big ? 1 + 0.08 * Math.sin(f * 0.2) : 1})`,
          }}
        >
          {value}
        </div>
      ) : null}
    </div>
  );
};

export default Step1Case;
