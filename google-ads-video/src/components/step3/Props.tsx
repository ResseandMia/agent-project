import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BORDER, C, FONT, SHADOW } from "../../theme";
import { clamp, Emoji } from "../kit";
import { MascotFace } from "../Mascots";

/** Simple "traffic" figure (meeple-like). `h` = total height in px. Feet at the bottom of the box. */
export const Person: React.FC<{
  color: string;
  h?: number;
  face?: "normal" | "sweat" | "happy" | "dizzy";
  star?: boolean;
  style?: React.CSSProperties;
}> = ({ color, h = 100, face = "normal", star, style }) => (
  <svg viewBox="0 0 60 100" width={h * 0.6} height={h} style={{ overflow: "visible", display: "block", ...style }}>
    <path d="M9 97 L9 66 Q9 46 30 46 Q51 46 51 66 L51 97 Z" fill={color} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={30} cy={24} r={18} fill={color} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={24} cy={17} rx={5} ry={3} fill="#fff" opacity={0.55} />
    {face === "dizzy" ? (
      <>
        <path d="M19 21 l7 7 M26 21 l-7 7 M34 21 l7 7 M41 21 l-7 7" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      </>
    ) : face === "happy" ? (
      <>
        <path d="M19 26 Q23 20 27 26 M33 26 Q37 20 41 26" fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M24 31 Q30 37 36 31" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={23} cy={25} r={3.6} fill={C.ink} />
        <circle cx={37} cy={25} r={3.6} fill={C.ink} />
      </>
    )}
    {face === "sweat" ? <path d="M48 8 Q54 17 50 21 Q45 23 44 18 Q44 13 48 8 Z" fill="#7CC3FF" stroke={C.ink} strokeWidth={2.5} /> : null}
    {star ? <path d="M30 60 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 z" fill="#fff" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" /> : null}
  </svg>
);

/** The 🤯「反直觉」 sticker — same look as the one stuck on row 03 in the intro (bottleneck scene). */
export const AntiSticker: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: C.yellow,
      border: `${BORDER}px solid ${C.ink}`,
      borderRadius: 24,
      padding: "6px 24px 6px 14px",
      boxShadow: `8px 8px 0 ${C.ink}`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <Emoji e="🤯" size={70} />
    <span style={{ fontFamily: FONT.display, fontSize: 64, color: C.ink, lineHeight: 1.1 }}>反直觉</span>
  </div>
);

/** A keyboard keycap; `press` 0..1 pushes it down. */
export const Keycap: React.FC<{ label: string; w?: number; press?: number; color?: string }> = ({ label, w = 120, press = 0, color = C.paper }) => (
  <div
    style={{
      width: w,
      height: 112,
      borderRadius: 22,
      background: color,
      border: `${BORDER}px solid ${C.ink}`,
      boxShadow: `0 ${14 - press * 10}px 0 ${C.ink}`,
      transform: `translateY(${press * 10}px)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT.num,
      fontSize: label.length > 1 ? 44 : 60,
      color: C.ink,
      boxSizing: "border-box",
    }}
  >
    {label}
  </div>
);

/** The 🔍 magnifier: a lens (content = children, drawn already magnified) with a handle. */
export const Magnifier: React.FC<{ d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ d = 340, children, style }) => (
  <div style={{ position: "absolute", width: d, height: d, ...style }}>
    {/* handle */}
    <div
      style={{
        position: "absolute",
        left: d * 0.82,
        top: d * 0.82,
        width: d * 0.46,
        height: 54,
        background: "#5B3A1E",
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 27,
        transform: "rotate(45deg)",
        transformOrigin: "0 50%",
        boxShadow: `6px 6px 0 ${C.ink}`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "#FFFFFF",
        border: `18px solid ${C.ink}`,
        boxShadow: `0 0 0 8px ${C.purple}, 12px 12px 0 8px ${C.ink}`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: "14%",
          top: "10%",
          width: "30%",
          height: "14%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          transform: "rotate(-30deg)",
        }}
      />
    </div>
  </div>
);

export type RankRow = { id: string; ours?: boolean };

/** geometry of the 「竞价排位」 board — identical to the board in step2_rank (same prop coming back) */
export const RANK_GEO = { w: 960, rowH: 62, gap: 10, headH: 66, bodyPad: 16 };
/** y (relative to the board's top edge) of the centre of slot `slot` */
export const rankSlotCenterY = (slot: number) => BORDER + RANK_GEO.headH + BORDER + RANK_GEO.bodyPad + slot * (RANK_GEO.rowH + RANK_GEO.gap) + RANK_GEO.rowH / 2;
/** climb progress used by RankBoard (so other layers can follow our card) */
export const rankClimb = (frame: number, fps: number, climbAt: number) =>
  spring({ frame: frame - climbAt, fps, config: { damping: 13, stiffness: 150, mass: 0.8 } });

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

/**
 * 「竞价排位」 board — same look as step2_rank's board (orange header, 「示意」 pill, 阿冲 on our row).
 * 5 ad cards; ours (orange) moves from slot `from` to slot `to` at frame `climbAt`.
 * Rank numbers are positions only (no metrics).
 */
export const RankBoard: React.FC<{ from: number; to: number; climbAt: number; style?: React.CSSProperties }> = ({ from, to, climbAt, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = rankClimb(f, fps, climbAt);
  const { w, rowH, gap, headH, bodyPad } = RANK_GEO;
  const n = 5;
  // slot of every card over time: ours goes from→to, cards in between shift down by one
  const cards = Array.from({ length: n }, (_, i) => i);
  const slotOf = (card: number) => {
    // card index = initial slot
    if (card === from) return from + (to - from) * s;
    if (card >= to && card < from) return card + s;
    return card;
  };
  const glow = interpolate(f, [climbAt, climbAt + 10, climbAt + 30], [0, 1, 0.5], clamp);
  const climbing = f >= climbAt && f < climbAt + 20;
  const dogMood = f >= climbAt + 4 ? "happy" : "sweat";
  return (
    <div
      style={{
        width: w,
        background: C.paper,
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: SHADOW,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          height: headH,
          background: C.orange,
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
      <div style={{ position: "relative", height: n * rowH + (n - 1) * gap + 2 * bodyPad, margin: "0 22px" }}>
        {cards.map((i) => (
          <div
            key={`num${i}`}
            style={{
              position: "absolute",
              left: 0,
              top: bodyPad + i * (rowH + gap),
              width: rowH,
              height: rowH,
              borderRadius: rowH / 2,
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
        {cards.map((i) => {
          const ours = i === from;
          const slot = slotOf(i);
          return (
            <div
              key={`card${i}`}
              style={{
                position: "absolute",
                left: rowH + 18,
                right: 0,
                top: bodyPad + slot * (rowH + gap),
                height: rowH,
                borderRadius: 18,
                background: ours ? C.orange : "#ECECEF",
                border: `4px solid ${ours ? C.ink : "#B9B9C2"}`,
                boxShadow: ours ? `6px 6px 0 ${C.ink}, 0 0 ${28 * glow}px ${C.yellow}` : undefined,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 16px",
                boxSizing: "border-box",
                zIndex: ours ? 2 : 1,
                transform: ours ? `scale(${(1 + 0.04 * glow) * (climbing ? 1 : 1 + 0.015 * Math.sin(f * 0.15))})` : undefined,
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
                  <Shimmer t={(f + 6000 + i * 5) % 60} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
