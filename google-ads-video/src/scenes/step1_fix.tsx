import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { clamp, Emoji, Marker, Pop, Sfx, useFloat, useShake, useSpring } from "../components/kit";
import { Panel, Tag } from "../components/Shared";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { Burst, CoveredButton, springVal, swingAfter } from "../components/step1/props";

// ---------- formula geometry (absolute canvas coords, always at the top of the stage) ----------
const ROW1_Y = 268;
const ROW2_Y = 362;
const BLK_H = 78;
const A_W = 520;
const B_W = 136;
const OP_W = 44;
const FG = 16;
const ROW1_X = (1080 - (A_W + FG + OP_W + FG + B_W)) / 2;
const A_X = ROW1_X;
const DIV_X = A_X + A_W + FG;
const B_X = DIV_X + OP_W + FG;
const C_W = 370;
const ROW2_X = (1080 - (OP_W + FG + C_W)) / 2;
const EQ_X = ROW2_X;
const C_X = EQ_X + OP_W + FG;

const TYPED = "时间滞后 ROAS";

// fogged "近期真实表现" chart: enters with line 1 (under the mini calendar) and stays through line 2
const CH_T = 930;
const CH_H = 344;
const CH_BASE = CH_H - 52; // x-axis y inside the chart svg
const CH_PLOT = 200;
const CH_BARS = [0.62, 0.72, 0.6, 0.76, 0.66, 0.7, 0.68];

// mini calendar (line 1) and aligned day rows (line 2)
const MINI_T = 512;
const ROWS_DY = 30;

const Step1Fix: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");
  const catId = idOfKind("cat");

  // ---------- timing ----------
  const tClick = 13;
  const tType0 = 17;
  const tType1 = 50;
  const tPopClose = 58;
  const tCol = w(0, "时间滞后") - 4;
  const tFly = at(1) - 30;
  const tFlyEnd = tFly + 16;
  const aOut = at(1) - 6;
  const tA = w(1, "转化价值") - 6;
  const tMark = w(1, "按转化时间") - 2;
  const tMini = at(1) + 4;
  const tGhost = tMark + 8;
  const tDiv = w(1, "除以") - 4;
  const tB = w(1, "费用") - 6;
  const tShine = tB + 12;
  const miniOut = at(2) - 10;
  const tRows = at(2) - 2;
  // hold the mismatch (with its 错位 tag) first, then one long slide that locks on 「对上」
  const tSnap1 = w(2, "对上") - 2;
  const tSnap0 = Math.min(w(2, "成交") - 4, tSnap1 - 20);
  const tChart = at(1) + 6;
  const tWipe0 = w(2, "看清") - 4;
  const tWipe1 = tWipe0 + 24;
  const cOut = at(3) - 6;
  const tDecide = at(3) - 4;
  const tCheck1 = w(3, "超过目标") - 4;
  const tCheck2 = w(3, "被预算卡住") - 4;
  const tBtn = at(3) + 2;
  const tGreen = tCheck2 + 10;
  const tFlip = tCheck2 + 14;
  const tDog = at(4) - 8;
  const tLift0 = at(5);
  const tLift1 = tLift0 + 14;
  const tLeap = w(5, "放心") - 2;
  const tLand = tLeap + 10;

  // ---------- phase A: report with "+ 自定义列" ----------
  const aOutP = interpolate(f, [aOut, aOut + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const panelS = useSpring(0, { damping: 15 });
  const panelFloat = useFloat(4, 0.07);
  const popS = useSpring(tClick + 1, { damping: 13, stiffness: 220 });
  const popClose = interpolate(f, [tPopClose, tPopClose + 7], [1, 0], clamp);
  const typedN = Math.floor(interpolate(f, [tType0, tType1], [0, TYPED.length], clamp));
  const colS = useSpring(tCol, { damping: 10, stiffness: 200 });
  const flyP = interpolate(f, [tFly, tFlyEnd], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // cursor
  const curX = interpolate(f, [0, tClick - 1], [640, 970], { ...clamp, easing: Easing.out(Easing.cubic) });
  const curY = interpolate(f, [0, tClick - 1], [1200, 663], { ...clamp, easing: Easing.out(Easing.cubic) });
  const curPress = f >= tClick && f < tClick + 5 ? 0.82 : 1;
  const curO = interpolate(f, [tType0 + 4, tType0 + 10], [1, 0], clamp);

  // ---------- formula ----------
  const cLand = useSpring(tFlyEnd, { damping: 10, stiffness: 220 });
  const aDrop = useSpring(tA, { damping: 11, stiffness: 180 });
  const bDrop = useSpring(tB, { damping: 11, stiffness: 180 });
  const divS = useSpring(tDiv, { damping: 10, stiffness: 240 });
  const shineP = interpolate(f, [tShine, tShine + 16], [0, 1], clamp);
  const fBob = useFloat(3, 0.06);
  // line 1 is all about the formula: enlarge it while it is being explained
  const fz = interpolate(f, [at(1) - 8, at(1) + 4, at(2) - 10, at(2) + 2], [1, 1.25, 1.25, 1], clamp);

  // ---------- phase B: mini calendar callback ----------
  const miniS = useSpring(tMini, { damping: 14 });
  const miniO = interpolate(f, [miniOut, miniOut + 8], [1, 0], clamp);
  const ghostS = useSpring(tGhost, { damping: 9, stiffness: 200 });

  // ---------- phase C: aligned day blocks + fog wipe ----------
  const cO = interpolate(f, [cOut, cOut + 9], [1, 0], clamp);
  const snapP = interpolate(f, [tSnap0, tSnap1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const snapBounce = f >= tSnap1 ? Math.exp(-(f - tSnap1) / 4) * Math.sin((f - tSnap1) * 1.4) * 10 : 0;
  const chartS = useSpring(tChart, { damping: 14 });
  const wipeP = interpolate(f, [tWipe0, tWipe1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const catS = useSpring(tWipe1 - 6, { damping: 12 });
  const glint = interpolate(f, [tWipe1 + 2, tWipe1 + 16], [0, 1], clamp);

  // ---------- phase D/E/F: decision card + button ----------
  const decideS = useSpring(tDecide, { damping: 14 });
  const c1 = useSpring(tCheck1, { damping: 9, stiffness: 240 });
  const c2 = useSpring(tCheck2, { damping: 9, stiffness: 240 });
  const budgetFill = interpolate(f, [tCheck2 - 26, tCheck2], [0.15, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const budgetShake = useShake(tCheck2, 14, 6);
  const btnS = useSpring(tBtn, { damping: 13 });
  const green = f >= tGreen;
  const glowPulse = green ? 0.55 + 0.45 * Math.sin((f - tGreen) * 0.2) : 0;
  const signFlip = interpolate(f, [tFlip, tFlip + 10], [0, 1], clamp);
  const cover = interpolate(f, [tLift0, tLift1], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pressed = f < tLand ? 0 : interpolate(f, [tLand, tLand + 3, tLand + 10, tLand + 16], [0, 1, 1, 0.35], clamp);
  const dogS = useSpring(tDog, { damping: 12 });
  const dogTalk = talkingAt(dogId, scene.start + f);
  const signSwing = swingAfter(f, tFlip, 10, 12, 0.5) + Math.sin(f * 0.09) * 2;

  const BTN_SIZE = 400;
  const BTN_L = 170;
  const BTN_TOP = 1282 - BTN_SIZE * 0.82;
  const DOG_SIZE = 210;
  const SIT_X = 660;
  const SIT_Y = 1062;
  const LAND_X = BTN_L + BTN_SIZE / 2 - DOG_SIZE / 2;
  const LAND_Y = BTN_TOP - 84;
  let dogX = SIT_X;
  let dogY = SIT_Y;
  if (f >= tLeap && f < tLand) {
    const p = interpolate(f, [tLeap, tLand], [0, 1], clamp);
    dogX = SIT_X + (LAND_X - SIT_X) * p;
    dogY = SIT_Y + (LAND_Y - SIT_Y) * p - Math.sin(p * Math.PI) * 170;
  } else if (f >= tLand) {
    dogX = LAND_X;
    dogY = LAND_Y + pressed * 42 * (BTN_SIZE / 420) - (f > tLand + 16 ? Math.abs(Math.sin((f - tLand - 16) * 0.28)) * 22 : 0);
  }

  const TYPED_SHOWN = TYPED.slice(0, typedN);

  return (
    <AbsoluteFill>
      {/* =================== FORMULA (always on top) =================== */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${fz}) translateY(${fBob}px)`, transformOrigin: "540px 268px" }}>
        {/* placeholders */}
        <Slot x={A_X} y={ROW1_Y} w={A_W} show={aDrop < 0.5} />
        <Slot x={B_X} y={ROW1_Y} w={B_W} show={bDrop < 0.5} />
        <Slot x={C_X} y={ROW2_Y} w={C_W} show={f < tFlyEnd} />
        {/* operators */}
        <div style={{ ...opStyle, left: DIV_X, top: ROW1_Y, transform: `scale(${f >= tDiv ? divS : 0.8})`, opacity: f >= tDiv ? 1 : 0.35 }}>÷</div>
        <div style={{ ...opStyle, left: EQ_X, top: ROW2_Y, transform: `scale(${f >= tFlyEnd ? cLand : 0.8})`, opacity: f >= tFlyEnd ? 1 : 0.35 }}>=</div>
        {/* A: 转化价值（按转化时间） */}
        {f >= tA ? (
          <Block x={A_X} y={ROW1_Y - (1 - Math.min(1, aDrop)) * 30} w={A_W} bg={C.greenSoft} squash={aDrop} slam>
            转化价值（
            <Marker at={tMark} dur={12}>
              按转化时间
            </Marker>
            ）
          </Block>
        ) : null}
        {/* B: 费用 */}
        {f >= tB ? (
          <Block x={B_X} y={ROW1_Y - (1 - Math.min(1, bDrop)) * 30} w={B_W} bg={C.blueSoft} squash={bDrop} slam>
            费用
          </Block>
        ) : null}
        {/* C: 时间滞后 ROAS (lands from the report) */}
        {f >= tFlyEnd ? (
          <Block x={C_X} y={ROW2_Y} w={C_W} bg={C.yellow} squash={cLand} punch>
            时间滞后 <span style={{ fontFamily: FONT.num, marginLeft: 10 }}>ROAS</span>
          </Block>
        ) : null}
        {/* shine across the assembled formula */}
        {shineP > 0 && shineP < 1 ? (
          <div style={{ position: "absolute", left: A_X - 20, top: ROW1_Y - 10, width: B_X + B_W - A_X + 40, height: ROW2_Y + BLK_H - ROW1_Y + 20, overflow: "hidden", borderRadius: 20 }}>
            <div
              style={{
                position: "absolute",
                top: -40,
                bottom: -40,
                left: `${-20 + shineP * 130}%`,
                width: 80,
                transform: "skewX(-20deg)",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
              }}
            />
          </div>
        ) : null}
      </div>

      {/* =================== PHASE A: report + custom column =================== */}
      {f < aOut + 12 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - aOutP, transform: `translateY(${aOutP * 200}px)` }}>
          <div style={{ position: "absolute", left: 60, top: 510, transform: `translateY(${(1 - panelS) * 260 + panelFloat}px)`, opacity: Math.min(1, panelS * 2) }}>
            <Panel title="Google Ads · 报表" width={960} bodyStyle={{ padding: "22px 28px 28px" }}>
              {/* header */}
              <div style={{ display: "flex", alignItems: "center", height: 80, borderBottom: `4px solid ${C.ink}` }}>
                <HeadCell w={230}>广告系列</HeadCell>
                <HeadCell w={140}>费用</HeadCell>
                <HeadCell w={190}>转化价值</HeadCell>
                <div style={{ width: 332, height: 80, display: "flex", alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
                  {popClose > 0 ? (
                    <div
                      style={{
                        fontFamily: FONT.black,
                        fontSize: 36,
                        color: C.blue,
                        background: f >= tClick ? C.blueSoft : C.paper,
                        border: `4px solid ${C.blue}`,
                        borderRadius: 14,
                        padding: "2px 16px",
                        whiteSpace: "nowrap",
                        // fades out on the same window as the popup (no one-frame pop)
                        opacity: popClose,
                        transform: `scale(${(f >= tClick && f < tClick + 5 ? 0.9 : 1 + 0.04 * Math.sin(f * 0.25)) * (0.8 + 0.2 * popClose)})`,
                        transformOrigin: "100% 50%",
                      }}
                    >
                      + 自定义列
                    </div>
                  ) : null}
                  {f >= tCol ? (
                    <div style={{ position: "absolute", right: 0, top: 40, transform: `translateY(-50%) scale(${colS})`, transformOrigin: "100% 50%", opacity: f >= tFly ? 0.35 : 1 }}>
                      <Tag color={C.yellow} size={36}>
                        时间滞后 <span style={{ fontFamily: FONT.num }}>ROAS</span>
                      </Tag>
                    </div>
                  ) : null}
                </div>
              </div>
              {/* skeleton rows (no numbers) */}
              {[0, 1, 2, 3].map((r) => (
                <div key={r} style={{ display: "flex", alignItems: "center", height: 86, borderBottom: r < 3 ? `3px solid #E6E6EE` : undefined }}>
                  {[230, 140, 190].map((cw, c) => (
                    <div key={c} style={{ width: cw }}>
                      <div style={{ width: cw * (0.45 + 0.35 * random(`sk${r}${c}`)), height: 24, borderRadius: 12, background: "#E3E3EA" }} />
                    </div>
                  ))}
                  <div style={{ width: 332, display: "flex", justifyContent: "flex-end" }}>
                    {f >= tCol ? (
                      <div
                        style={{
                          width: 220 * Math.min(1, colS),
                          height: 22,
                          borderRadius: 11,
                          background: C.yellow,
                          opacity: 0.35 + 0.3 * Math.abs(Math.sin(f * 0.15 + r)),
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </Panel>
            {/* popup: new custom column */}
            {f >= tClick + 1 && popClose > 0 ? (
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  top: 250,
                  width: 580,
                  transform: `scale(${Math.min(popS, 1) * popClose + (1 - popClose) * 0.6})`,
                  opacity: popClose,
                  transformOrigin: "85% 0%",
                  background: C.paper,
                  border: `${BORDER}px solid ${C.ink}`,
                  borderRadius: 24,
                  boxShadow: SHADOW,
                  padding: "18px 24px 22px",
                }}
              >
                <div style={{ fontFamily: FONT.bold, fontSize: 34, color: C.muted, marginBottom: 10 }}>新建自定义列 · 列名</div>
                <div
                  style={{
                    height: 84,
                    border: `4px solid ${C.blue}`,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 18px",
                    background: "#F7FAFF",
                  }}
                >
                  {TYPED_SHOWN.split("").map((ch, i) => (
                    <span key={i} style={{ fontFamily: /[A-Z]/.test(ch) ? FONT.num : FONT.black, fontSize: 46, color: C.ink, whiteSpace: "pre" }}>
                      {ch}
                    </span>
                  ))}
                  <span style={{ width: 5, height: 52, background: C.ink, marginLeft: 4, opacity: Math.floor(f / 8) % 2 ? 0 : 1 }} />
                  {typedN >= TYPED.length ? (
                    <span style={{ marginLeft: "auto" }}>
                      <Emoji e="✅" size={46} />
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          {/* click ripple on the button corner */}
          {f >= tClick && f < tClick + 14 ? (
            <div
              style={{
                position: "absolute",
                left: curX + 5 - 40,
                top: curY + 5 - 40,
                width: 80,
                height: 80,
                borderRadius: 40,
                border: `6px solid ${C.blue}`,
                boxSizing: "border-box",
                transform: `scale(${interpolate(f, [tClick, tClick + 14], [0.3, 1.5], clamp)})`,
                opacity: interpolate(f, [tClick, tClick + 14], [1, 0], clamp),
              }}
            />
          ) : null}
          {/* mouse cursor */}
          {curO > 0 ? (
            <svg
              width={70}
              height={80}
              viewBox="0 0 28 32"
              style={{ position: "absolute", left: curX, top: curY, opacity: curO, transform: `scale(${curPress})`, transformOrigin: "0 0" }}
            >
              <path d="M2 2 L2 26 L8 20 L12 30 L17 28 L13 18 L22 18 Z" fill={C.paper} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
            </svg>
          ) : null}
          <Sfx name="click" at={tClick} volume={0.5} />
          <Sfx name="pop" at={tCol} volume={0.35} />
        </div>
      ) : null}

      {/* flying column name → formula result slot */}
      {f >= tFly && f < tFlyEnd ? (
        (() => {
          const sx = 60 + 960 - 28 - 6 - 150; // header chip center (approx)
          const sy = 510 + 76 + 22 + 40;
          const ex = C_X + C_W / 2;
          const ey = ROW2_Y + BLK_H / 2;
          const x = sx + (ex - sx) * flyP;
          const y = sy + (ey - sy) * flyP - Math.sin(flyP * Math.PI) * 90;
          return (
            <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${1 + 0.2 * flyP}) rotate(${Math.sin(flyP * Math.PI) * -8}deg)` }}>
              <Tag color={C.yellow} size={36} style={{ boxShadow: `6px 6px 0 ${C.ink}` }}>
                时间滞后 <span style={{ fontFamily: FONT.num }}>ROAS</span>
              </Tag>
            </div>
          );
        })()
      ) : null}

      {/* =================== PHASE B: mini calendar callback =================== */}
      {f >= tMini && f < miniOut + 10 ? (
        <div style={{ position: "absolute", left: 60, top: MINI_T, width: 960, opacity: miniO, transform: `translateY(${(1 - miniS) * 400}px)` }}>
          <div
            style={{
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: SHADOW,
              padding: "16px 24px 24px",
              position: "relative",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontSize: 52, color: C.ink, lineHeight: 1.1, marginBottom: 6 }}>9月</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              {["一", "二", "三", "四", "五", "六", "日"].map((d, i) => (
                <div key={d} style={{ width: 120, textAlign: "center", fontFamily: FONT.black, fontSize: 34, color: i >= 5 ? C.red : C.muted }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const isClick = d === 1;
                const isBuy = d === 5;
                const lit = isBuy && f >= tGhost;
                return (
                  <div
                    key={d}
                    style={{
                      position: "relative",
                      width: 120,
                      height: 116,
                      borderRadius: 18,
                      border: `4px solid ${C.ink}`,
                      boxSizing: "border-box",
                      background: isClick ? C.blueSoft : lit ? C.yellowSoft : C.paper,
                      boxShadow: lit ? `0 0 0 ${6 + 6 * Math.abs(Math.sin((f - tGhost) * 0.2))}px ${C.yellow}` : undefined,
                      transform: lit ? `scale(${1 + 0.1 * Math.max(0, 1 - ghostS) + 0.04})` : undefined,
                      zIndex: lit ? 2 : 1,
                    }}
                  >
                    <div style={{ position: "absolute", left: 10, top: 4, fontFamily: FONT.num, fontSize: 34, color: C.ink }}>{d}</div>
                    {isClick ? (
                      <div style={{ position: "absolute", right: 8, bottom: 6, opacity: 0.5 }}>
                        <Emoji e="👆" size={50} />
                      </div>
                    ) : null}
                    {isBuy ? (
                      <div style={{ position: "absolute", right: 6, bottom: 4, opacity: lit ? 1 : 0.28, transform: `scale(${lit ? 0.9 + 0.3 * ghostS : 1})` }}>
                        <Emoji e="🛍️" size={60} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          {/* label under 9/5 */}
          <Pop at={tMini + 10} from="up" distance={40} style={{ position: "absolute", left: 24 + 60, top: 308 }}>
            <div style={{ transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: f >= tGhost ? 0.6 : 1 }}>
              <svg width={40} height={26} style={{ overflow: "visible", marginBottom: -4 }}>
                <path d="M0 26 L20 0 L40 26" fill={C.blueSoft} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              </svg>
              <Tag color={C.blueSoft} size={38}>
                点击那天
              </Tag>
            </div>
          </Pop>
          <Pop at={tGhost + 6} from="up" distance={40} style={{ position: "absolute", left: 24 + 4 * 130 + 60, top: 308 }}>
            <div style={{ transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <svg width={40} height={26} style={{ overflow: "visible", marginBottom: -4 }}>
                <path d="M0 26 L20 0 L40 26" fill={C.yellow} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              </svg>
              <Tag color={C.yellow} size={42} style={{ boxShadow: `6px 6px 0 ${C.ink}` }}>
                按转化时间 = 下单那天
              </Tag>
            </div>
          </Pop>
          <Sfx name="sparkle" at={tGhost} volume={0.3} />
        </div>
      ) : null}

      {/* =================== PHASE C: align day blocks + fog wipe =================== */}
      {f >= tRows && f < cOut + 10 ? (
        <div style={{ position: "absolute", inset: 0, opacity: cO }}>
          <Pop at={tRows} from="left" distance={80} style={{ position: "absolute", left: 90, top: 474 + ROWS_DY }}>
            <Tag color={C.blue} text={C.paper} size={38}>
              每天花费
            </Tag>
          </Pop>
          <Pop at={tRows + 8} from="left" distance={80} style={{ position: "absolute", left: 90, top: 772 + ROWS_DY }}>
            <Tag color={C.green} text={C.paper} size={38}>
              当天实际成交金额
            </Tag>
          </Pop>
          {[1, 2, 3, 4, 5, 6, 7].map((d, i) => {
            const x = 90 + i * 130;
            return (
              <Pop key={d} at={tRows + 2 + i * 2} style={{ position: "absolute", left: x, top: 540 + ROWS_DY }}>
                <DayBlock label={`9/${d}`} bg={C.blueSoft} />
              </Pop>
            );
          })}
          {/* sales row starts shifted by 4 days (9/1 under 9/5, the calendar example), then slides into place */}
          <div style={{ position: "absolute", left: 60, top: 640 + ROWS_DY, width: 972, height: 130 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((d, i) => {
              const x = 30 + i * 130;
              const shift = (1 - snapP) * 4 * 130 + (f >= tSnap1 ? snapBounce : 0);
              // blocks pushed past the right edge fade out instead of being cut by a hard wall
              const edgeO = interpolate(60 + x + shift, [880, 960], [1, 0], clamp);
              if (edgeO <= 0) return null;
              return (
                <Pop key={d} at={tRows + 10 + i * 2} style={{ position: "absolute", left: x + shift, top: 18 }}>
                  <div style={{ opacity: edgeO }}>
                    <DayBlock label={`9/${d}`} bg={C.greenSoft} tilt={(1 - snapP) * (i % 2 ? 4 : -4)} />
                  </div>
                </Pop>
              );
            })}
          </div>
          {/* grey 错位 tag in the empty left end of the shifted row (neutral, not red) */}
          {f >= tRows + 14 && snapP < 0.4 ? (
            <div
              style={{
                position: "absolute",
                left: 150,
                top: 640 + ROWS_DY + 36,
                opacity: interpolate(snapP, [0, 0.35], [1, 0], clamp),
                transform: `scale(${springVal(f, tRows + 14, 18)}) rotate(${-4 + Math.sin(f * 0.2) * 3}deg)`,
              }}
            >
              <Tag color="#D9D9E1" size={42} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                错位 ⇢
              </Tag>
            </div>
          ) : null}
          {/* ✅ once aligned */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) =>
            f >= tSnap1 + 2 + i * 3 ? (
              <div key={i} style={{ position: "absolute", left: 90 + i * 130 + 80, top: 618 + ROWS_DY, transform: `scale(${springVal(f, tSnap1 + 2 + i * 3, 20)})` }}>
                <Emoji e="✅" size={48} />
              </div>
            ) : null,
          )}
          <Sfx name="pop" at={tSnap1} volume={0.5} />
        </div>
      ) : null}

      {/* =================== fogged chart: in with line 1, cleared on 「看清」 =================== */}
      {f >= tChart && f < cOut + 10 ? (
        <div style={{ position: "absolute", inset: 0, opacity: cO }}>

          {/* chart with fog */}
          {f >= tChart ? (
            <div
              style={{
                position: "absolute",
                left: 60,
                top: CH_T,
                width: 960,
                height: CH_H,
                // grows from its bottom edge: never dips into the caption zone, never overshoots onto the tag above
                transform: `scale(${Math.min(1, 0.55 + 0.45 * chartS)})`,
                transformOrigin: "50% 100%",
                opacity: Math.min(1, chartS * 2),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: C.paper,
                  border: `${BORDER}px solid ${C.ink}`,
                  borderRadius: 30,
                  boxShadow: SHADOW,
                  overflow: "hidden",
                }}
              >
                {/* chart content */}
                <svg width={948} height={CH_H - 12} style={{ position: "absolute", left: 0, top: 0 }}>
                  <path d={`M70 76 L70 ${CH_BASE} L900 ${CH_BASE}`} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={`M70 ${CH_BASE - 120} L900 ${CH_BASE - 120}`} stroke={C.ink} strokeWidth={4} strokeDasharray="16 12" opacity={0.6} />
                  {CH_BARS.map((h, i) => (
                    <rect key={i} x={110 + i * 112} y={CH_BASE - CH_PLOT * h} width={66} height={CH_PLOT * h} rx={10} fill={C.blue} stroke={C.ink} strokeWidth={5} />
                  ))}
                  <path
                    d={CH_BARS.map((h, i) => `${i ? "L" : "M"}${143 + i * 112} ${CH_BASE - CH_PLOT * h + 1}`).join(" ")}
                    fill="none"
                    stroke={C.green}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* fog: cleared from left to right */}
                <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${wipeP * 100}%)` }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(236,238,244,0.82)" }} />
                  {[0, 1, 2, 3, 4, 5].map((k) => (
                    <div
                      key={k}
                      style={{
                        position: "absolute",
                        left: -80 + k * 180 + Math.sin(f * 0.05 + k) * 30,
                        top: 40 + (k % 2) * 100 + Math.cos(f * 0.06 + k) * 16,
                        width: 320,
                        height: 200,
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0) 70%)",
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: CH_H / 2 - 56,
                      textAlign: "center",
                      fontFamily: FONT.display,
                      fontSize: 80,
                      color: C.muted,
                      opacity: 0.8,
                    }}
                  >
                    ？？？
                  </div>
                </div>
              </div>
              {/* label */}
              <div style={{ position: "absolute", left: 24, top: 18 }}>
                {f >= tWipe1 - 4 ? (
                  <div style={{ transform: `scale(${springVal(f, tWipe1 - 4, 20)})`, transformOrigin: "0 50%" }}>
                    <Tag color={C.yellow} size={42} style={{ boxShadow: `5px 5px 0 ${C.ink}` }}>
                      近期真实表现
                    </Tag>
                  </div>
                ) : null}
              </div>
              {/* sponge */}
              {f >= tWipe0 - 4 && f < tWipe1 + 8 ? (
                <div
                  style={{
                    position: "absolute",
                    left: -40 + wipeP * 870,
                    top: CH_H / 2 - 60 + Math.sin(f * 0.9) * 60,
                    opacity: interpolate(f, [tWipe0 - 4, tWipe0, tWipe1 + 2, tWipe1 + 8], [0, 1, 1, 0], clamp),
                    transform: `rotate(${Math.sin(f * 0.9) * 18}deg)`,
                  }}
                >
                  <Emoji e="🧽" size={110} />
                </div>
              ) : null}
              {/* 欧姐 peeks with a glasses glint */}
              {f >= tWipe1 - 6 ? (
                <div style={{ position: "absolute", right: 22, top: 18, transform: `translateY(${(1 - catS) * 60}px)`, opacity: Math.min(1, catS * 2) }}>
                  <MascotFace kind="cat" size={130} glint={glint} mood="smug" talking={talkingAt(catId, scene.start + f) * 0.5} />
                </div>
              ) : null}
            </div>
          ) : null}
          <Sfx name="swish" at={tWipe0} volume={0.35} />
        </div>
      ) : null}

      {/* =================== button (drawn under the decision card so the lifting cover slides behind it) =================== */}
      {f >= tBtn ? (
        <div
          style={{
            position: "absolute",
            left: BTN_L,
            top: BTN_TOP,
            transform: `translateY(${(1 - btnS) * 60}px) scale(${0.4 + 0.6 * btnS})`,
            transformOrigin: "50% 100%",
            opacity: Math.min(1, btnS * 2),
          }}
        >
          <CoveredButton
            size={BTN_SIZE}
            cover={cover}
            pressed={pressed}
            tone={green ? "green" : "red"}
            glow={green ? glowPulse + (f >= tLand ? 0.4 : 0) : 0}
            swing={signSwing}
            sign={signFlip < 0.5 ? "还没排查" : "已排查 ✓"}
            signColor={signFlip < 0.5 ? C.yellow : C.green}
            signTextColor={signFlip < 0.5 ? C.ink : C.paper}
            signFlip={signFlip}
          />
        </div>
      ) : null}
      {/* confetti: above the button, below the opaque decision card so it never covers its text */}
      <Burst at={tLand} x={BTN_L + BTN_SIZE / 2} y={BTN_TOP + 80} seed="s1fix" n={46} coins={12} power={30} dur={56} spread={75} />
      {/* =================== PHASE D: decision card =================== */}
      {f >= tDecide ? (
        <div style={{ position: "absolute", left: 60, top: 496, width: 960, transform: `scale(${0.6 + 0.4 * decideS})`, opacity: Math.min(1, decideS * 2), transformOrigin: "50% 0%" }}>
          <div
            style={{
              background: C.paper,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: SHADOW,
              padding: "22px 30px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <CheckRow checked={c1} on={f >= tCheck1}>
              <span style={{ fontFamily: FONT.num, marginRight: 16 }}>ROAS</span>超过目标
            </CheckRow>
            <CheckRow checked={c2} on={f >= tCheck2} height={184}>
              被预算卡住
              {/* mini budget bar pushing against its ceiling */}
              <div style={{ marginLeft: "auto", position: "relative", width: 330, height: 184, transform: `translateX(${budgetShake}px)` }}>
                {/* ceiling */}
                <div style={{ position: "absolute", left: 0, right: 0, top: 30, borderTop: `7px dashed ${C.red}` }} />
                <div style={{ position: "absolute", right: 0, top: 30 - 27 }}>
                  <Tag color={C.redSoft} size={34}>
                    上限
                  </Tag>
                </div>
                {/* budget bar */}
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    bottom: 50,
                    width: 128,
                    height: 97 * budgetFill,
                    background: C.orange,
                    border: `6px solid ${C.ink}`,
                    borderRadius: "14px 14px 4px 4px",
                    boxSizing: "border-box",
                    transformOrigin: "50% 100%",
                    transform: f >= tCheck2 ? `scale(${1 + 0.08 * Math.exp(-(f - tCheck2) / 5)}, ${1 - 0.08 * Math.exp(-(f - tCheck2) / 5)})` : undefined,
                  }}
                />
                <div style={{ position: "absolute", left: 14, bottom: 44, width: 148, height: 7, background: C.ink, borderRadius: 4 }} />
                <div style={{ position: "absolute", left: 24, bottom: -2, width: 128, textAlign: "center", fontFamily: FONT.black, fontSize: 36, lineHeight: 1.25, color: C.ink }}>
                  预算
                </div>
                {f >= tCheck2 && f < tCheck2 + 18 ? (
                  <div style={{ position: "absolute", left: 60, top: -34, transform: `scale(${springVal(f, tCheck2, 14)})` }}>
                    <Emoji e="💢" size={56} />
                  </div>
                ) : null}
              </div>
            </CheckRow>
          </div>
          <Sfx name="pop" at={tCheck1} volume={0.45} />
          <Sfx name="pop" at={tCheck2} volume={0.45} />
        </div>
      ) : null}

      {/* =================== 阿冲 =================== */}
      {f >= tDog ? (
        <>
          <div
            style={{
              position: "absolute",
              left: dogX,
              top: dogY,
              transform: `translateX(${(1 - dogS) * 500}px) rotate(${f < tLeap ? -6 + Math.sin(f * 0.25) * 3 : f < tLand ? -20 : Math.sin(f * 0.3) * 6}deg)`,
            }}
          >
            <MascotFace kind="dog" size={DOG_SIZE} talking={dogTalk} mood={f < tLift0 ? "money" : "happy"} />
          </div>
          {f < tLeap ? (
            <>
              <div style={{ position: "absolute", left: dogX + 70, top: dogY + 146, transform: `translateX(${(1 - dogS) * 500}px) rotate(${Math.sin(f * 0.3) * 6}deg)` }}>
                <Emoji e="🙏" size={76} />
              </div>
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: dogX + [-20, 180, 200][k],
                    top: dogY + [10, -10, 110][k],
                    opacity: dogS * (0.4 + 0.6 * Math.abs(Math.sin(f * 0.2 + k * 1.3))),
                    transform: `scale(${0.7 + 0.4 * Math.abs(Math.sin(f * 0.2 + k * 1.3))})`,
                  }}
                >
                  <Emoji e="✨" size={50} />
                </div>
              ))}
            </>
          ) : null}
        </>
      ) : null}
      <Sfx name="swish" at={tLift0 + 2} volume={0.3} />
      <Sfx name="sparkle" at={tLand} volume={0.4} />
    </AbsoluteFill>
  );
};

const opStyle: React.CSSProperties = {
  position: "absolute",
  width: OP_W,
  height: BLK_H,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: FONT.num,
  fontSize: 64,
  color: C.ink,
};

const Slot: React.FC<{ x: number; y: number; w: number; show: boolean }> = ({ x, y, w, show }) => {
  const f = useCurrentFrame();
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: BLK_H,
        border: `4px dashed ${C.muted}`,
        borderRadius: 18,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.display,
        fontSize: 48,
        color: C.muted,
        opacity: 0.45 + 0.15 * Math.sin(f * 0.15),
      }}
    >
      ?
    </div>
  );
};

const Block: React.FC<{ x: number; y: number; w: number; bg: string; squash: number; punch?: boolean; slam?: boolean; children: React.ReactNode }> = ({
  x,
  y,
  w,
  bg,
  squash,
  punch,
  slam,
  children,
}) => {
  // squash: spring progress 0..1 (overshoots) → slight squash on landing
  const over = Math.max(0, squash - 1);
  const sc = punch ? 0.6 + 0.4 * Math.min(squash, 1.2) : slam ? 1 + 0.35 * Math.max(0, 1 - squash) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: BLK_H,
        background: bg,
        border: `5px solid ${C.ink}`,
        borderRadius: 18,
        boxShadow: `6px 6px 0 ${C.ink}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.black,
        fontSize: 42,
        color: C.ink,
        whiteSpace: "nowrap",
        transform: `scale(${sc * (1 + over * 0.6)}, ${sc * (1 - over * 0.8)})`,
        transformOrigin: "50% 100%",
        opacity: slam ? Math.min(1, squash * 2.5) : 1,
      }}
    >
      {children}
    </div>
  );
};

const HeadCell: React.FC<{ w: number; children: React.ReactNode }> = ({ w, children }) => (
  <div style={{ width: w, fontFamily: FONT.black, fontSize: 36, color: C.ink, whiteSpace: "nowrap" }}>{children}</div>
);

const DayBlock: React.FC<{ label: string; bg: string; tilt?: number }> = ({ label, bg, tilt = 0 }) => (
  <div
    style={{
      width: 120,
      height: 96,
      background: bg,
      border: `5px solid ${C.ink}`,
      borderRadius: 18,
      boxShadow: `5px 5px 0 ${C.ink}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT.num,
      fontSize: 36,
      color: C.ink,
      transform: `rotate(${tilt}deg)`,
    }}
  >
    {label}
  </div>
);

const CheckRow: React.FC<{ checked: number; on: boolean; height?: number; children: React.ReactNode }> = ({ checked, on, height = 118, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 26, height }}>
    <div
      style={{
        width: 92,
        height: 92,
        flex: "0 0 92px",
        borderRadius: 20,
        border: `6px solid ${C.ink}`,
        background: on ? C.green : C.paper,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `5px 5px 0 ${C.ink}`,
      }}
    >
      {on ? (
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: `scale(${checked})` }}>
          <path d="M12 34 L27 48 L53 16" fill="none" stroke={C.paper} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: FONT.black, fontSize: 58, color: C.ink, whiteSpace: "nowrap", opacity: on ? 1 : 0.55 }}>{children}</div>
  </div>
);

export default Step1Fix;
