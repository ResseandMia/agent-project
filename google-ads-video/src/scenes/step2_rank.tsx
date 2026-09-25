import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { clamp, Emoji, Sfx } from "../components/kit";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { JamPipe, punch, sp } from "../components/step2/props";

const ORANGE = CHAPTER_COLOR["第2步"];

// equation blocks (absolute)
const EQ_TOP = 300;
const EQ_H = 180;
const EQ_DROP = 200; // extra y offset of the equation while it is being built (line 1)
const BID = { l: 66, w: 222 };
const QUA = { l: 356, w: 284 };
const RNK = { l: 710, w: 304 };
const OPS = { plus: 322, eq: 675 }; // centre x of + and =

// branches
const LX = 300;
const RX = 790;
const BR_TOP = 548;

// rank board
const RB = { l: 60, t: 808, w: 960 };
const ROW_H = 62;
const ROW_GAP = 10;
const HEAD_H = 66;

// pipe (line 4)
const PIPE_TOP = 556;

const Step2Rank: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");

  // ---------------- timing ----------------
  const FLY = at(1) - 6;
  const T_RNK = FLY + 9; // the flying words become the block
  const T_EQ = w(1, "等于") - 3;
  const T_BID = w(1, "出价") - 4;
  // formula skeleton 「[?] + [?] = 广告评级」 lands with 「等于」, so it never reads as 「广告评级 = 出价」 while 出价 is spoken
  const SLOT_BID = T_EQ + 3;
  const T_PLUS = T_EQ + 5;
  const SLOT_QUA = T_EQ + 7;
  const T_QUA = w(1, "广告质量") - 4;
  const T_NOTE = T_EQ + 10;
  const RANK_IN = T_EQ + 4; // board + our #4 card are on screen while 「等于出价加广告质量」 is spoken
  const BR = at(2) - 8;
  const B_QS = w(2, "质量得分") - 3;
  const B_LP = w(2, "着陆页体验") - 3;
  const R_ON = at(3) - 4;
  const B_FEED = w(3, "商品") - 3;
  const PIPE_IN = at(4) - 6;
  const UPBID = w(4, "提高出价") - 4;
  const CL1 = UPBID + 10;
  const UPQ = w(4, "广告和着陆页质量") - 4;
  const CL2 = UPQ + 16;
  const UNCLOG = CL2 + 8;
  const EQ_UP = BR - 12; // equation is built low (y≈500–680) during line 1, then glides up before the branches draw

  // ---------------- phase A: 阿冲 spinning under 「广告评级？」 ----------------
  const dogTalk = talkingAt(dogId, scene.start + f);
  const aIn = sp(f, 0, { damping: 12 });
  const aOut = interpolate(f, [FLY, FLY + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const spin = interpolate(f, [at(0) + 4, endAt0(at, w)], [0, Math.PI * 3], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const flyP = interpolate(f, [FLY, FLY + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rays = interpolate(f, [0, 6, FLY, FLY + 10], [0, 1, 1, 0], clamp);

  // ---------------- levels ----------------
  const bidLvl = 2 + (f >= UPBID ? 1 : 0) + (f >= UPBID + 6 ? 1 : 0);
  const qLvl = 2 + (f >= UPQ ? 1 : 0) + (f >= UPQ + 5 ? 1 : 0) + (f >= UPQ + 10 ? 1 : 0);
  const rankFill = interpolate(f, [UPBID, UPBID + 10, UPQ, UPQ + 14], [0.4, 0.62, 0.62, 0.92], clamp);

  // ---------------- phase E ----------------
  const brOut = interpolate(f, [PIPE_IN - 4, PIPE_IN + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const pipeS = sp(f, PIPE_IN + 2, { damping: 14, stiffness: 120 });
  const flowGlow = f >= UNCLOG ? interpolate(f, [UNCLOG, UNCLOG + 6], [0, 1], clamp) : 0;
  const eqDrop = interpolate(sp(f, EQ_UP, { damping: 15, stiffness: 150 }), [0, 1], [EQ_DROP, 0]);

  // rank slots
  const s1 = sp(f, CL1, { damping: 13, stiffness: 150 });
  const s2 = sp(f, CL2, { damping: 13, stiffness: 150 });
  const slotOf = (card: number) => {
    if (card === 3) return 3 - s1 - s2;
    if (card === 2) return 2 + s1;
    if (card === 1) return 1 + s2;
    return card;
  };
  const rankIn = sp(f, RANK_IN, { damping: 15, stiffness: 120 });
  const climbing = (f >= CL1 && f < CL1 + 16) || (f >= CL2 && f < CL2 + 16);
  const dogMood = f >= UNCLOG ? "money" : f >= CL1 ? "happy" : "sweat";

  return (
    <AbsoluteFill>
      {/* ================= phase A ================= */}
      {rays > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: 760 - 560,
            width: 1120,
            height: 1120,
            borderRadius: "50%",
            opacity: rays * 0.9,
            background: `repeating-conic-gradient(from ${f * 0.8}deg, ${C.orangeSoft} 0deg 9deg, transparent 9deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 28%, transparent 66%)",
            maskImage: "radial-gradient(circle, black 28%, transparent 66%)",
          }}
        />
      ) : null}
      {f < FLY + 14 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 540 - 150,
              top: 760 + aOut * 380,
              transform: `scale(${aIn * (1 - aOut * 0.8)})`,
              transformOrigin: "50% 50%",
              opacity: 1 - aOut,
            }}
          >
            <div style={{ transform: `scaleX(${Math.cos(spin)}) rotate(${Math.sin(f * 0.3) * 6}deg)` }}>
              <MascotFace kind="dog" size={300} talking={dogTalk} mood={f < at(0) + 8 ? "shock" : "dizzy"} />
            </div>
          </div>
          {/* orbiting question marks */}
          {[0, 1, 2].map((i) => {
            const a = f * 0.16 + (i * Math.PI * 2) / 3;
            const x = 540 + Math.cos(a) * 210;
            const y = 800 + Math.sin(a) * 60;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - 30,
                  top: y - 50,
                  fontFamily: FONT.display,
                  fontSize: 90,
                  color: i === 1 ? C.ink : ORANGE,
                  textShadow: `3px 3px 0 ${i === 1 ? C.paper : C.ink}`,
                  transform: `scale(${sp(f, at(0) + 4 + i * 4, { damping: 9 }) * (Math.sin(a) > 0 ? 1.1 : 0.8)}) rotate(${Math.sin(a) * 15}deg)`,
                  opacity: 1 - aOut,
                  zIndex: Math.sin(a) > 0 ? 3 : 1,
                }}
              >
                ?
              </div>
            );
          })}
        </>
      ) : null}
      {/* 「广告评级」 words: above his head, then fly into the 🏆 block */}
      {f < FLY + 13 ? (
        <div
          style={{
            position: "absolute",
            left: interpolate(flyP, [0, 1], [540, RNK.l + RNK.w / 2]),
            top: interpolate(flyP, [0, 1], [610, EQ_TOP + 128 + EQ_DROP]),
            transform: `translate(-50%, -50%) scale(${interpolate(flyP, [0, 1], [1, 0.4]) * sp(f, at(0) - 2, { damping: 10 })}) rotate(${(1 - flyP) * Math.sin(f * 0.2) * 4}deg)`,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          <span style={{ fontFamily: FONT.display, fontSize: 124, color: C.ink, textShadow: `5px 5px 0 ${C.orangeSoft}` }}>广告评级</span>
          <span style={{ fontFamily: FONT.display, fontSize: 124, color: ORANGE, opacity: 1 - flyP, textShadow: `4px 4px 0 ${C.ink}` }}>？</span>
        </div>
      ) : null}

      {/* ================= equation ================= */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${eqDrop}px)` }}>
      <Block at={T_RNK} x={RNK.l} w={RNK.w} bg={ORANGE} emoji="🏆" label="广告评级" light morph pulse={[CL1, CL2]}>
        <LevelBar p={rankFill} />
      </Block>
      <Op at={T_EQ} x={OPS.eq} ch="=" />
      <Slot at={SLOT_BID} until={T_BID + 4} x={BID.l} w={BID.w} />
      <Slot at={SLOT_QUA} until={T_QUA + 4} x={QUA.l} w={QUA.w} />
      <Block at={T_BID} x={BID.l} w={BID.w} bg={C.yellowSoft} emoji="💰" label="出价" pulse={[UPBID]}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 12 + i * 4,
                alignSelf: "flex-end",
                borderRadius: 5,
                border: `3px solid ${C.ink}`,
                background: i < bidLvl ? C.green : C.paper,
                transform: `scale(${i >= 2 && i < bidLvl ? punch(f, UPBID + (i - 2) * 6, 0.5, 4) : 1})`,
              }}
            />
          ))}
        </div>
      </Block>
      <Op at={T_PLUS} x={OPS.plus} ch="+" />
      <Block at={T_QUA} x={QUA.l} w={QUA.w} bg={C.blueSoft} emoji="⭐" label="广告质量" pulse={[B_QS, B_LP, B_FEED, UPQ, UPQ + 10]}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} on={i < qLvl} s={i >= 2 && i < qLvl ? punch(f, UPQ + (i - 2) * 5, 0.6, 4) : 1} />
          ))}
        </div>
      </Block>
      {/* bid up sticker */}
      {f >= UPBID ? (
        <div
          style={{
            position: "absolute",
            left: BID.l + BID.w - 56,
            top: EQ_TOP - 30 + Math.sin(f * 0.25) * 6,
            transform: `scale(${sp(f, UPBID, { damping: 8, stiffness: 240 })}) rotate(10deg)`,
          }}
        >
          <UpBadge />
        </div>
      ) : null}
      {f >= UPQ + 10 ? (
        <div
          style={{
            position: "absolute",
            left: QUA.l + QUA.w - 56,
            top: EQ_TOP - 30 + Math.sin(f * 0.25 + 1) * 6,
            transform: `scale(${sp(f, UPQ + 10, { damping: 8, stiffness: 240 })}) rotate(10deg)`,
          }}
        >
          <UpBadge />
        </div>
      ) : null}
      {/* （简化理解） */}
      {f >= T_NOTE ? (
        <div
          style={{
            position: "absolute",
            left: RNK.l + 40,
            top: EQ_TOP - 52,
            transform: `scale(${sp(f, T_NOTE, { damping: 10 })}) rotate(-3deg)`,
            transformOrigin: "50% 100%",
            fontFamily: FONT.bold,
            fontSize: 34,
            lineHeight: 1.2,
            color: C.muted,
            background: "#ECECF0",
            border: `3px solid #A9A9B6`,
            borderRadius: 12,
            padding: "0 12px",
            whiteSpace: "nowrap",
          }}
        >
          （简化理解）
        </div>
      ) : null}
      </div>

      {/* ================= branches under 广告质量 ================= */}
      {f >= BR && brOut < 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - brOut, transform: `translateY(${brOut * -30}px) scale(${1 - brOut * 0.1})`, transformOrigin: "540px 650px" }}>
          <svg width={1080} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path
              d={`M${QUA.l + QUA.w / 2} ${EQ_TOP + EQ_H + 6} L${QUA.l + QUA.w / 2} 522 M${LX} ${BR_TOP} L${LX} 522 L${RX} 522 L${RX} ${BR_TOP}`}
              fill="none"
              stroke={C.ink}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - interpolate(f, [BR, BR + 10], [0, 1], clamp)}
            />
          </svg>
          {/* left: 搜索广告 */}
          <BranchHead at={BR + 6} x={LX} emoji="🔍" text="搜索广告" on={f >= BR + 6} />
          <div style={{ position: "absolute", left: LX, top: BR_TOP + 90, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Badge show={BR + 12} at={B_QS} text="质量得分" />
            <Badge show={BR + 16} at={B_LP} text="着陆页体验" />
          </div>
          {/* right: 购物广告 */}
          <BranchHead at={BR + 10} x={RX} emoji="🛒" text="购物广告" on={f >= R_ON} />
          <div style={{ position: "absolute", left: RX, top: BR_TOP + 90, transform: "translateX(-50%)", display: "flex" }}>
            <Badge show={BR + 18} at={B_FEED} text="商品 Feed 质量" />
          </div>
        </div>
      ) : null}

      {/* ================= jammed pipe callback → unclogs ================= */}
      {f >= PIPE_IN ? (
        <div style={{ position: "absolute", left: 60, top: PIPE_TOP, transform: `translateX(${(1 - pipeS) * 1000}px)` }}>
          <JamPipe
            length={960}
            btnSize={236}
            diameter={76}
            billTimes={Array.from({ length: 13 }, () => -20)}
            flowAt={UNCLOG}
            glow={flowGlow * (0.7 + 0.3 * Math.sin(f * 0.3))}
            pressed={f >= UNCLOG ? interpolate(f, [UNCLOG - 4, UNCLOG, UNCLOG + 8], [0, 1, 0], clamp) : 0}
            jamShake={f >= UPBID && f < UNCLOG ? 2.5 : 0}
            spray={{ vx: [8, 18], vy: [-13, -8] }} // low arc: peaks ~70px above the outlet, well below the 「出价 ↑」 chip (bottom ≈ y 570)
            outlet={26}
            seed="s2r"
          />
        </div>
      ) : null}
      {f >= UNCLOG ? (
        <div
          style={{
            position: "absolute",
            left: 626, // right of the 「质量 ↑」 chip, left of the button dome
            top: PIPE_TOP - 44,
            transform: `scale(${sp(f, UNCLOG + 4, { damping: 9 })}) rotate(-4deg)`,
            transformOrigin: "0% 60%", // grows rightwards so the overshoot never touches the 「质量 ↑」 chip
            fontFamily: FONT.display,
            fontSize: 60,
            color: C.green,
            whiteSpace: "nowrap",
            textShadow: `3px 3px 0 ${C.ink}`,
          }}
        >
          花出去了！
        </div>
      ) : null}

      {/* ================= the two levers, labelled under their blocks (line 4) ================= */}
      <LeverChip at={UPBID} cx={BID.l + BID.w / 2} text="出价" />
      <LeverChip at={UPQ} cx={QUA.l + QUA.w / 2} text="质量" />

      {/* ================= 竞价排位 board ================= */}
      {f >= RANK_IN ? (
        <div
          style={{
            position: "absolute",
            left: RB.l,
            top: RB.t,
            width: RB.w,
            background: C.paper,
            border: `${BORDER}px solid ${C.ink}`,
            borderRadius: 30,
            boxShadow: SHADOW,
            overflow: "hidden",
            // short rise + scale-pop about its own centre: the bottom edge stays above y≈1290 (caption zone) throughout
            transform: `translateY(${(1 - rankIn) * 60}px) scale(${0.8 + 0.2 * rankIn})`,
            transformOrigin: "50% 50%",
            opacity: Math.min(1, rankIn * 2),
          }}
        >
          <div
            style={{
              height: HEAD_H,
              background: ORANGE,
              borderBottom: `${BORDER}px solid ${C.ink}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 24px",
            }}
          >
            <Emoji e="🏁" size={44} />
            <div style={{ fontFamily: FONT.black, fontSize: 40, color: C.paper, textShadow: `2px 2px 0 ${C.ink}` }}>竞价排位</div>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: FONT.bold,
                fontSize: 34,
                lineHeight: 1.2,
                color: C.ink,
                background: C.paper,
                border: `3px solid ${C.ink}`,
                borderRadius: 12,
                padding: "0 12px",
              }}
            >
              示意
            </span>
          </div>
          <div style={{ position: "relative", height: 5 * ROW_H + 4 * ROW_GAP + 32, margin: "0 22px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={`n${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 16 + i * (ROW_H + ROW_GAP),
                  width: ROW_H,
                  height: ROW_H,
                  borderRadius: ROW_H / 2,
                  background: i === 0 ? C.yellow : C.cream,
                  border: `4px solid ${C.ink}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT.num,
                  fontSize: 36,
                  color: C.ink,
                  boxSizing: "border-box",
                }}
              >
                {i + 1}
              </div>
            ))}
            {[0, 1, 2, 3, 4].map((i) => {
              const ours = i === 3;
              const slot = slotOf(i);
              const glow = ours ? interpolate(f, [CL1, CL1 + 8, CL1 + 30], [0, 1, 0.4], clamp) + interpolate(f, [CL2, CL2 + 8, CL2 + 30], [0, 1, 0.5], clamp) : 0;
              return (
                <div
                  key={`c${i}`}
                  style={{
                    position: "absolute",
                    left: ROW_H + 18,
                    right: 0,
                    top: 16 + slot * (ROW_H + ROW_GAP),
                    height: ROW_H,
                    borderRadius: 18,
                    background: ours ? ORANGE : "#ECECEF",
                    border: `4px solid ${ours ? C.ink : "#B9B9C2"}`,
                    boxShadow: ours ? `6px 6px 0 ${C.ink}, 0 0 ${28 * Math.min(1, glow)}px ${C.yellow}` : undefined,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "0 16px",
                    boxSizing: "border-box",
                    zIndex: ours ? 2 : 1,
                    transform: ours ? `scale(${(1 + 0.04 * Math.min(1, glow)) * (climbing ? 1 : 1 + 0.015 * Math.sin(f * 0.15))})` : undefined,
                    overflow: ours ? undefined : "hidden",
                  }}
                >
                  {ours ? (
                    <>
                      <div style={{ width: 56, height: 56, marginTop: -4, transform: `translateY(${Math.sin(f * 0.12) * 3}px)` }}>
                        <MascotFace kind="dog" size={56} mood={dogMood} />
                      </div>
                      <span style={{ fontFamily: FONT.black, fontSize: 36, color: C.paper, textShadow: `2px 2px 0 ${C.ink}`, whiteSpace: "nowrap" }}>我们的广告</span>
                      <div style={{ flex: 1 }} />
                      {climbing ? (
                        <div style={{ transform: `translateY(${-Math.abs(Math.sin(f * 0.5)) * 6}px)` }}>
                          <UpBadge />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div style={{ width: 150 + ((i * 53) % 90), height: 18, borderRadius: 9, background: "#C9C9D1" }} />
                      <div style={{ width: 90 + ((i * 31) % 60), height: 18, borderRadius: 9, background: "#DADAE0" }} />
                      <Shimmer t={(f - RANK_IN + 6000 + i * 5) % 60} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ================= sfx ================= */}
      <Sfx name="swish" at={FLY} volume={0.3} />
      <Sfx name="stamp" at={T_RNK + 6} volume={0.3} />
      <Sfx name="pop" at={T_BID + 6} volume={0.35} />
      <Sfx name="pop" at={T_QUA + 6} volume={0.35} />
      <Sfx name="whoosh" at={RANK_IN} volume={0.2} />
      <Sfx name="click" at={B_QS} volume={0.3} />
      <Sfx name="click" at={B_LP} volume={0.3} />
      <Sfx name="click" at={B_FEED} volume={0.3} />
      <Sfx name="swish" at={PIPE_IN + 2} volume={0.3} />
      <Sfx name="pop" at={CL1} volume={0.35} />
      <Sfx name="sparkle" at={CL2} volume={0.35} />
      <Sfx name="coin" at={UNCLOG + 2} volume={0.4} />
    </AbsoluteFill>
  );
};

/** end of line 0 (helper to keep the spin inside the question line) */
const endAt0 = (at: (i: number) => number, w: (i: number, s: string, o?: number) => number) => Math.max(at(0) + 20, w(0, "那是啥") + 10);

const Block: React.FC<{
  at: number;
  x: number;
  w: number;
  bg: string;
  emoji: string;
  label: string;
  light?: boolean;
  pulse?: number[];
  morph?: boolean; // scale in on the spot instead of dropping
  children?: React.ReactNode;
}> = ({ at, x, w, bg, emoji, label, light, pulse = [], morph, children }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = sp(f, at, { damping: 11, stiffness: 200 });
  const land = f - at;
  const squash = land > 3 && land < 12 ? 1 - 0.08 * Math.sin(((land - 3) / 9) * Math.PI) : 1;
  const pp = pulse.reduce((acc, p) => acc * punch(f, p, 0.1, 5), 1);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: EQ_TOP,
        width: w,
        height: EQ_H,
        background: bg,
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 28,
        boxShadow: `8px 8px 0 ${C.ink}`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transform: morph
          ? `scale(${interpolate(s, [0, 1], [0.45, 1]) * pp})`
          : `translateY(${-(1 - s) * 110}px) scale(${pp / squash}, ${squash * pp})`,
        transformOrigin: morph ? "50% 60%" : "50% 100%",
        opacity: Math.min(1, s * 3),
      }}
    >
      <Emoji e={emoji} size={64} />
      <span
        style={{
          fontFamily: FONT.black,
          fontSize: 46,
          lineHeight: 1.15,
          color: light ? C.paper : C.ink,
          textShadow: light ? `3px 3px 0 ${C.ink}` : undefined,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ height: 30, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
};

const Op: React.FC<{ at: number; x: number; ch: string }> = ({ at, x, ch }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = sp(f, at, { damping: 9, stiffness: 240 });
  return (
    <div
      style={{
        position: "absolute",
        left: x - 30,
        top: EQ_TOP + EQ_H / 2 - 46,
        width: 60,
        textAlign: "center",
        fontFamily: FONT.num,
        fontSize: 80,
        lineHeight: 1.1,
        color: C.ink,
        transform: `scale(${s})`,
      }}
    >
      {ch}
    </div>
  );
};

/** dashed 「?」 placeholder in a formula slot until its block lands (same idea as the ? slots in step1_fix) */
const Slot: React.FC<{ at: number; until: number; x: number; w: number }> = ({ at, until, x, w }) => {
  const f = useCurrentFrame();
  if (f < at || f >= until + 6) return null;
  const s = sp(f, at, { damping: 12, stiffness: 200 });
  const fade = interpolate(f, [until, until + 6], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: EQ_TOP,
        width: w,
        height: EQ_H,
        border: `5px dashed ${C.muted}`,
        borderRadius: 28,
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.num,
        fontSize: 96,
        color: "#B3B7C2",
        opacity: Math.min(1, s * 2) * fade * (0.8 + 0.2 * Math.sin(f * 0.2)),
        transform: `scale(${0.8 + 0.2 * s})`,
      }}
    >
      ?
    </div>
  );
};

/** green 「出价 ↑」 / 「质量 ↑」 chip popped under a formula block when that lever is named */
const LeverChip: React.FC<{ at: number; cx: number; text: string }> = ({ at, cx, text }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = sp(f, at, { damping: 9, stiffness: 220 });
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: EQ_TOP + EQ_H + 14 + Math.sin(f * 0.18) * 3,
        transform: `translateX(-50%) scale(${s}) rotate(-3deg)`,
        transformOrigin: "50% 0%",
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: C.green,
        border: `5px solid ${C.ink}`,
        borderRadius: 18,
        padding: "0 14px 0 18px",
        boxShadow: `5px 5px 0 ${C.ink}`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontFamily: FONT.black, fontSize: 52, lineHeight: 1.2, color: C.paper, textShadow: `3px 3px 0 ${C.ink}` }}>{text}</span>
      <svg width={40} height={46} viewBox="0 0 28 32" style={{ overflow: "visible", transform: `translateY(${-Math.abs(Math.sin((f - at) * 0.25)) * 4}px)` }}>
        <path d="M14 2 L26 16 L18.5 16 L18.5 30 L9.5 30 L9.5 16 L2 16 Z" fill={C.paper} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Star: React.FC<{ on: boolean; s: number }> = ({ on, s }) => (
  <svg width={30} height={30} viewBox="-12 -12 24 24" style={{ transform: `scale(${s})`, overflow: "visible" }}>
    <path
      d="M0 -10 L2.9 -3.2 L10 -3.1 L4.4 1.6 L6.2 9 L0 4.8 L-6.2 9 L-4.4 1.6 L-10 -3.1 L-2.9 -3.2 Z"
      fill={on ? C.yellow : C.paper}
      stroke={C.ink}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  </svg>
);

/** soft white sheen sweeping across a grey competitor row (one pass every 60 frames) */
const Shimmer: React.FC<{ t: number }> = ({ t }) => {
  if (t > 24) return null;
  const x = interpolate(t, [0, 24], [-160, 900], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -10,
        width: 90,
        height: 90,
        transform: "skewX(-20deg)",
        background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))",
      }}
    />
  );
};

const LevelBar: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ width: 200, height: 22, borderRadius: 11, background: C.paper, border: `4px solid ${C.ink}`, overflow: "hidden", boxSizing: "border-box" }}>
    <div style={{ width: `${p * 100}%`, height: "100%", background: C.yellow, borderRight: `3px solid ${C.ink}`, boxSizing: "border-box" }} />
  </div>
);

const UpBadge: React.FC = () => (
  <div
    style={{
      width: 52,
      height: 52,
      borderRadius: 26,
      background: C.green,
      border: `4px solid ${C.ink}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `3px 3px 0 ${C.ink}`,
    }}
  >
    <svg width={28} height={28} viewBox="0 0 28 28">
      <path d="M14 3 L25 15 L18 15 L18 25 L10 25 L10 15 L3 15 Z" fill={C.paper} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  </div>
);

const BranchHead: React.FC<{ at: number; x: number; emoji: string; text: string; on: boolean }> = ({ at, x, emoji, text, on }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = sp(f, at, { damping: 11 });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: BR_TOP,
        transform: `translateX(-50%) scale(${s * (on ? 1 : 0.94)})`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: on ? C.paper : "#F2F2F5",
        border: `${BORDER}px solid ${on ? C.ink : "#B9B9C2"}`,
        borderRadius: 22,
        padding: "4px 22px",
        boxShadow: on ? `6px 6px 0 ${C.ink}` : undefined,
        whiteSpace: "nowrap",
        opacity: on ? 1 : 0.6,
      }}
    >
      <Emoji e={emoji} size={46} />
      <span style={{ fontFamily: FONT.black, fontSize: 44, lineHeight: 1.25, color: on ? C.ink : C.muted }}>{text}</span>
    </div>
  );
};

const Badge: React.FC<{ show: number; at: number; text: string }> = ({ show, at, text }) => {
  const f = useCurrentFrame();
  if (f < show) return null;
  const on = f >= at;
  const s = sp(f, at, { damping: 9, stiffness: 240 });
  const inS = sp(f, show, { damping: 12 });
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT.black,
        fontSize: 42,
        lineHeight: 1.25,
        color: on ? C.ink : "#A9A9B6",
        background: on ? C.yellow : C.paper,
        border: `4px ${on ? "solid" : "dashed"} ${on ? C.ink : "#C9C9D1"}`,
        borderRadius: 16,
        padding: "2px 16px",
        whiteSpace: "nowrap",
        transform: `scale(${on ? interpolate(s, [0, 1], [1.16, 1]) : inS})`,
        boxShadow: on ? `4px 4px 0 ${C.ink}` : undefined,
      }}
    >
      {text}
    </span>
  );
};

export default Step2Rank;
