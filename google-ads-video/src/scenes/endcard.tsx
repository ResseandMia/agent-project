import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, Emoji, Sfx, useSpring } from "../components/kit";
import { Buddy, GOLD, Lens, pawAt, PlusIcon, Sparkle, StarSticker } from "../components/ending/parts";
import { BORDER, C, FONT, SHADOW } from "../theme";

const INK = C.ink;
const CARD = { x: 40, y: 128, w: 1000 };

const ROWS: Array<{ n: string; c: string; soft: string; a: React.ReactNode; b: React.ReactNode }> = [
  {
    n: "1",
    c: C.blue,
    soft: C.blueSoft,
    a: (
      <>
        预算真的是瓶颈吗？看<span style={{ color: C.blue }}>「时间滞后 ROAS」</span>
      </>
    ),
    b: <>ROAS 超过目标又被预算卡住，才放心加预算</>,
  },
  {
    n: "2",
    c: C.orange,
    soft: C.orangeSoft,
    a: <>预算够却花不出去？先查转化跟踪 / Feed / 定向</>,
    b: (
      <>
        <span style={{ color: "#C96A00" }}>广告评级 = 出价 + 广告质量</span>
        <span style={{ color: C.muted, fontFamily: FONT.bold, fontSize: 34, marginLeft: 2 }}>（简化理解）</span>
      </>
    ),
  },
  {
    n: "3",
    c: C.purple,
    soft: C.purpleSoft,
    a: <>ROAS 目标别定太高，下调到业务能持续的水平</>,
    b: <>出价提不上去？就重点优化商品 Feed</>,
  },
  {
    n: "4",
    c: C.green,
    soft: C.greenSoft,
    a: (
      <>
        横向扩量，至少等满 <span style={{ fontFamily: FONT.num, color: C.green }}>2</span> 个完整转化周期
      </>
    ),
    b: <>对照自己后台：新客数量 / 净增长 / 整体利润</>,
  },
];

const Row: React.FC<{ i: number }> = ({ i }) => {
  const s = useSpring(3 + i * 2, { damping: 16, stiffness: 200 });
  const r = ROWS[i];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: r.soft,
        border: `4px solid ${INK}`,
        borderRadius: 22,
        padding: "10px 16px",
        transform: `translateY(${(1 - s) * 30}px)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          flex: "0 0 62px",
          borderRadius: 31,
          background: r.c,
          border: `4px solid ${INK}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.num,
          fontSize: 38,
          color: C.paper,
          textShadow: `2px 2px 0 ${INK}`,
        }}
      >
        {r.n}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT.black, fontSize: 37, lineHeight: 1.3, color: INK, whiteSpace: "nowrap" }}>{r.a}</div>
        <div style={{ fontFamily: FONT.bold, fontSize: 34, lineHeight: 1.3, color: "#3E3E48", whiteSpace: "nowrap" }}>{r.b}</div>
      </div>
    </div>
  );
};

const Endcard: React.FC = () => {
  const f = useCurrentFrame();
  const inS = useSpring(0, { damping: 16, stiffness: 180 });
  const glint = ((f - 20) % 70) / 18;
  const shine = interpolate((f + 30) % 90, [0, 30], [-200, 1150], clamp);
  const catBob = Math.sin(f * 0.09) * 5;
  const dogBob = Math.sin(f * 0.09 + 2) * 5;
  const catPaw = pawAt("R", 118);
  const catU = 186 / 200;

  return (
    <AbsoluteFill>
      {/* gold-edged card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          background: C.paper,
          border: `${BORDER}px solid ${INK}`,
          borderRadius: 40,
          boxShadow: `${SHADOW}, inset 0 0 0 10px ${GOLD}`,
          padding: "30px 30px 24px",
          boxSizing: "border-box",
          transform: `scale(${interpolate(inS, [0, 1], [0.94, 1])})`,
          transformOrigin: "50% 30%",
        }}
      >
        {/* title */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", fontFamily: FONT.display, fontSize: 68, lineHeight: 1.2, color: INK, whiteSpace: "nowrap" }}>
            <div style={{ position: "absolute", left: -8, right: -8, bottom: 6, height: 26, background: C.yellow, opacity: 0.8, borderRadius: 8, transform: "skewX(-8deg)", zIndex: 0 }} />
            <span style={{ position: "relative" }}>
              Google Ads 扩量前的 <span style={{ color: C.red, fontFamily: FONT.num, fontSize: 64 }}>4</span> 步排查
            </span>
          </div>
        </div>

        {/* 4 rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROWS.map((_, i) => (
            <Row key={i} i={i} />
          ))}
        </div>

        {/* gold quote */}
        <div
          style={{
            position: "relative",
            marginTop: 22,
            background: `linear-gradient(135deg, #F7C04A, ${GOLD} 55%, #D48E0A)`,
            border: `${BORDER}px solid ${INK}`,
            borderRadius: 28,
            boxShadow: `6px 6px 0 ${INK}`,
            padding: "14px 20px 12px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -40, bottom: -40, width: 80, left: shine, background: "rgba(255,255,255,0.4)", transform: "rotate(18deg)" }} />
          <div style={{ position: "relative", fontFamily: FONT.display, fontSize: 52, lineHeight: 1.22, color: C.paper, textShadow: `3px 3px 0 ${INK}`, whiteSpace: "nowrap" }}>
            先找瓶颈（预算 / ROAS 目标 / 广告质量）
          </div>
          <div style={{ position: "relative", fontFamily: FONT.display, fontSize: 66, lineHeight: 1.15, color: C.paper, textShadow: `4px 4px 0 ${INK}`, whiteSpace: "nowrap" }}>
            再决定加不加钱
          </div>
        </div>

        {/* buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 24 }}>
          {[
            { icon: <Emoji e="⭐" size={52} />, t: "收藏", bg: C.yellow, col: INK, sh: "none" },
            { icon: <PlusIcon size={46} />, t: "关注", bg: C.red, col: C.paper, sh: `3px 3px 0 ${INK}` },
          ].map((b, i) => (
            <div
              key={b.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                height: 88,
                padding: "0 40px",
                borderRadius: 44,
                background: b.bg,
                border: `${BORDER}px solid ${INK}`,
                boxShadow: `6px 6px 0 ${INK}`,
                boxSizing: "border-box",
                transform: `scale(${1 + 0.03 * Math.max(0, Math.sin(f * 0.14 + i * Math.PI))})`,
              }}
            >
              {b.icon}
              <span style={{ fontFamily: FONT.black, fontSize: 46, color: b.col, textShadow: b.sh, whiteSpace: "nowrap" }}>{b.t}</span>
            </div>
          ))}
        </div>

        {/* hashtags */}
        <div style={{ marginTop: 20, textAlign: "center", fontFamily: FONT.bold, fontSize: 34, lineHeight: 1.35, color: C.muted }}>
          <div>#GoogleAds #谷歌广告 #跨境电商</div>
          <div>#独立站 #广告投放 #购物广告</div>
        </div>
      </div>

      {/* sparkles around the title */}
      <Sparkle x={70} y={150} size={56} phase={0} color={C.yellow} speed={0.12} />
      <Sparkle x={1012} y={176} size={44} phase={2} color={GOLD} speed={0.12} />

      {/* 欧姐 holding 🔍 */}
      <div style={{ position: "absolute", left: 236, top: 1290 + catBob }}>
        <Buddy
          kind="cat"
          size={186}
          mood="smug"
          glint={glint > 0 && glint < 1 ? glint : 0}
          armL={14}
          armR={118 + Math.sin(f * 0.1) * 4}
          wag={Math.sin(f * 0.15) * 10}
          front={
            <div style={{ position: "absolute", left: catPaw[0] * catU + 46, top: catPaw[1] * catU - 46 }}>
              <Lens r={34} handle={44} deg={135} />
            </div>
          }
        />
      </div>

      {/* 阿冲 hugging ⭐ */}
      <div style={{ position: "absolute", left: 660, top: 1290 + dogBob }}>
        <Buddy kind="dog" size={186} mood="happy" armL={-6} armR={-6} wag={Math.sin(f * 0.4) * 16}>
          <div style={{ position: "absolute", left: 93 - 70, top: 205 * 0.93 - 74, transform: `rotate(${Math.sin(f * 0.1) * 5}deg)` }}>
            <StarSticker size={140} />
          </div>
        </Buddy>
      </div>
      <Sparkle x={862} y={1318} size={40} phase={1} color={C.yellow} speed={0.2} />
      <Sparkle x={196} y={1360} size={34} phase={3} color={GOLD} speed={0.2} />

      <Sfx name="ding" at={4} volume={0.35} />
    </AbsoluteFill>
  );
};

export default Endcard;
