import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { clamp, Emoji, Pop, Sfx, Stamp, useShake, useSpring } from "../components/kit";
import { Tag } from "../components/Shared";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { Coin, springVal } from "../components/step1/props";

// ---------- calendar geometry (absolute canvas coords) ----------
const CAL_L = 60;
const CAL_T = 392;
const CELL_W = 120;
const CELL_H = 110;
const GAP = 10;
const GRID_X = CAL_L + BORDER + 24;
const GRID_Y = CAL_T + BORDER + 24 + 70 + 46 + 10;
// September: the 1st is a Monday (Monday-first week)
const cellOf = (d: number) => {
  const i = d - 1;
  const col = i % 7;
  const row = Math.floor(i / 7);
  return { x: GRID_X + col * (CELL_W + GAP), y: GRID_Y + row * (CELL_H + GAP), row, col };
};
const center = (d: number) => {
  const c = cellOf(d);
  return [c.x + CELL_W / 2, c.y + CELL_H / 2] as const;
};

// ---------- chart geometry ----------
const BASE_Y = 1058;
const PLOT_H = 600;
const BAR_W = 58;
const BAR_X0 = 212;
const BAR_STEP = 78;
const OLD = [0.6, 0.7, 0.56, 0.74, 0.62, 0.68, 0.6];
const RECENT = [0.2, 0.14, 0.08];
const FILLED = [0.7, 0.63, 0.69];
const TARGET = 0.5;
// bracket over the three recent (unfilled) bars, and its label chips
const BRACKET_CX = (BAR_X0 + 7 * BAR_STEP + BAR_X0 + 9 * BAR_STEP + BAR_W) / 2; // ≈ 865, the stem
const LABEL_R = 100; // right inset of the right-aligned chips: edge 980, shadow 985, panel border 1014–1020
const LOW_CHIP_W = 312; // rendered width of the 「→ 看起来偏低」 chip (size 44): x 668–980
const NOFILL_W = 172; // rendered width of the 「未回填」 chip (size 44)
const NOFILL_CX_END = 1080 - LABEL_R - LOW_CHIP_W - 20 - NOFILL_W / 2; // 20px between the chips (15 past the shadow)

const Step1Lag: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");

  // ---------- timing ----------
  const tCal = 2;
  const tBlue = w(0, "默认") - 4;
  const tGrey = at(1) - 4;
  const tDimGrey = w(1, "购买") + 4;
  const tDim = at(2);
  const tClick = w(2, "1 日") - 6;
  const tClickLand = tClick + 10;
  const tWalk = at(3);
  const tBag = w(3, "下单") - 4;
  const tDog = at(4) - 6;
  const tDogOut = at(5) - 4;
  const tFly = at(5) - 2;
  const tFlyEnd = tFly + 14;
  const tStampAt = tFlyEnd + 2;
  // calendar → chart: one horizontal carousel move (never a cross-dissolve of two text layers)
  const tSlide = at(6) - 4;
  const tChart = at(6) - 2;
  const tWait = w(6, "还没下单") - 6;
  const tBracket = at(7) - 2;
  const tNoFill = w(7, "没回填") - 4;
  const tLow = w(7, "偏低") - 4;
  const tWeek = at(8) - 4;
  const tCoins = w(8, "同一天") - 16;
  const tHigh = w(8, "变高") - 4;

  // ---------- calendar phase ----------
  const calS = useSpring(tCal, { damping: 13, stiffness: 150 });
  const slideS = useSpring(tSlide, { damping: 16, stiffness: 150 });
  const slideX = f >= tSlide ? slideS * 1080 : 0;
  // rows 2–5 step back while row 1 tells the story, then clear out completely before 阿冲's question:
  // the freed space under row 1 then holds 阿冲, the return arc and the 记在 9/1 stamp
  const dim = interpolate(f, [tDim, tDim + 10, tDog - 10, tDog], [1, 0.25, 0.25, 0], clamp);
  // the purchase-day chip only dims (neutral grey, never crossed out)
  const greyFade = interpolate(f, [tDimGrey + 6, tDimGrey + 16], [1, 0.62], clamp);
  const clickS = useSpring(tClickLand, { damping: 10, stiffness: 200 });
  const bagS = useSpring(tBag, { damping: 9, stiffness: 200 });
  const blueLit = f >= tClickLand;
  const d1Glow = f >= tStampAt ? 0.5 + 0.5 * Math.sin((f - tStampAt) * 0.25) : 0;
  const bluePulse = f >= tStampAt && f < tStampAt + 16 ? 1 + 0.08 * Math.sin(((f - tStampAt) / 16) * Math.PI) : 1;

  // bag flight 9/5 → 9/1 along a return arc through the (cleared) space under row 1
  const flyP = interpolate(f, [tFly, tFlyEnd], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const [x5, y5] = center(5);
  const [x1, y1] = center(1);
  // cubic return arc: starts under the 下单 tag, dips through the cleared rows and comes back up into
  // 9/1's bottom-right corner, i.e. in the free corridor right of the 点击 tag and below 9/2, so the
  // arrowhead at its end is never hidden and clearly points into 9/1
  const ARC: ReadonlyArray<readonly [number, number]> = [
    [x5, y5],
    [610, 975],
    [330, 790],
    [x1 + CELL_W / 2 - 6, y1 + CELL_H / 2 - 4],
  ];
  const arcAt = (t: number) => {
    const a = (1 - t) ** 3;
    const b = 3 * t * (1 - t) ** 2;
    const c = 3 * t * t * (1 - t);
    const d = t ** 3;
    return [a * ARC[0][0] + b * ARC[1][0] + c * ARC[2][0] + d * ARC[3][0], a * ARC[0][1] + b * ARC[1][1] + c * ARC[2][1] + d * ARC[3][1]] as const;
  };
  // the bag rides the arc, then tucks into the centre of 9/1 over the last stretch
  const tuck = interpolate(flyP, [0.75, 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const [arcX, arcY] = arcAt(flyP);
  const bagX = arcX + (x1 - ARC[3][0]) * tuck;
  const bagY = arcY + (y1 - ARC[3][1]) * tuck;
  const TRAIL_T0 = 0.16;
  const TRAIL_T1 = 0.9;

  // dog with magnifier
  const dogS = useSpring(tDog, { damping: 12 });
  const dogOut = interpolate(f, [tDogOut, tDogOut + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // starts over 9/5 (where the order is), swings over to 9/1 and back a little
  const look = Math.cos(Math.max(0, f - tDog) * 0.12); // -1 = 9/1 side, +1 = 9/5 side
  const lensX = interpolate(look, [-1, 1], [x1 + 20, x5]);
  const lensY = y1 + 4 - Math.abs(Math.sin(Math.max(0, f - tDog) * 0.12)) * 10;
  // rigid rig: lens → handle (down-right) → paw at the upper right of 阿冲's head
  const HDX = 0.574;
  const HDY = 0.819;
  const pawX = lensX + 180 * HDX;
  const pawY = lensY + 180 * HDY;
  const dogL = pawX - 80 - 120;
  const dogT = pawY + 70 - 131;

  // ---------- chart phase ----------
  const waitS = useSpring(tWait, { damping: 11 });
  const bracketS = useSpring(tBracket, { damping: 12 });
  const lowPulse = f >= tLow && f < tWeek ? 0.5 + 0.5 * Math.sin((f - tLow) * 0.3) : 0;
  // the three unfilled bars breathe (1 → 1.06) all through 「订单没回填…偏低」
  const dashPulse = f >= tBracket && f < tWeek + 6 ? 1.03 - 0.03 * Math.cos((f - tBracket) * 0.3) : 1;
  const lowS = springVal(f, tLow, 20);
  const dogShake = useShake(tLow, 16, 9);
  const hourPunch = f >= tNoFill && f < tNoFill + 12 ? 1 + 0.35 * Math.sin(((f - tNoFill) / 12) * Math.PI) : 1;
  const lowPunch = f >= tLow && f < tLow + 10 ? 1 + 0.25 * Math.sin(((f - tLow) / 10) * Math.PI) : 1;
  const shiver = f >= tLow && f < tLow + 12 ? Math.sin(f * 1.2) * 3 * (1 - (f - tLow) / 12) * 1.6 : 0;
  const downS = springVal(f, tLow, 22);
  const downO = interpolate(f, [tLow, tLow + 4, tWeek, tWeek + 8], [0, 1, 1, 0], clamp);
  // gap between the unfilled bars and the target line (appears on "ROAS")
  const gapP = interpolate(f, [w(7, "ROAS") - 4, w(7, "ROAS") + 10, tWeek, tWeek + 8], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const weekS = useSpring(tWeek, { damping: 12, stiffness: 150 });
  const coinT = (k: number) => tCoins + k * 7;
  const grow = (k: number) => {
    const land = coinT(k) + 12;
    return interpolate(f, [land, land + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  };
  const tGreen = Math.min(tHigh, coinT(2) + 26);
  const highS = useSpring(tGreen, { damping: 11 });
  const bracketO = interpolate(f, [tWeek + 4, tWeek + 12, tGreen - 2, tGreen + 4], [1, 0, 0, 1], clamp);
  // bracket label: 未回填 starts centred on the bracket stem, then slides left (just before 偏低) so the
  // right-aligned 「→ 看起来偏低」 chip lands beside it without overlapping
  const noFillSlide = interpolate(f, [tLow - 10, tLow - 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const noFillCx = BRACKET_CX + (NOFILL_CX_END - BRACKET_CX) * noFillSlide;

  const dogTalk = talkingAt(dogId, scene.start + f);

  return (
    <AbsoluteFill>
      {/* =================== CALENDAR PHASE =================== */}
      {f < tSlide + 24 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${-slideX}px)` }}>
          {/* calendar card */}
          <div
            style={{
              position: "absolute",
              left: CAL_L,
              top: CAL_T,
              width: 960,
              height: 790,
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 34,
              boxShadow: SHADOW,
              transform: `translateY(${(1 - calS) * -900}px) rotate(${(1 - calS) * -4}deg)`,
              boxSizing: "border-box",
            }}
          >
            {/* binder rings */}
            {[200, 380, 560, 740].map((x) => (
              <div key={x} style={{ position: "absolute", left: x - CAL_L, top: -22, width: 22, height: 44, borderRadius: 11, background: C.ink }} />
            ))}
            <div style={{ position: "absolute", left: 24, top: 20, display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink, lineHeight: 1 }}>9月</span>
            </div>
          </div>
          {/* weekday header + day cells (drawn in canvas coords, following the card drop) */}
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - calS) * -900}px)` }}>
            {["一", "二", "三", "四", "五", "六", "日"].map((d, i) => (
              <div
                key={d}
                style={{
                  position: "absolute",
                  left: GRID_X + i * (CELL_W + GAP),
                  top: GRID_Y - 52,
                  width: CELL_W,
                  textAlign: "center",
                  fontFamily: FONT.black,
                  fontSize: 34,
                  color: i >= 5 ? C.red : C.muted,
                  opacity: dim < 1 ? 0.6 : 1,
                }}
              >
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const d = i + 1;
              const c = cellOf(d);
              const inRow0 = c.row === 0;
              const isClick = d === 1 && blueLit;
              const walked = d > 1 && d < 5 && f >= tWalk + (d - 2) * 8;
              const isBuy = d === 5 && f >= tBag;
              if (!inRow0 && dim <= 0) return null;
              return (
                <div
                  key={d}
                  style={{
                    position: "absolute",
                    left: c.x,
                    top: c.y,
                    width: CELL_W,
                    height: CELL_H,
                    borderRadius: 18,
                    border: `4px solid ${C.ink}`,
                    boxSizing: "border-box",
                    background: isClick ? C.blue : isBuy ? "#EDEDF3" : walked ? C.blueSoft : C.paper,
                    opacity: inRow0 ? 1 : dim,
                    boxShadow: d === 1 && d1Glow > 0 ? `0 0 0 ${6 + d1Glow * 8}px ${C.yellow}` : isClick ? `4px 4px 0 ${C.ink}` : undefined,
                    transform: d === 1 && f >= tClickLand ? `scale(${1 + 0.12 * Math.max(0, 1 - clickS) + (f < tClickLand + 10 ? 0.06 * Math.sin(((f - tClickLand) / 10) * Math.PI) : 0)})` : undefined,
                  }}
                >
                  <div style={{ position: "absolute", left: 10, top: 4, fontFamily: FONT.num, fontSize: 36, color: isClick ? C.paper : C.ink }}>{d}</div>
                </div>
              );
            })}
            {/* 👆 lands on 9/1 */}
            {f >= tClick ? (
              <div
                style={{
                  position: "absolute",
                  left: x1 - 10,
                  top: interpolate(f, [tClick, tClickLand], [y1 - 260, y1 - 30], { ...clamp, easing: Easing.in(Easing.quad) }),
                  transform: `scale(${f >= tClickLand ? 1 - 0.15 * Math.sin(Math.min(1, (f - tClickLand) / 6) * Math.PI) : 1})`,
                }}
              >
                <Emoji e="👆" size={66} />
              </div>
            ) : null}
            {/* click ripple */}
            {f >= tClickLand && f < tClickLand + 18 ? (
              <div
                style={{
                  position: "absolute",
                  left: x1 - 70,
                  top: y1 - 70,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  border: `6px solid ${C.blue}`,
                  transform: `scale(${interpolate(f, [tClickLand, tClickLand + 18], [0.6, 1.8])})`,
                  opacity: interpolate(f, [tClickLand, tClickLand + 18], [1, 0]),
                }}
              />
            ) : null}
            {/* dotted walk path 9/1 → 9/5 */}
            {f >= tWalk ? (
              <svg width={1080} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <path
                  d={`M${x1 + 40} ${y1 + 34} L${x1 + 40 + (x5 - 44 - x1 - 40) * interpolate(f, [tWalk, tBag], [0, 1], clamp)} ${y5 + 34}`}
                  stroke={C.ink}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray="1 18"
                  fill="none"
                  opacity={0.55}
                />
              </svg>
            ) : null}
            {[2, 3, 4].map((d, k) => {
              const [cx, cy] = center(d);
              return (
                <Pop key={d} at={tWalk + k * 8} style={{ position: "absolute", left: cx - 26, top: cy - 22 }}>
                  <Emoji e="👣" size={48} style={{ transform: `rotate(90deg) translateX(${Math.sin(f * 0.3 + k) * 2}px)` }} />
                </Pop>
              );
            })}
            {/* 🛍️ at 9/5 (ghost stays after it flies back) */}
            {f >= tBag ? (
              <div
                style={{
                  position: "absolute",
                  left: x5 - 34,
                  top: y5 - 26,
                  transform: `scale(${f < tFly ? bagS : 1})`,
                  opacity: f < tFly ? 1 : 0.28,
                }}
              >
                <Emoji e="🛍️" size={64} />
              </div>
            ) : null}
            {f >= tFly ? (
              <div style={{ position: "absolute", left: x5 - 44, top: y5 - 40, width: 88, height: 88, borderRadius: 44, border: `4px dashed ${C.muted}`, opacity: 0.6 * flyP }} />
            ) : null}
            {/* small tags under the two days */}
            <Pop at={tClickLand + 2} from="down" distance={30} style={{ position: "absolute", left: x1 - 56, top: y1 + CELL_H / 2 + 4 }}>
              <Tag color={C.blue} text={C.paper} size={34}>
                点击
              </Tag>
            </Pop>
            <Pop at={tBag + 4} from="down" distance={30} style={{ position: "absolute", left: x5 - 50, top: y5 + CELL_H / 2 + 4 }}>
              <Tag color="#D9D9E1" size={34} style={{ opacity: f >= tFly ? 0.7 : 1 }}>
                下单
              </Tag>
            </Pop>
            {/* return arc 9/5 → 9/1: dotted trail left behind the flying bag, stays through line 5 */}
            {f >= tFly ? (
              <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {Array.from({ length: 15 }).map((_, k) => {
                  const t = TRAIL_T0 + ((TRAIL_T1 - TRAIL_T0) * k) / 14;
                  if (flyP < t) return null;
                  const [px, py] = arcAt(t);
                  return <circle key={k} cx={px} cy={py} r={8} fill={C.blue} stroke={C.ink} strokeWidth={2.5} />;
                })}
                {flyP >= TRAIL_T1
                  ? (() => {
                      // head sits at the very end of the arc: its tip touches 9/1's bottom-right corner
                      const [tx, ty] = ARC[3];
                      const ux = ARC[3][0] - ARC[2][0];
                      const uy = ARC[3][1] - ARC[2][1];
                      const len = Math.hypot(ux, uy);
                      const ax = tx - (32 * ux) / len;
                      const ay = ty - (32 * uy) / len;
                      const rot = (Math.atan2(uy, ux) * 180) / Math.PI;
                      const pop = springVal(f, tFly + 11, 14);
                      return (
                        <g transform={`translate(${ax} ${ay}) rotate(${rot}) scale(${Math.min(1.2, pop)})`}>
                          <path d="M-6 -22 L30 0 L-6 22 Z" fill={C.blue} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
                        </g>
                      );
                    })()
                  : null}
              </svg>
            ) : null}
            {/* flying bag */}
            {f >= tFly ? (
              <div style={{ position: "absolute", left: bagX - 34, top: bagY - 30, transform: `rotate(${Math.sin(flyP * Math.PI) * -25}deg) scale(${1 + Math.sin(flyP * Math.PI) * 0.25})` }}>
                <Emoji e="🛍️" size={64} />
              </div>
            ) : null}
            {/* big stamp in the cleared space under 9/1, below the return arc */}
            <Stamp at={tStampAt} text="记在 9/1" color={C.blue} size={76} rotate={-8} style={{ left: 70, top: 890 }} />
          </div>

          {/* labels above the calendar */}
          <Pop at={tBlue} from="down" distance={60} style={{ position: "absolute", left: 66, top: 272 }}>
            <div style={{ position: "relative", transform: `scale(${bluePulse})`, transformOrigin: "20% 100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.blue,
                  color: C.paper,
                  fontFamily: FONT.black,
                  fontSize: 42,
                  border: `5px solid ${C.ink}`,
                  borderRadius: 18,
                  padding: "6px 20px 6px 14px",
                  boxShadow: `6px 6px 0 ${C.ink}`,
                  whiteSpace: "nowrap",
                }}
              >
                <Emoji e="👆" size={42} style={{ opacity: 0.6 + 0.4 * Math.abs(Math.sin(f * 0.2)) }} />
                默认记在：点击那天
              </div>
              {/* pointer to 9/1 */}
              <svg width={40} height={30} style={{ position: "absolute", left: x1 - 66 - 20, top: "100%", marginTop: -5, overflow: "visible" }}>
                <path d="M0 0 L20 26 L40 0" fill={C.blue} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              </svg>
              <div style={{ position: "absolute", left: -18, top: -26 }}>
                <Emoji e="📌" size={50} />
              </div>
            </div>
          </Pop>
          <Pop at={tGrey} from="down" distance={60} style={{ position: "absolute", left: x5 - 80, top: 272 }}>
            <div style={{ position: "relative", opacity: greyFade }}>
              <div
                style={{
                  background: "#D9D9E1",
                  color: C.ink,
                  fontFamily: FONT.black,
                  fontSize: 42,
                  border: `5px solid ${C.ink}`,
                  borderRadius: 18,
                  padding: "6px 22px",
                  boxShadow: `6px 6px 0 ${C.ink}`,
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
              >
                不是购买那天
              </div>
              <svg width={40} height={30} style={{ position: "absolute", left: 60, top: "100%", marginTop: -5, overflow: "visible" }}>
                <path d="M0 0 L20 26 L40 0" fill="#D9D9E1" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              </svg>
            </div>
          </Pop>

          {/* 阿冲 with magnifier: 那这单算哪天？ */}
          {f >= tDog && f < tDogOut + 12 ? (
            <div style={{ position: "absolute", inset: 0, transform: `translateY(${dogOut * 500}px)`, opacity: 1 - dogOut }}>
              <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - dogS) * 420 + Math.sin(f * 0.3) * 3}px)` }}>
                <div style={{ position: "absolute", left: dogL, top: dogT, transform: `rotate(${-look * 4}deg)`, transformOrigin: "50% 60%" }}>
                  <MascotFace kind="dog" size={240} talking={dogTalk} mood="normal" />
                </div>
                {/* magnifier held in 阿冲's paw */}
                <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <path d={`M${lensX + 50 * HDX} ${lensY + 50 * HDY} L${pawX} ${pawY}`} stroke={C.ink} strokeWidth={24} strokeLinecap="round" />
                  <path d={`M${lensX + 50 * HDX} ${lensY + 50 * HDY} L${pawX} ${pawY}`} stroke="#8A5A2E" strokeWidth={12} strokeLinecap="round" />
                  <circle cx={lensX} cy={lensY} r={54} fill="rgba(210,232,255,0.35)" stroke={C.ink} strokeWidth={13} />
                  <circle cx={lensX} cy={lensY} r={43} fill="none" stroke="#CFE6FF" strokeWidth={5} />
                  <path d={`M${lensX - 30} ${lensY - 14} A 32 32 0 0 1 ${lensX - 10} ${lensY - 32}`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
                  {/* paw */}
                  <ellipse cx={pawX} cy={pawY} rx={27} ry={24} fill="#F6C98B" stroke={C.ink} strokeWidth={6} />
                  <path d={`M${pawX - 9} ${pawY - 20} L${pawX - 9} ${pawY - 8} M${pawX + 7} ${pawY - 20} L${pawX + 7} ${pawY - 8}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
                </svg>
                {/* ? bubble */}
                <div
                  style={{
                    position: "absolute",
                    left: dogL + 262,
                    top: dogT + 40,
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    background: C.yellow,
                    border: `6px solid ${C.ink}`,
                    boxShadow: `6px 6px 0 ${C.ink}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT.display,
                    fontSize: 84,
                    color: C.ink,
                    transform: `scale(${springVal(f, tDog + 8)}) rotate(${Math.sin(f * 0.2) * 10}deg)`,
                  }}
                >
                  ?
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* =================== CHART PHASE =================== */}
      {f >= tSlide ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${1080 - slideX}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 300,
              width: 960,
              height: 880,
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 34,
              boxShadow: SHADOW,
              boxSizing: "border-box",
            }}
          >
            <div style={{ position: "absolute", left: 30, top: 22, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: FONT.black, fontSize: 46, color: C.ink }}>每日</span>
              <span style={{ fontFamily: FONT.num, fontSize: 46, color: C.blue }}>ROAS</span>
            </div>
          </div>
          {/* axes */}
          <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={`M170 ${BASE_Y - PLOT_H - 20} L170 ${BASE_Y} L1000 ${BASE_Y}`} fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            {/* target line */}
            <path
              d={`M170 ${BASE_Y - PLOT_H * TARGET} L1000 ${BASE_Y - PLOT_H * TARGET}`}
              stroke={C.ink}
              strokeWidth={5}
              strokeDasharray="18 12"
              strokeDashoffset={-f * 0.8}
              opacity={interpolate(f, [tChart + 8, tChart + 16], [0, 0.75], clamp)}
            />
          </svg>
          <div style={{ position: "absolute", left: 78, top: BASE_Y - PLOT_H * TARGET - 26, opacity: interpolate(f, [tChart + 8, tChart + 16], [0, 1], clamp) }}>
            <Tag color={C.paper} size={34}>
              目标
            </Tag>
          </div>
          {/* bars */}
          {OLD.map((h, i) => {
            const s = interpolate(f, [tChart + 6 + i * 2, tChart + 18 + i * 2], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
            const hh = PLOT_H * h * s;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: BAR_X0 + i * BAR_STEP,
                  top: BASE_Y - hh,
                  width: BAR_W,
                  height: hh,
                  background: C.blue,
                  border: hh > 6 ? `5px solid ${C.ink}` : "none",
                  borderBottom: "none",
                  borderRadius: "12px 12px 0 0",
                  boxSizing: "border-box",
                }}
              />
            );
          })}
          {RECENT.map((h, k) => {
            const i = 7 + k;
            const s = interpolate(f, [tChart + 20 + k * 3, tChart + 30 + k * 3], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
            const g = grow(k);
            const baseH = PLOT_H * h * s;
            const addH = PLOT_H * (FILLED[k] - h) * g;
            const hh = baseH + addH;
            const solid = g > 0.02;
            const x = BAR_X0 + i * BAR_STEP + shiver * (k % 2 ? -1 : 1);
            const coinStart = coinT(k);
            const coinY = interpolate(f, [coinStart, coinStart + 12], [470, BASE_Y - PLOT_H * h - 40], { ...clamp, easing: Easing.in(Easing.quad) });
            return (
              <React.Fragment key={i}>
                {/* gap up to the target line while the orders are missing */}
                {gapP > 0 && g < 0.02 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x + 6,
                      top: BASE_Y - PLOT_H * h - 4 - (PLOT_H * (TARGET - h) - 4) * gapP,
                      width: BAR_W - 12,
                      height: (PLOT_H * (TARGET - h) - 4) * gapP,
                      background: `repeating-linear-gradient(-45deg, ${C.red}33 0 8px, transparent 8px 16px)`,
                      backgroundPosition: `0 ${-f * 0.9}px`,
                      borderLeft: `3px dashed ${C.red}88`,
                      borderRight: `3px dashed ${C.red}88`,
                      boxSizing: "border-box",
                    }}
                  />
                ) : null}
                {/* original (short) part of the bar */}
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: BASE_Y - baseH,
                    width: BAR_W,
                    height: baseH,
                    background: solid ? C.blue : `${C.blue}22`,
                    border: `5px ${solid ? "solid" : "dashed"} ${solid ? C.ink : C.blue}`,
                    borderBottom: "none",
                    borderRadius: solid ? 0 : "12px 12px 0 0",
                    boxSizing: "border-box",
                    boxShadow: lowPulse > 0 && !solid ? `0 0 0 ${lowPulse * 6}px ${C.muted}44` : undefined,
                    transform: solid ? undefined : `scale(${dashPulse})`,
                    transformOrigin: "50% 100%",
                  }}
                />
                {/* backfilled part: striped, stacked on top so the growth stays readable */}
                {solid ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: BASE_Y - hh,
                      width: BAR_W,
                      height: addH + 5,
                      background: `repeating-linear-gradient(-45deg, ${C.yellow} 0 10px, #FFE08A 10px 20px)`,
                      border: `5px solid ${C.ink}`,
                      borderRadius: "12px 12px 0 0",
                      boxSizing: "border-box",
                    }}
                  />
                ) : null}
                {/* ⏳ + empty 🛒 while waiting */}
                {f >= tWait && g < 0.5 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x + BAR_W / 2 - 28,
                      top: BASE_Y - PLOT_H * h - 118,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transform: `scale(${waitS * (1 - g * 2)})`,
                      transformOrigin: "50% 100%",
                    }}
                  >
                    <Emoji e="⏳" size={46} style={{ transform: `rotate(${Math.floor((f + k * 11) / 24) % 2 ? 180 : 0}deg) scale(${hourPunch})` }} />
                    <Emoji e="🛒" size={52} style={{ marginTop: 6, transform: `translateY(${Math.sin(f * 0.2 + k) * 3}px)` }} />
                  </div>
                ) : null}
                {/* coin drop */}
                {f >= coinStart && f < coinStart + 14 ? (
                  <div style={{ position: "absolute", left: x + BAR_W / 2 - 30, top: coinY, transform: `scale(${interpolate(f, [coinStart, coinStart + 4], [0.2, 1], clamp)})` }}>
                    <Coin size={60} spin={f * 20} />
                  </div>
                ) : null}
                {/* sparkle when filled */}
                {g > 0 && f < coinStart + 34 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x + BAR_W / 2 - 30,
                      top: BASE_Y - hh - 60,
                      opacity: interpolate(f, [coinStart + 12, coinStart + 18, coinStart + 34], [0, 1, 0], clamp),
                    }}
                  >
                    <Emoji e="✨" size={56} />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {/* x-axis labels */}
          <div style={{ position: "absolute", left: 180, top: BASE_Y + 14, fontFamily: FONT.black, fontSize: 38, color: C.ink, opacity: interpolate(f, [tChart + 10, tChart + 18], [0, 1], clamp) }}>
            点击日期 →
          </div>
          <Pop at={tChart + 30} from="up" distance={30} style={{ position: "absolute", left: BAR_X0 + 7 * BAR_STEP - 6, top: BASE_Y + 12, width: 2 * BAR_STEP + BAR_W + 12 }}>
            <div style={{ borderTop: `5px solid ${C.ink}`, paddingTop: 2, textAlign: "center", fontFamily: FONT.black, fontSize: 36, color: C.ink }}>最近几天</div>
          </Pop>

          {/* bracket: 未回填 → 看起来偏低  /  after a week: 同一天，变高了 */}
          {f >= tBracket ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1300, opacity: Math.min(1, bracketS * 1.5) * bracketO }}>
              <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {(() => {
                  const bx0 = BAR_X0 + 7 * BAR_STEP;
                  const bx1 = BAR_X0 + 9 * BAR_STEP + BAR_W;
                  const by = f >= tGreen ? 596 : 602;
                  const col = f >= tGreen ? C.green : C.muted;
                  return (
                    <path
                      d={`M${bx0} ${by + 22} L${bx0} ${by} L${bx1} ${by} L${bx1} ${by + 22} M${(bx0 + bx1) / 2} ${by} L${(bx0 + bx1) / 2} ${by - 22}`}
                      fill="none"
                      stroke={col}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })()}
              </svg>
              {/* ↓ "looks low", dropped between the bracket and the target line */}
              {f < tGreen && downO > 0 ? (
                <svg
                  width={64}
                  height={84}
                  viewBox="0 0 64 84"
                  style={{
                    position: "absolute",
                    left: (BAR_X0 + 7 * BAR_STEP + BAR_X0 + 9 * BAR_STEP + BAR_W) / 2 - 32,
                    top: 634 + (1 - Math.min(1, downS)) * -50 + Math.abs(Math.sin((f - tLow) * 0.22)) * 12,
                    opacity: downO,
                    overflow: "visible",
                  }}
                >
                  <path d="M20 4 L44 4 L44 44 L60 44 L32 80 L4 44 L20 44 Z" fill="#A9A9B6" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
                </svg>
              ) : null}
              {f < tGreen ? (
                // beat 1 (line start): 未回填 alone, centred over the bracket stem.
                // beat 2 (on 偏低): 未回填 slides left to make room and 「→ 看起来偏低」 lands right-aligned,
                // keeping ≥ 20px (incl. shadow) from the chart panel's right border
                <div style={{ position: "absolute", left: 0, top: 470, width: 1080, height: 76, transform: `scale(${0.6 + 0.4 * bracketS})`, transformOrigin: `${BRACKET_CX}px 100%` }}>
                  <div style={{ position: "absolute", left: noFillCx - 150, top: 0, width: 300, display: "flex", justifyContent: "center" }}>
                    <Tag color="#E4E4EA" size={44} style={{ boxShadow: `5px 5px 0 ${C.ink}`, transform: `scale(${hourPunch > 1 ? 1 + (hourPunch - 1) * 0.3 : 1})` }}>
                      未回填
                    </Tag>
                  </div>
                  {f >= tLow ? (
                    <div
                      style={{
                        position: "absolute",
                        right: LABEL_R,
                        top: 0,
                        opacity: Math.min(1, lowS * 2),
                        // capped (no overshoot) so the chip never swells into the panel border or into 未回填
                        transform: `translateX(${(1 - Math.min(1, lowS)) * 30}px) scale(${0.5 + 0.5 * Math.min(1, lowS)})`,
                        transformOrigin: "50% 50%",
                      }}
                    >
                      <Tag color="#E4E4EA" size={44} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                        → 看起来
                        <span style={{ display: "inline-block", color: C.red, textDecoration: "underline", textDecorationThickness: 4, transform: `scale(${lowPunch})` }}>偏低</span>
                      </Tag>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ position: "absolute", right: LABEL_R, top: 498, transform: `scale(${0.7 + 0.3 * highS})`, transformOrigin: "80% 100%" }}>
                  <Tag color={C.green} text={C.paper} size={40} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                    同一天，变高了 ↑
                  </Tag>
                </div>
              )}
            </div>
          ) : null}

          {/* 一周后 flip card */}
          {f >= tWeek ? (
            <div style={{ position: "absolute", left: 415, top: 318, perspective: 800 }}>
              <div
                style={{
                  width: 250,
                  background: C.paper,
                  border: `${BORDER}px solid ${C.ink}`,
                  borderRadius: 22,
                  boxShadow: `8px 8px 0 ${C.ink}`,
                  overflow: "hidden",
                  transform: `rotateX(${(1 - weekS) * 90}deg) rotate(${3 + Math.sin(f * 0.1) * 2}deg)`,
                  transformOrigin: "50% 0%",
                }}
              >
                <div style={{ height: 30, background: C.red, borderBottom: `5px solid ${C.ink}` }} />
                <div style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink, textAlign: "center", lineHeight: 1.3 }}>一周后</div>
              </div>
            </div>
          ) : null}

          {/* 阿冲 peeking in the corner */}
          {f >= tBracket + 8 ? (
            <div
              style={{
                position: "absolute",
                left: 866,
                top: 1128,
                transform: `translateX(${dogShake}px) translateY(${(1 - springVal(f, tBracket + 8)) * 160}px) rotate(${Math.sin(f * 0.12) * 5 + dogShake * 0.8}deg)`,
              }}
            >
              <MascotFace kind="dog" size={150} mood={f >= tGreen ? "happy" : f >= tLow ? "sad" : "sweat"} />
            </div>
          ) : null}
        </div>
      ) : null}

      <Sfx name="pop" at={tClickLand} volume={0.35} />
      <Sfx name="pop" at={tBag} volume={0.35} />
      <Sfx name="stamp" at={tStampAt} volume={0.4} />
      <Sfx name="pop" at={tWait} volume={0.3} />
      <Sfx name="pop" at={tLow} volume={0.25} />
      <Sfx name="swish" at={tWeek} volume={0.3} />
      <Sfx name="coin" at={coinT(2) + 12} volume={0.3} />
      <Sfx name="sparkle" at={tGreen} volume={0.3} />
    </AbsoluteFill>
  );
};

export default Step1Lag;
