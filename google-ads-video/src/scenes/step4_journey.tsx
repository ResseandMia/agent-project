import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, Emoji, Pop, Sfx, useFloat, useSpring } from "../components/kit";
import { idOfKind, talkingAt } from "../components/Mascots";
import { NoteChong, StepPoint, WebCard } from "../components/step4/parts";
import { BORDER, C, CHAPTER_COLOR, FONT } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const GREEN = CHAPTER_COLOR["第4步"];
const INK = C.ink;

/* funnel geometry (local SVG coords), placed at FUN.x / FUN.y */
const FUN = { x: 44, y: 430, w: 460, h: 500 };
const TOP_L = [
  [6, 34],
  [454, 34],
  [392, 250],
  [68, 250],
];
const MID_L = [
  [74, 268],
  [386, 268],
  [310, 478],
  [150, 478],
];
const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");

const Funnel: React.FC<{ drop: number; litTop: number; litMid: number; userIn: number; userMove: number }> = ({
  drop,
  litTop,
  litMid,
  userIn,
  userMove,
}) => {
  const f = useCurrentFrame();
  const sDrop = useSpring(drop, { damping: 10, stiffness: 150 });
  const sUser = useSpring(userIn, { damping: 9, stiffness: 160 });
  const sMove = useSpring(userMove, { damping: 12, stiffness: 150 });
  const float = useFloat(5, 0.08);
  if (f < drop) return null;
  const topOn = interpolate(f, [litTop, litTop + 6], [0, 1], clamp) * (1 - interpolate(f, [litMid, litMid + 6], [0, 0.75], clamp));
  const midOn = interpolate(f, [litMid, litMid + 6], [0, 1], clamp);
  const layer = (pts: number[][], on: number, label: string, labelY: number, key: string) => {
    const pulse = on > 0.9 ? 0.5 + 0.5 * Math.sin(f * 0.25) : 0;
    return (
      <g key={key}>
        {on > 0 ? <polygon points={poly(pts)} fill="none" stroke={GREEN} strokeWidth={18 + 10 * pulse} strokeLinejoin="round" opacity={0.35 * on} /> : null}
        <polygon points={poly(pts)} fill={on > 0.5 ? GREEN : C.greenSoft} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <text
          x={230}
          y={labelY}
          textAnchor="middle"
          fontFamily={FONT.black}
          fontSize={46}
          fill={on > 0.5 ? C.paper : INK}
          stroke={on > 0.5 ? INK : "none"}
          strokeWidth={on > 0.5 ? 8 : 0}
          paintOrder="stroke"
        >
          {label}
        </text>
      </g>
    );
  };
  // user icon position (local)
  const uy0 = interpolate(sUser, [0, 1], [-150, 104]);
  const uy = interpolate(sMove, [0, 1], [uy0, 322]);
  const walk = Math.sin(f * 0.3) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: FUN.x,
        top: FUN.y + (1 - sDrop) * -700 + float,
        opacity: Math.min(1, sDrop * 3),
      }}
    >
      <svg width={FUN.w} height={FUN.h} style={{ overflow: "visible" }}>
        {/* shadow */}
        <polygon points={poly(TOP_L.map(([x, y]) => [x + 10, y + 10]))} fill={INK} />
        <polygon points={poly(MID_L.map(([x, y]) => [x + 10, y + 10]))} fill={INK} />
        {layer(TOP_L, topOn, "漏斗顶部", 205, "top")}
        {layer(MID_L, midOn, "漏斗中部", 420, "mid")}
        {/* rim */}
        <ellipse cx={230} cy={34} rx={224} ry={28} fill="#1E7A3A" stroke={INK} strokeWidth={7} />
        <ellipse cx={230} cy={30} rx={200} ry={16} fill="#155C2B" />
        {/* user icon */}
        {f >= userIn ? (
          <g transform={`translate(230 ${uy + walk}) rotate(${Math.sin(f * 0.3) * 6})`}>
            <circle cx={0} cy={-30} r={20} fill={C.blue} stroke={INK} strokeWidth={6} />
            <path d="M-28 22 Q-28 -6 0 -6 Q28 -6 28 22 Z" fill={C.blue} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <circle cx={7} cy={-34} r={3.5} fill={INK} />
          </g>
        ) : null}
      </svg>
    </div>
  );
};

/* connector line (absolute coords) drawn on between a and a+dur, with a travelling dot */
const Connector: React.FC<{ d: string; at: number; dur?: number; dim?: number }> = ({ d, at, dur = 12, dim = 1 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (f < at) return null;
  const dotT = ((f - at) % 30) / 30;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: dim }}>
      <path d={d} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      <path d={d} fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p >= 1 ? (
        <path
          d={d}
          fill="none"
          stroke={C.yellow}
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.08 0.92"
          strokeDashoffset={-dotT}
        />
      ) : null}
    </svg>
  );
};

const PageLabel: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 44 }) => (
  <div style={{ fontFamily: FONT.black, fontSize: size, color: INK, lineHeight: 1.22, whiteSpace: "nowrap" }}>{children}</div>
);

const Skeleton: React.FC<{ widths: number[] }> = ({ widths }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
    {widths.map((w, i) => (
      <div key={i} style={{ width: w, height: 12, borderRadius: 6, background: "#DADCE3" }} />
    ))}
  </div>
);

const PUP = { left: 84, top: 944, size: 240 }; // head-only 阿冲 + notebook: bottom ≈ 944 + 240*1.35 ≈ 1268
const CARD_X = 562;
const CARD_W = 450;

export default function Step4Journey() {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();

  const drop = at(0) - 2;
  const userIn = at(0) + 14;
  const litTop = at(1) - 2;
  const connA = wordAt(1, "链接") - 4;
  const cardA = wordAt(1, "科普") - 5;
  const medal = wordAt(1, "榜单") - 4;
  const userMove = at(2) - 8;
  const litMid = at(2) - 2;
  const connB = wordAt(2, "链接") - 4;
  const cardB = wordAt(2, "对比页") - 5;
  const orAt = wordAt(2, "或") - 3;
  const cardC = wordAt(2, "产品详情页") - 5;

  const topDim = interpolate(f, [litMid, litMid + 8], [1, 0.7], clamp);
  const floatA = useFloat(5, 0.09, 0);
  const floatB = useFloat(5, 0.09, 1.5);
  const floatC = useFloat(5, 0.09, 3);
  const sMedal = useSpring(medal, { damping: 8, stiffness: 220 });
  const sBook = useSpring(cardA + 2, { damping: 8, stiffness: 220 });

  // puppy with notebook (flips to a new page)
  const sPup = useSpring(at(0) + 2, { damping: 12 });
  const flip = interpolate(f, [at(0) + 16, at(0) + 30], [0, 1], clamp);
  const write = flip < 1 ? 0 : interpolate(f, [at(0) + 32, scene.duration], [0, 1], clamp);
  const pen = Math.sin(f * 0.9) * 12;
  const pupBob = useFloat(6, 0.12, 2);
  // scale punch on the notebook while the page turns (1 -> 1.2 -> 1)
  const notePunch = 1 + 0.2 * Math.sin(interpolate(f, [at(0) + 12, at(0) + 34], [0, 1], clamp) * Math.PI);

  return (
    <AbsoluteFill>
      <StepPoint at={1} num="3" label="匹配用户旅程" />
      <Funnel drop={drop} litTop={litTop} litMid={litMid} userIn={userIn} userMove={userMove} />
      <Sfx name="whoosh" at={drop} volume={0.3} />
      <Sfx name="pop" at={userIn + 6} volume={0.25} />

      {/* empty page slots (filled by the cards later) */}
      {[
        { top: 440, h: 272, at: at(0) + 16, gone: cardA },
        { top: 740, h: 170, at: at(0) + 22, gone: cardB },
        { top: 1000, h: 170, at: at(0) + 28, gone: cardC },
      ].map((slot, i) => {
        const a = interpolate(f, [slot.at, slot.at + 8], [0, 1], clamp) * interpolate(f, [slot.gone + 4, slot.gone + 8], [1, 0], clamp);
        if (a <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CARD_X + 8,
              top: slot.top + 8,
              width: CARD_W - 16,
              height: slot.h - 16,
              borderRadius: 24,
              border: `5px dashed #B3B7C2`,
              background: "rgba(255,255,255,0.4)",
              opacity: a * (0.75 + 0.25 * Math.sin(f * 0.15 + i)),
              transform: `scale(${0.9 + 0.1 * a})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.num,
              fontSize: 64,
              color: "#B3B7C2",
            }}
          >
            ?
          </div>
        );
      })}

      {/* connectors */}
      <Connector d="M478 560 C520 560 530 572 572 572" at={connA} dim={topDim} />
      <Connector d="M400 800 C470 800 490 842 572 842" at={Math.min(connB, cardB - 6)} />
      <Connector d="M400 800 C500 800 470 1102 572 1102" at={cardC - 12} dur={14} />
      <Sfx name="swish" at={connA} volume={0.25} />
      <Sfx name="swish" at={connB} volume={0.25} />

      {/* top → 科普 / 榜单类预着陆页 */}
      <Pop at={cardA} from="right" distance={160} style={{ position: "absolute", left: CARD_X, top: 440 + floatA, opacity: 1 }}>
        <div style={{ opacity: topDim }}>
          <WebCard width={CARD_W} glow={interpolate(f, [cardA, cardA + 6, litMid, litMid + 6], [0, 1, 1, 0], clamp)}>
            <div style={{ padding: "14px 22px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ transform: `scale(${sBook})`, height: 64 }}>
                  <Emoji e="📚" size={60} />
                </div>
                <div style={{ transform: `scale(${sMedal}) rotate(${Math.sin(f * 0.15) * 8}deg)`, height: 64 }}>
                  <Emoji e="🏅" size={60} />
                </div>
                <div style={{ marginLeft: 14, marginTop: -8 }}>
                  <Skeleton widths={[200, 140]} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <PageLabel size={46}>科普 / 榜单类</PageLabel>
                <PageLabel size={46}>预着陆页</PageLabel>
              </div>
            </div>
          </WebCard>
        </div>
      </Pop>
      <Sfx name="pop" at={cardA} volume={0.3} />

      {/* middle → 对比页 / 产品详情页 */}
      <Pop at={cardB} from="right" distance={160} style={{ position: "absolute", left: CARD_X, top: 740 + floatB }}>
        <WebCard width={CARD_W} glow={interpolate(f, [cardB, cardB + 6], [0, 1], clamp)}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 22px 18px" }}>
            <div style={{ transform: `rotate(${Math.sin(f * 0.12) * 10}deg)` }}>
              <Emoji e="⚖️" size={70} />
            </div>
            <div>
              <PageLabel size={50}>对比页</PageLabel>
              <Skeleton widths={[200]} />
            </div>
          </div>
        </WebCard>
      </Pop>
      <Pop at={orAt} from="scale" style={{ position: "absolute", left: CARD_X + CARD_W / 2 - 45, top: 922 }}>
        <div
          style={{
            width: 90,
            height: 62,
            borderRadius: 31,
            background: C.yellow,
            border: `${BORDER - 1}px solid ${INK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.black,
            fontSize: 40,
            color: INK,
          }}
        >
          或
        </div>
      </Pop>
      <Pop at={cardC} from="right" distance={160} style={{ position: "absolute", left: CARD_X, top: 1000 + floatC }}>
        <WebCard width={CARD_W} glow={interpolate(f, [cardC, cardC + 6], [0, 1], clamp)}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 22px 18px" }}>
            <div style={{ transform: `translateY(${Math.abs(Math.sin(f * 0.18)) * -6}px)` }}>
              <Emoji e="🛍️" size={70} />
            </div>
            <div>
              <PageLabel size={50}>产品详情页</PageLabel>
              <Skeleton widths={[200]} />
            </div>
          </div>
        </WebCard>
      </Pop>
      <Sfx name="pop" at={cardC} volume={0.3} />

      {/* 阿冲 flips to a new page in his notebook */}
      {f >= at(0) + 2 ? (
        <div
          style={{
            position: "absolute",
            left: PUP.left,
            top: PUP.top + pupBob,
            transform: `scale(${sPup})`,
            transformOrigin: "50% 100%",
            opacity: Math.min(1, sPup * 2),
          }}
        >
          <NoteChong
            size={PUP.size}
            talking={talkingAt(idOfKind("dog"), scene.start + f)}
            write={write}
            flip={flip}
            punch={notePunch}
            pen={pen}
            noteW={86}
          />
        </div>
      ) : null}
      <Sfx name="swish" at={at(0) + 16} volume={0.2} />
    </AbsoluteFill>
  );
}
