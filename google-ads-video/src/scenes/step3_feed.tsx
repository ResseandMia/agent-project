import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { Panel, Tag } from "../components/Shared";
import { Card, clamp, Emoji, Marker, Sfx, Stamp, useFloat } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { Keycap, Magnifier, RankBoard, rankClimb, rankSlotCenterY } from "../components/step3/Props";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const PURPLE = CHAPTER_COLOR["第3步"] ?? C.purple;
const GREY_TXT = "#8A8A95";
const easeIO = Easing.inOut(Easing.cubic);

const sp = (rel: number, fps: number, damping = 12, stiffness = 190) => spring({ frame: rel, fps, config: { damping, stiffness } });

// ── feed table geometry (panel at x 60, width 960) ──
const TBL_TOP = 378;
const COLS = [150, 520, 222]; // 图片 | 标题 | 价格
const ROW_H = 92;
const ROW_GAP = 8;
const HEAD_H = 56;
const BODY_X = 60 + BORDER + 28; // x of table body content on screen
const BODY_Y = TBL_TOP + 70 + BORDER + 28; // y of table body content on screen (unscaled)
const PRODUCTS = ["👕", "👟", "🎒"];
// ranking board (same geometry as step2_rank's board)
const BOARD_L = 60;
const BOARD_T = 772;
const DOM_DROP = 250; // how far the domino row sits lower while it plays alone (line 6)

export default function Step3Feed() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { at, endAt, scene } = useLineStarts();
  const wordAt = useWordTime();

  // ── beats ──
  const SLIDER_OUT = at(1) - 6;
  const TABLE_IN = at(1) - 2;
  const HL_TITLE = wordAt(1, "商品 Feed") - 4;
  const HL_COL = wordAt(1, "Feed") - 2;
  const LENS_IN = at(2) - 4;
  const ZOOM = wordAt(2, "0.3%") - 2;
  const LENS_OUT = endAt(2) - 2;
  const SHOP_IN = at(3) - 2;
  const COPY = at(3) + 10;
  const ZHAO = Math.max(wordAt(3, "照搬") + 2, COPY + 30);
  const SHOPIFY = wordAt(3, "Shopify") - 2;
  const SHIFT = at(4) - 6;
  const BTN_IN = at(4) - 2;
  const GROUP_OUT = at(5) - 8;
  const CARD_IN = GROUP_OUT + 10; // only after the Feed group + 加预算 button are fully gone
  const TAGS = [wordAt(5, "性别") - 3, wordAt(5, "尺码") - 3, wordAt(5, "颜色") - 3, wordAt(5, "核心卖点") - 3];
  const CARD_OUT = at(6) - 14; // card slides out over 8 frames…
  const DOM_IN = CARD_OUT + 7; // …and the domino row (which now sits mid-stage) stands up once it is nearly gone
  const FALL = [Math.max(wordAt(6, "相关性") + 2, DOM_IN + 16), wordAt(6, "点击率") - 2, wordAt(7, "广告评级") - 2, wordAt(7, "竞价机会") - 6];
  const ROW_UP = at(7) - 22; // domino row plays big + centred during line 6, then moves up for the board
  const BOARD_IN = at(7) - 16; // board lands with 「广告评级」
  const CLIMB = FALL[3] + 14;

  const float = useFloat(6, 0.09);

  return (
    <AbsoluteFill>
      {f < SLIDER_OUT + 12 ? <SliderBeat out={SLIDER_OUT} talk={talkingAt(idOfKind("dog"), scene.start + f)} /> : null}

      {f >= TABLE_IN - 1 && f < GROUP_OUT + 12 ? (
        <TableBeat
          TABLE_IN={TABLE_IN}
          HL_TITLE={HL_TITLE}
          HL_COL={HL_COL}
          LENS_IN={LENS_IN}
          ZOOM={ZOOM}
          LENS_OUT={LENS_OUT}
          SHOP_IN={SHOP_IN}
          COPY={COPY}
          ZHAO={ZHAO}
          SHOPIFY={SHOPIFY}
          SHIFT={SHIFT}
          GROUP_OUT={GROUP_OUT}
        />
      ) : null}

      {f >= BTN_IN && f < GROUP_OUT + 12 ? (
        <HideBeat at={BTN_IN} out={GROUP_OUT} talk={talkingAt(idOfKind("dog"), scene.start + f)} />
      ) : null}

      {f >= CARD_IN && f < CARD_OUT + 12 ? <BeforeAfter at={CARD_IN} out={CARD_OUT} tags={TAGS} float={float} /> : null}

      {f >= DOM_IN ? (
        <AbsoluteFill
          style={{
            // while the chain plays alone (line 6) it sits in the middle of the stage; it glides up when the board comes in
            transform: `translateY(${DOM_DROP * (1 - interpolate(f, [ROW_UP, ROW_UP + 14], [0, 1], { ...clamp, easing: easeIO }))}px)`,
          }}
        >
          <Dominoes at={DOM_IN} falls={FALL} />
        </AbsoluteFill>
      ) : null}

      {f >= BOARD_IN ? (
        <div
          style={{
            position: "absolute",
            left: BOARD_L,
            top: BOARD_T,
            transform: `translateY(${(1 - sp(f - BOARD_IN, fps, 13, 160)) * 90}px) scale(${interpolate(sp(f - BOARD_IN, fps, 12, 170), [0, 1], [0.6, 1])})`,
            opacity: Math.min(1, sp(f - BOARD_IN, fps, 13, 160) * 2.5),
            transformOrigin: "center top",
          }}
        >
          <RankBoard from={3} to={1} climbAt={CLIMB} />
        </div>
      ) : null}
      {/* 🎟️ tickets fly out of the box and land on our card while it climbs */}
      {f >= FALL[3] + 8 ? <Tickets at={FALL[3] + 8} climbAt={CLIMB} /> : null}

      <Sfx name="click" at={9} volume={0.35} />
      <Sfx name="click" at={33} volume={0.3} />
      <Sfx name="whoosh" at={TABLE_IN} volume={0.25} />
      <Sfx name="sparkle" at={ZOOM} volume={0.35} />
      <Sfx name="click" at={COPY + 6} volume={0.35} />
      <Sfx name="stamp" at={ZHAO} volume={0.4} />
      {TAGS.map((t, i) => (
        <Sfx key={i} name="pop" at={t + 3} volume={0.28} />
      ))}
      <Sfx name="swish" at={DOM_IN + 6} volume={0.25} />
      <Sfx name="click" at={FALL[0] + 8} volume={0.3} />
      <Sfx name="click" at={FALL[2] + 8} volume={0.3} />
      <Sfx name="cash" at={FALL[3] + 10} volume={0.3} />
    </AbsoluteFill>
  );
}

// ─────────────────────────────────────────────────────────────────
// Beat 1: 阿冲 headbutts the locked 「出价」 slider
const SliderBeat: React.FC<{ out: number; talk: number }> = ({ out, talk }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = sp(f, fps, 12, 200);
  const outP = interpolate(f, [out, out + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // bumps every 12 frames from frame 6
  const period = 12;
  const ph = f >= 6 ? ((f - 6) % period) / period : 0;
  const bump = f >= 6 ? Math.max(0, Math.sin(ph * Math.PI * 2)) : 0; // 0..1 upward
  const hit = f >= 6 && ph > 0.2 && ph < 0.35;
  const jitter = hit ? Math.sin(f * 3) * 5 : 0;
  const lockSwing = Math.sin(f * 0.5) * (8 + (hit ? 10 : 0));
  const HANDLE_TOP = 300;
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - outP,
        transform: `scale(${(0.9 + 0.1 * inS) * (1 - 0.5 * outP)})`,
        transformOrigin: "540px 700px",
      }}
    >
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: 500,
          top: 360,
          width: 80,
          height: 830,
          background: "#ECECF1",
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 40,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, background: `linear-gradient(180deg, ${PURPLE}, #B9A6FA)` }} />
      </div>
      {/* ticks */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: 600, top: 470 + i * 90, width: 30, height: 6, borderRadius: 3, background: C.ink, opacity: 0.35 }} />
      ))}
      {/* handle (maxed out + locked) */}
      <div
        style={{
          position: "absolute",
          left: 540 - 160,
          top: HANDLE_TOP - jitter,
          width: 320,
          height: 116,
          background: PURPLE,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 30,
          boxShadow: hit ? `0 0 0 8px ${C.red}, ${SHADOW}` : SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontFamily: FONT.display, fontSize: 76, color: C.paper, textShadow: `4px 4px 0 ${C.ink}` }}>出价</span>
      </div>
      {/* lock */}
      <svg width={120} height={80} style={{ position: "absolute", left: 690, top: HANDLE_TOP + 20, overflow: "visible" }}>
        <path d="M0 40 Q40 50 70 30" stroke={C.ink} strokeWidth={8} fill="none" strokeDasharray="14 8" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 740, top: HANDLE_TOP - 6, transform: `rotate(${lockSwing}deg)`, transformOrigin: "50% 0%" }}>
        <Emoji e="🔒" size={120} />
      </div>
      {/* 阿冲 ramming upward */}
      <div style={{ position: "absolute", left: 540 - 140, top: 450 - bump * 36, transform: `scaleY(${1 - (hit ? 0.08 : 0)})`, transformOrigin: "center top" }}>
        <MascotFace kind="dog" size={280} mood="sweat" talking={talk} />
      </div>
      {hit ? (
        <div style={{ position: "absolute", left: 540 - 205, top: HANDLE_TOP + 84, transform: `scale(${1 + Math.sin(f) * 0.1}) rotate(-20deg)` }}>
          <Emoji e="💥" size={96} />
        </div>
      ) : null}
      {/* sweat drops flying off */}
      {[0, 1].map((k) => {
        const t = f >= 6 ? ((f - 6 + k * 6) % 12) / 12 : 0;
        return (
          <div key={k} style={{ position: "absolute", left: k ? 700 + t * 80 : 330 - t * 80, top: 520 - t * 50 + t * t * 90, opacity: 1 - t }}>
            <Emoji e="💦" size={60} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────
// Beats 2–4: Feed table, magnifier on 0.3%, Ctrl+C / Ctrl+V from 「Shopify 后台」
const TableBeat: React.FC<{
  TABLE_IN: number;
  HL_TITLE: number;
  HL_COL: number;
  LENS_IN: number;
  ZOOM: number;
  LENS_OUT: number;
  SHOP_IN: number;
  COPY: number;
  ZHAO: number;
  SHOPIFY: number;
  SHIFT: number;
  GROUP_OUT: number;
}> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = sp(f - p.TABLE_IN, fps, 13, 150);
  const shift = interpolate(f, [p.SHIFT, p.SHIFT + 14], [0, 1], { ...clamp, easing: easeIO });
  const outP = interpolate(f, [p.GROUP_OUT, p.GROUP_OUT + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const groupScale = interpolate(zoom, [0, 1], [0.35, 1]) * (1 - 0.14 * shift) * (1 - 0.08 * outP);
  const early = 70 * (1 - interpolate(f, [p.SHOP_IN - 8, p.SHOP_IN + 6], [0, 1], { ...clamp, easing: easeIO }));
  const groupY = early - 108 * shift; // exits in place (fade + slight shrink), never under the ChapterBar

  // column highlight
  const colHL = interpolate(f, [p.HL_COL, p.HL_COL + 10], [0, 1], clamp);
  const colPulse = 0.35 + 0.15 * Math.sin(f * 0.3);

  // paste times per row
  const PASTE = [p.COPY + 20, p.COPY + 24, p.COPY + 28];
  // tiny CTR readout grows once the lens leaves
  const grow = interpolate(f, [p.LENS_OUT + 4, p.LENS_OUT + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });

  const table = (
    <Panel title="商品 Feed" accent={PURPLE} width={960} style={{ position: "absolute", left: 60, top: TBL_TOP }} bodyStyle={{ position: "relative" }}>
      {/* column highlight behind 标题 */}
      {colHL > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 28 + COLS[0] - 8,
            top: 22,
            width: COLS[1] + 4,
            height: (HEAD_H + 3 * (ROW_H + ROW_GAP)) * colHL,
            background: `rgba(251,188,5,${colPulse})`,
            border: `5px dashed ${C.ink}`,
            borderRadius: 18,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      <div style={{ display: "flex", height: HEAD_H, alignItems: "center", position: "relative" }}>
        {["图片", "标题", "价格"].map((h, i) => (
          <div
            key={h}
            style={{
              width: COLS[i],
              fontFamily: FONT.black,
              fontSize: i === 1 && colHL > 0 ? 40 : 36,
              color: i === 1 && colHL > 0 ? C.ink : C.muted,
              paddingLeft: 12,
              boxSizing: "border-box",
            }}
          >
            {h}
            {i === 1 && colHL > 0 ? <span style={{ marginLeft: 10 }}>👈</span> : null}
          </div>
        ))}
      </div>
      {PRODUCTS.map((e, r) => {
        const pasted = f >= PASTE[r];
        const flash = interpolate(f, [PASTE[r], PASTE[r] + 8], [1, 0], clamp);
        return (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              height: ROW_H,
              marginTop: ROW_GAP,
              borderTop: `3px solid #E4E4EA`,
              position: "relative",
            }}
          >
            <div style={{ width: COLS[0], paddingLeft: 12, boxSizing: "border-box" }}>
              <div
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 18,
                  background: C.cream,
                  border: `4px solid ${C.ink}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <Emoji e={e} size={52} />
              </div>
            </div>
            <div style={{ width: COLS[1], paddingLeft: 16, boxSizing: "border-box", position: "relative" }}>
              {pasted ? (
                <span
                  style={{
                    fontFamily: FONT.black,
                    fontSize: 42,
                    color: GREY_TXT,
                    background: flash > 0 ? `rgba(66,133,244,${0.35 * flash})` : undefined,
                    borderRadius: 8,
                    padding: "0 6px",
                    display: "inline-block",
                    transform: `scale(${1 + 0.15 * flash})`,
                    transformOrigin: "left center",
                  }}
                >
                  [商品名]
                </span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ width: 300, height: 20, borderRadius: 10, background: "#D9D9E0" }} />
                  <div style={{ width: 190, height: 20, borderRadius: 10, background: "#E6E6EB" }} />
                </div>
              )}
            </div>
            <div style={{ width: COLS[2], paddingLeft: 16, boxSizing: "border-box" }}>
              <div style={{ width: 110, height: 20, borderRadius: 10, background: "#D9D9E0" }} />
            </div>
          </div>
        );
      })}
      {/* footer: the (tiny) CTR readout */}
      <div style={{ height: 50, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 620,
            top: 6,
            fontFamily: FONT.black,
            fontSize: 36,
            color: C.red,
            whiteSpace: "nowrap",
            transform: `scale(${0.34 + 0.66 * grow})`,
            transformOrigin: "left center",
            background: grow > 0.05 ? C.redSoft : undefined,
            border: grow > 0.05 ? `3px solid ${C.red}` : undefined,
            borderRadius: 12,
            padding: "0 10px",
            lineHeight: 1.2,
          }}
        >
          点击率 0.3%
        </div>
      </div>
    </Panel>
  );

  // magnifier
  const lensIn = sp(f - p.LENS_IN, fps, 13, 140);
  const lensOut = interpolate(f, [p.LENS_OUT, p.LENS_OUT + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const zoomPunch = f >= p.ZOOM ? 1 + 0.12 * Math.sin(Math.min(1, (f - p.ZOOM) / 10) * Math.PI) : 1;
  const tinyX = BODY_X + 620 + 60; // centre of tiny text (unscaled)
  const tinyY = BODY_Y + HEAD_H + 3 * (ROW_H + ROW_GAP) + 26;
  const LENS_D = 320;

  // Shopify box + keys
  const shopS = sp(f - p.SHOP_IN, fps, 12, 180);
  const shopOut = interpolate(f, [p.SHIFT - 2, p.SHIFT + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const sel = interpolate(f, [p.COPY - 4, p.COPY + 4], [0, 1], clamp);
  const pressC = f >= p.COPY + 6 && f < p.COPY + 12 ? 1 : 0;
  const isV = f >= p.COPY + 14;
  const pressV = f >= p.COPY + 18 && f < p.COPY + 24 ? 1 : 0;
  const ctrlDown = pressC || pressV;
  const shopPunch = f >= p.SHOPIFY ? 1 + 0.08 * Math.sin(Math.min(1, (f - p.SHOPIFY) / 10) * Math.PI) : 1;
  // ghost copy flying into the table
  const gT = interpolate(f, [p.COPY + 8, p.COPY + 20], [0, 1], { ...clamp, easing: easeIO });
  const g0 = { x: 150, y: 1118 };
  const g1 = { x: BODY_X + COLS[0] + 16, y: BODY_Y + HEAD_H + ROW_GAP + 20 };

  return (
    <AbsoluteFill>
      {/* headline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 262,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 84,
          color: C.ink,
          opacity: Math.min(1, zoom * 2) * interpolate(f, [p.SHIFT - 4, p.SHIFT + 4], [1, 0], clamp),
          transform: `translateY(${(1 - zoom) * -40 + early}px)`,
          whiteSpace: "nowrap",
        }}
      >
        重点优化 <Marker at={p.HL_TITLE}><span style={{ color: PURPLE }}>商品 Feed</span></Marker>
      </div>
      <AbsoluteFill style={{ transform: `translateY(${groupY}px) scale(${groupScale})`, transformOrigin: `540px ${TBL_TOP}px`, opacity: (Math.min(1, zoom * 2)) * (1 - outP) }}>
        {table}
        {f >= p.ZHAO ? <Stamp at={p.ZHAO} text="照搬" size={96} rotate={-10} style={{ left: 470, top: BODY_Y + HEAD_H + 120 }} /> : null}
        {/* magnifier */}
        {f >= p.LENS_IN && f < p.LENS_OUT + 10 ? (
          <Magnifier
            d={LENS_D}
            style={{
              left: tinyX - LENS_D / 2 + (1 - lensIn) * 520 + lensOut * 600 + Math.sin(f * 0.15) * 6,
              top: tinyY - LENS_D / 2 + (1 - lensIn) * 380 + lensOut * 200 + Math.cos(f * 0.13) * 5,
              transform: `scale(${zoomPunch}) rotate(${(1 - lensIn) * 20}deg)`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05 }}>
              <span style={{ fontFamily: FONT.black, fontSize: 46, color: C.ink }}>点击率</span>
              <span style={{ fontFamily: FONT.num, fontSize: 100, color: C.red }}>0.3%</span>
            </div>
          </Magnifier>
        ) : null}
        {f >= p.ZOOM && f < p.LENS_OUT + 4 ? (
          <div
            style={{
              position: "absolute",
              left: tinyX + 60,
              top: tinyY - 260,
              transform: `scale(${sp(f - p.ZOOM, fps, 9, 220)}) rotate(12deg)`,
            }}
          >
            <Emoji e="😱" size={90} />
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Shopify 后台 (text-only box) */}
      {f >= p.SHOP_IN && f < p.SHIFT + 12 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 968,
            width: 470,
            transform: `translateX(${(1 - shopS) * -500 - shopOut * 520}px) scale(${shopPunch})`,
            opacity: 1 - shopOut,
            transformOrigin: "left center",
          }}
        >
          <div style={{ background: C.paper, border: `${BORDER}px solid ${C.ink}`, borderRadius: 26, boxShadow: SHADOW, overflow: "hidden" }}>
            <div
              style={{
                background: "#5E6B7A",
                borderBottom: `${BORDER}px solid ${C.ink}`,
                padding: "6px 24px",
                fontFamily: FONT.black,
                fontSize: 38,
                color: C.paper,
                whiteSpace: "nowrap",
              }}
            >
              Shopify 后台
            </div>
            <div style={{ padding: "14px 24px 22px" }}>
              <div style={{ fontFamily: FONT.bold, fontSize: 34, color: C.muted }}>商品标题</div>
              <div
                style={{
                  marginTop: 8,
                  border: `4px solid #B9B9C2`,
                  borderRadius: 14,
                  height: 72,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    height: 44,
                    width: 190 * sel,
                    background: "rgba(66,133,244,0.35)",
                    borderRadius: 6,
                  }}
                />
                <span style={{ fontFamily: FONT.black, fontSize: 42, color: GREY_TXT, position: "relative" }}>[商品名]</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* keycaps */}
      {f >= p.COPY - 6 && f < p.SHIFT + 12 ? (
        <div
          style={{
            position: "absolute",
            left: 572,
            top: 1010,
            display: "flex",
            alignItems: "center",
            gap: 16,
            transform: `scale(${sp(f - (p.COPY - 6), fps, 11, 220)}) translateX(${shopOut * 520}px)`,
            opacity: 1 - shopOut,
          }}
        >
          <Keycap label="Ctrl" w={190} press={ctrlDown} />
          <span style={{ fontFamily: FONT.num, fontSize: 56, color: C.ink }}>+</span>
          <Keycap label={isV ? "V" : "C"} w={124} press={isV ? pressV : pressC} color={isV ? C.yellowSoft : C.blueSoft} />
        </div>
      ) : null}
      {/* ghost copy */}
      {gT > 0 && gT < 1 ? (
        <div
          style={{
            position: "absolute",
            left: g0.x + (g1.x - g0.x) * gT,
            top: g0.y + (g1.y - g0.y) * gT - Math.sin(gT * Math.PI) * 160,
            fontFamily: FONT.black,
            fontSize: 42,
            color: GREY_TXT,
            background: "rgba(66,133,244,0.3)",
            border: `3px dashed ${C.blue}`,
            borderRadius: 10,
            padding: "0 8px",
            transform: `rotate(${Math.sin(gT * Math.PI) * -8}deg)`,
          }}
        >
          [商品名]
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────
// Beat 4: 阿冲 sinks behind the red 「加预算」 button
const HideBeat: React.FC<{ at: number; out: number; talk: number }> = ({ at, out, talk }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = sp(f - at, fps, 13, 170);
  const popUp = sp(f - (at + 8), fps, 10, 200); // rises from behind the dome once the button has landed
  const sink = interpolate(f, [at + 16, at + 50], [0, 1], { ...clamp, easing: easeIO });
  const outP = interpolate(f, [out, out + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const BTN_TOP = 968;
  const headTop = 792 + sink * 118 + (1 - popUp) * 240;
  const peek = Math.sin(f * 0.25) * 4 * sink;
  return (
    <AbsoluteFill style={{ opacity: 1 - outP, transform: `scale(${1 - 0.4 * outP})`, transformOrigin: "540px 1100px" }}>
      {/* the dog is drawn before the button so he is behind it */}
      <div style={{ position: "absolute", left: 540 - 118 + peek, top: headTop, opacity: Math.min(1, popUp * 3) }}>
        <MascotFace kind="dog" size={236} mood="sweat" talking={talk} />
        {/* blush */}
        <svg viewBox="0 0 200 200" width={236} height={236} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[48, 152].map((x) => (
            <g key={x} opacity={0.9}>
              <ellipse cx={x} cy={121} rx={17} ry={9} fill="#FF7FA0" opacity={0.8} />
              <path d={`M${x - 10} 126 l6 -10 M${x - 2} 126 l6 -10 M${x + 6} 126 l6 -10`} stroke="#D9486E" strokeWidth={3} strokeLinecap="round" />
            </g>
          ))}
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - 190,
          top: BTN_TOP,
          transform: `scale(${interpolate(inS, [0, 1], [0.3, 1])})`,
          transformOrigin: "50% 100%",
          opacity: Math.min(1, inS * 3),
        }}
      >
        <BudgetButton size={380} glow={0.25 + 0.15 * Math.sin(f * 0.2)} />
      </div>
      {sink > 0.3 ? (
        <div style={{ position: "absolute", left: 700, top: 880 - (f % 30) * 0.8, opacity: interpolate(f % 30, [0, 5, 24, 30], [0, 1, 1, 0]) }}>
          <Emoji e="💦" size={64} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────
// Beat 5: before / after title card (示意)
const TAG_DEFS = [
  { t: "性别", bg: C.blue, fg: C.paper },
  { t: "尺码", bg: C.yellow, fg: C.ink },
  { t: "颜色", bg: C.orange, fg: C.paper },
  { t: "核心卖点", bg: C.green, fg: C.paper },
];

const BeforeAfter: React.FC<{ at: number; out: number; tags: number[]; float: number }> = ({ at, out, tags, float }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = sp(f - at, fps, 13, 170);
  const outP = interpolate(f, [out, out + 8], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const allIn = f >= tags[3] + 10;
  const chip = (label: string, bg: string) => (
    <span
      style={{
        fontFamily: FONT.black,
        fontSize: 38,
        color: C.paper,
        background: bg,
        border: `4px solid ${C.ink}`,
        borderRadius: 14,
        padding: "0 18px",
        lineHeight: 1.3,
        textShadow: `2px 2px 0 ${C.ink}`,
      }}
    >
      {label}
    </span>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 392 + float * 0.5,
        width: 960,
        transform: `translateY(${(1 - inS) * 150}px) translateX(${-outP * 700}px) rotate(${-outP * 8}deg)`,
        opacity: Math.min(1, inS * 2) * (1 - outP),
      }}
    >
      <Card style={{ padding: "32px 36px 40px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Emoji e="🏷️" size={52} />
          <span style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink }}>商品标题</span>
        </div>
        <div style={{ position: "absolute", right: 28, top: 26, transform: "rotate(7deg)" }}>
          <Tag color="#E4E4EA" size={36} text={C.muted} style={{ border: `4px solid ${C.muted}` }}>
            示意
          </Tag>
        </div>
        {/* before */}
        <div style={{ marginTop: 22 }}>{chip("之前", "#9A9AA5")}</div>
        <div
          style={{
            marginTop: 12,
            background: "#F2F2F5",
            border: `4px solid #B9B9C2`,
            borderRadius: 18,
            padding: "10px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontFamily: FONT.black, fontSize: 46, color: GREY_TXT }}>[商品名]</span>
          <span style={{ fontFamily: FONT.bold, fontSize: 34, color: GREY_TXT }}>（照搬）</span>
        </div>
        {/* arrow */}
        <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 4px" }}>
          <svg width={90} height={80} viewBox="0 0 90 80" style={{ transform: `translateY(${Math.sin(f * 0.3) * 5}px)` }}>
            <path d="M30 4 L60 4 L60 38 L82 38 L45 76 L8 38 L30 38 Z" fill={C.green} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
          </svg>
        </div>
        {/* after */}
        <div>{chip("之后", C.green)}</div>
        <div
          style={{
            marginTop: 12,
            background: C.greenSoft,
            border: `5px solid ${C.green}`,
            borderRadius: 18,
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            rowGap: 16,
            columnGap: 10,
            boxShadow: allIn ? `0 0 0 ${4 + 3 * Math.sin(f * 0.3)}px ${C.yellow}` : undefined,
          }}
        >
          <span style={{ fontFamily: FONT.black, fontSize: 46, color: C.ink }}>[商品名]</span>
          {TAG_DEFS.map((d, i) => {
            const s = sp(f - tags[i], fps, 9, 230);
            const on = f >= tags[i];
            return (
              <span key={d.t} style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: FONT.num, fontSize: 44, color: on ? C.ink : "#B9B9C2" }}>+</span>
                <span style={{ position: "relative", display: "inline-block" }}>
                  {/* empty slot */}
                  <span
                    style={{
                      fontFamily: FONT.black,
                      fontSize: 44,
                      border: `4px dashed #9FCBAE`,
                      borderRadius: 16,
                      padding: "0 18px",
                      color: "transparent",
                      display: "inline-block",
                      lineHeight: 1.35,
                    }}
                  >
                    {d.t}
                  </span>
                  {on ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        fontFamily: FONT.black,
                        fontSize: 44,
                        color: d.fg,
                        background: d.bg,
                        border: `4px solid ${C.ink}`,
                        borderRadius: 16,
                        padding: "0 18px",
                        lineHeight: 1.35,
                        whiteSpace: "nowrap",
                        boxShadow: `4px 4px 0 ${C.ink}`,
                        transform: `translateY(${(1 - s) * -160}px) scale(${interpolate(s, [0, 1], [1.5, 1])}) rotate(${(1 - s) * -14}deg)`,
                        opacity: Math.min(1, s * 3),
                      }}
                    >
                      {d.t}
                    </span>
                  ) : null}
                </span>
              </span>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Beat 6–7: domino chain → ticket box
const DOMS = [
  { label: "相关性", icon: "🎯" },
  { label: "点击率", icon: "👆" },
  { label: "广告评级", icon: "🏆" },
  { label: "竞价机会", icon: "🎟️" },
];
const D_W = 84;
const D_H = 220;
const D_X = [145, 340, 535, 730]; // centres
const D_GROUND = 600;
const LBL_W = 172; // label width: 195px pitch − 172 = 23px gaps between labels
const LEAN = (Math.asin((195 - D_W) / D_H) * 180) / Math.PI; // resting lean on the next domino
const BOX_L = 848;
const LAST_LEAN = (Math.asin((BOX_L - (D_X[3] + D_W / 2)) / D_H) * 180) / Math.PI;

const Dominoes: React.FC<{ at: number; falls: number[] }> = ({ at, falls }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fallAng = (i: number) => {
    const target = i === 3 ? LAST_LEAN : LEAN;
    const p = interpolate(f, [falls[i], falls[i] + 9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const settle = f >= falls[i] + 9 ? Math.sin((f - falls[i] - 9) * 0.9) * 3 * Math.exp(-(f - falls[i] - 9) * 0.25) : 0;
    // teeter before being hit (for 3rd/4th domino while the previous one leans on it)
    const prevDone = i > 0 && f >= falls[i - 1] + 9 && f < falls[i];
    const teeter = prevDone ? Math.sin((f - falls[i - 1]) * 0.35) * 3 + 2 : 0;
    return target * p + settle + teeter;
  };
  const angs = [0, 1, 2, 3].map(fallAng);
  // a fallen domino leans further when the next one falls
  const shown = [0, 1, 2, 3].map((i) => (i < 3 && angs[i] > 1 ? angs[i] + angs[i + 1] * 0.55 : angs[i]));
  const pushT = interpolate(f, [falls[0] - 8, falls[0], falls[0] + 10], [0, 1, 0.6], clamp);
  const boxHit = f >= falls[3] + 9 ? Math.exp(-(f - falls[3] - 9) * 0.2) * Math.sin((f - falls[3] - 9) * 1.4) : 0;
  return (
    <AbsoluteFill>
      {/* ground */}
      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          top: D_GROUND,
          height: 14,
          background: C.ink,
          borderRadius: 7,
          transform: `scaleX(${sp(f - at, fps, 14, 160)})`,
        }}
      />
      {DOMS.map((d, i) => {
        const s = sp(f - (at + i * 3), fps, 11, 210);
        return (
          <div
            key={d.label}
            style={{
              position: "absolute",
              left: D_X[i] - D_W / 2,
              top: D_GROUND - D_H,
              width: D_W,
              height: D_H,
              transformOrigin: "100% 100%",
              transform: `rotate(${shown[i]}deg) scaleY(${s})`,
              background: PURPLE,
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 16,
              boxShadow: `6px 6px 0 ${C.ink}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
              boxSizing: "border-box",
              padding: "10px 0",
            }}
          >
            <Emoji e={d.icon} size={50} />
            <div style={{ width: 54, height: 6, borderRadius: 3, background: C.paper }} />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: C.paper }} />
              <div style={{ width: 14, height: 14, borderRadius: 7, background: C.paper }} />
            </div>
          </div>
        );
      })}
      {/* 👉 push (drawn over domino 1 so the flick reads) */}
      {f < falls[0] + 24 ? (
        <div
          style={{
            position: "absolute",
            left: 36 + pushT * 22,
            top: D_GROUND - 190,
            opacity: interpolate(f, [falls[0] + 14, falls[0] + 24], [1, 0], clamp),
            transform: `scale(${sp(f - (at + 6), fps, 10, 220)})`,
          }}
        >
          <Emoji e="👉" size={80} />
        </div>
      ) : null}
      {/* ticket box */}
      <div
        style={{
          position: "absolute",
          left: BOX_L,
          top: D_GROUND - 150,
          width: 160,
          height: 150,
          background: C.yellow,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 22,
          boxShadow: SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sp(f - (at + 10), fps, 11, 200)}) rotate(${boxHit * 6}deg) translateY(${-Math.abs(boxHit) * 14}px)`,
          transformOrigin: "center bottom",
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", top: 16, left: 30, right: 30, height: 12, borderRadius: 6, background: C.ink }} />
        <Emoji e="🎟️" size={80} style={{ marginTop: 20 }} />
      </div>
      {/* labels */}
      {DOMS.map((d, i) => {
        const s = sp(f - (at + 4 + i * 3), fps, 16, 220);
        const lit = f >= falls[i] + 8;
        return (
          <div
            key={`l${d.label}`}
            style={{
              position: "absolute",
              left: D_X[i] - LBL_W / 2,
              top: D_GROUND + 36,
              width: LBL_W,
              height: 80,
              background: lit ? C.greenSoft : C.paper,
              border: `5px solid ${lit ? C.green : C.ink}`,
              borderRadius: 18,
              boxShadow: `5px 5px 0 ${C.ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.black,
              fontSize: 36,
              color: C.ink,
              whiteSpace: "nowrap",
              // pops are capped (entry overshoot ≤ 1.04, lit pop ≤ 1.05) so neighbours never touch
              transform: `scale(${Math.min(s, 1.04) * (lit ? 1 + 0.05 * Math.max(0, 1 - (f - falls[i] - 8) / 8) : 1)})`,
              boxSizing: "border-box",
            }}
          >
            {d.label}
          </div>
        );
      })}
      {/* big green ↑ badge pops above each domino as it falls */}
      {DOMS.map((d, i) => {
        if (f < falls[i] + 6) return null;
        const up = sp(f - (falls[i] + 6), fps, 8, 240);
        const B = 76;
        return (
          <div
            key={`u${d.label}`}
            style={{
              position: "absolute",
              left: D_X[i] - B / 2,
              top: D_GROUND - D_H - B - 14,
              width: B,
              height: B,
              borderRadius: B / 2,
              background: C.green,
              border: `5px solid ${C.ink}`,
              boxShadow: `4px 4px 0 ${C.ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateY(${(1 - up) * 60 - Math.abs(Math.sin(f * 0.22 + i)) * 6}px) scale(${up})`,
              opacity: Math.min(1, up * 3),
              boxSizing: "border-box",
            }}
          >
            <svg width={44} height={48} viewBox="0 0 30 34">
              <path d="M15 2 L28 16 L20 16 L20 32 L10 32 L10 16 L2 16 Z" fill={C.paper} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 🎟️ a few tickets fly out of the box and land on our card (which is climbing at the same time)
const Tickets: React.FC<{ at: number; climbAt: number }> = ({ at, climbAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const N = 5;
  const DUR = 18;
  const x0 = BOX_L + 80;
  const y0 = D_GROUND - 170; // just above the ticket box
  const ourSlot = 3 + (1 - 3) * rankClimb(f, fps, climbAt);
  const y1 = BOARD_T + rankSlotCenterY(ourSlot);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: N }, (_, i) => {
        const tr = (f - (at + i * 3)) / DUR;
        if (tr < 0 || tr > 1) return null;
        const t = Easing.out(Easing.quad)(tr); // shoot out of the box, settle onto the card
        // arc up-right out of the box, then down the right edge (clear of the domino labels) onto our card
        const x1 = 700 + i * 45;
        const cx = x0 + 110;
        const cy = y0 - 130;
        const u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
        const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const sc = interpolate(tr, [0, 0.15, 0.75, 1], [0.5, 1.1, 1, 0.4], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 36,
              top: y - 36,
              transform: `rotate(${(random(`tr${i}`) - 0.5) * 40 + t * 220}deg) scale(${sc})`,
              opacity: interpolate(tr, [0, 0.08, 0.85, 1], [0, 1, 1, 0], clamp),
            }}
          >
            <Emoji e="🎟️" size={72} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
