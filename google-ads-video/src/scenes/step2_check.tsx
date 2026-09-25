import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { clamp, Emoji, Sfx, useFloat } from "../components/kit";
import { ChapterStamp } from "../components/Shared";
import { MascotFace, idOfKind, talkingAt } from "../components/Mascots";
import { useLineStarts, useWordTime } from "../timeline";
import { FeedCard, Hammer, JamPipe, Radar, Spotlight, StruckTag, punch, sp } from "../components/step2/props";

const ORANGE = CHAPTER_COLOR["第2步"];

// ---- layout (final positions) ----
const BAND_TOP = 500; // JamPipe box top
const PIPE_LEFT = 40;
const PIPE_LEN = 820;
const BTN = 250;
const PIVOT: [number, number] = [885, 541]; // 阿冲's paw / hammer pivot
const DROP = 430; // how far the band sits lower during line 0

const BOARD = { l: 60, t: 862, w: 960, h: 424 };
const WIN = { l: 704, t: 900, w: 286, h: 356 };

const Step2Check: React.FC = () => {
  const f = useCurrentFrame();
  const { at, endAt, scene } = useLineStarts();
  const w = useWordTime();
  const dogId = idOfKind("dog");
  const catId = idOfKind("cat");

  // ---------------- timing ----------------
  const A0 = at(0);
  const HITS = [0, 1, 2, 3, 4, 5, 6].map((i) => A0 + 6 + i * 8);
  const SHRINK = endAt(0) - 6;
  const MOVE = SHRINK + 2;
  const TAG_IN = at(1) + 6;
  const CROSS = w(1, "不在预算") - 2;
  const NOTE = CROSS + 5;
  const CLIP_IN = at(1) + 2; // 欧姐 + clipboard rise on her first word
  const HEAD = at(2) - 4;
  const ROW = [w(2, "一") - 4, at(3) - 4, at(4) - 4];
  const B1 = w(3, "审核") - 3;
  const B2 = w(3, "信息") - 3;

  // ---------------- header ----------------
  const hdr = interpolate(f, [SHRINK, SHRINK + 12], [0.86, 0.66], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const rays = interpolate(f, [A0, A0 + 8, SHRINK, SHRINK + 10], [0, 1, 1, 0], clamp);
  // second beat when 欧姐 says 「第2步」: the shrunk header punches + a short rays flash
  const STEP_BEAT = at(1) - 3;
  const rays2 = interpolate(f, [STEP_BEAT, at(1) + 2, at(1) + 14], [0, 0.6, 0], clamp);

  // ---------------- hammering ----------------
  let hamA = 58;
  let pressed = 0;
  let lastHit = -999;
  for (const h of HITS) if (f >= h) lastHit = h;
  if (f < HITS[0] - 5) {
    hamA = interpolate(f, [A0 - 4, HITS[0] - 5], [70, 58], clamp);
  } else if (f <= HITS[HITS.length - 1] + 8) {
    const next = HITS.find((h) => h >= f) ?? HITS[HITS.length - 1];
    const sinceHit = f - lastHit;
    if (next - f <= 3 && next !== lastHit) hamA = interpolate(next - f, [0, 3], [-2, 58], clamp); // swing down
    else if (sinceHit >= 0 && sinceHit < 8) hamA = interpolate(sinceHit, [0, 1, 5], [-2, 4, 58], clamp); // bounce up
    else hamA = 58;
    pressed = sinceHit >= 0 && sinceHit < 6 ? interpolate(sinceHit, [0, 1, 6], [0.9, 1, 0], clamp) : 0;
  } else {
    // rests on his shoulder, droops when the budget tag is crossed out
    const rest = interpolate(f, [HITS[HITS.length - 1] + 8, HITS[HITS.length - 1] + 20], [58, 72], clamp);
    const droop = interpolate(f, [CROSS, CROSS + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
    hamA = rest - droop * 22 + Math.sin(f * 0.08) * 3;
  }
  const hitFlash = f - lastHit >= 0 && f - lastHit < 7 && lastHit >= HITS[0] ? 1 - (f - lastHit) / 7 : 0;
  const billTimes = [-20, -20, -20, ...HITS.map((h) => h + 1)];

  // band position: low during line 0, then springs up
  const up = sp(f, MOVE, { damping: 15, stiffness: 120 });
  const bandY = DROP * (1 - up);
  const bandIn = sp(f, 2, { damping: 13 });

  // mascots
  const dogTalk = talkingAt(dogId, scene.start + f);
  const catTalk = talkingAt(catId, scene.start + f);
  const dogMood = f < HITS[HITS.length - 1] + 6 ? "money" : f >= CROSS && f < CROSS + 22 ? "shock" : "sweat";
  const dogBob = f - lastHit >= 0 && f - lastHit < 6 ? -10 * (1 - (f - lastHit) / 6) : Math.sin(f * 0.1) * 4;
  const catGlint = Math.max(0, ...ROW.map((r) => interpolate(f, [r + 2, r + 16], [0, 1], clamp) * (f < r + 17 ? 1 : 0)));

  // clipboard
  const clip = sp(f, CLIP_IN, { damping: 14, stiffness: 120 });
  const catFloat = useFloat(4, 0.09, 1);
  const boardFloat = useFloat(3, 0.06, 2);

  // illustration window state
  const which = f < ROW[0] ? 0 : f < ROW[1] ? 1 : f < ROW[2] ? 2 : 3;
  const switchAt = [CLIP_IN, ...ROW][which];
  const flipX = which === 0 ? 1 : interpolate(f, [switchAt, switchAt + 8], [0.1, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });

  return (
    <AbsoluteFill>
      {/* ================= header ================= */}
      {rays > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: 560 - 560,
            width: 1120,
            height: 1120,
            borderRadius: "50%",
            opacity: rays * 0.9,
            background: `repeating-conic-gradient(from ${f * 0.6}deg, ${C.orangeSoft} 0deg 9deg, transparent 9deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 30%, transparent 68%)",
          }}
        />
      ) : null}
      {rays2 > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 380,
            top: 350 - 380,
            width: 760,
            height: 760,
            borderRadius: "50%",
            opacity: rays2,
            background: `repeating-conic-gradient(from ${f * 1.2}deg, ${ORANGE} 0deg 7deg, transparent 7deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 64%)",
            maskImage: "radial-gradient(circle, black 20%, transparent 64%)",
          }}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${hdr * punch(f, STEP_BEAT, 0.35, 6)})`, transformOrigin: "540px 270px" }}>
        <ChapterStamp at={A0} num="02" title="预算够了，却花不出去？" color={ORANGE} shrinkAt={SHRINK} />
      </div>

      {/* ================= button + jammed pipe + 阿冲 ================= */}
      {f >= 2 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${bandY + (1 - bandIn) * 300}px)`, opacity: Math.min(1, bandIn * 2) }}>
          <div style={{ position: "absolute", left: PIPE_LEFT, top: BAND_TOP }}>
            <JamPipe length={PIPE_LEN} btnSize={BTN} diameter={80} pressed={pressed} billTimes={billTimes} jamShake={hitFlash * 5} seed="s2c" />
          </div>
          {/* stress marks on the jammed pipe */}
          {f >= HITS[1]
            ? [
                { x: 470, y: 596, ph: 0 },
                { x: 250, y: 684, ph: 2.1 },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: m.x,
                    top: m.y,
                    transform: `scale(${sp(f, HITS[1] + i * 10, { damping: 8 }) * (1 + 0.14 * Math.sin(f * 0.35 + m.ph))}) rotate(${i ? 12 : -10}deg)`,
                  }}
                >
                  <Emoji e="💢" size={48} />
                </div>
              ))
            : null}
          {/* impact burst on the dome */}
          {hitFlash > 0 ? (
            <svg width={220} height={120} style={{ position: "absolute", left: 735 - 110, top: 520 - 70, overflow: "visible", opacity: hitFlash }}>
              {[-60, -30, 0, 30, 60].map((a) => {
                const r0 = 50 + (1 - hitFlash) * 20;
                const r1 = r0 + 26;
                const rad = ((a - 90) * Math.PI) / 180;
                return (
                  <path
                    key={a}
                    d={`M${110 + Math.cos(rad) * r0} ${90 + Math.sin(rad) * r0} L${110 + Math.cos(rad) * r1} ${90 + Math.sin(rad) * r1}`}
                    stroke={C.ink}
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          ) : null}
          {/* 阿冲 */}
          <div style={{ position: "absolute", left: 872, top: 424 + dogBob, transform: `rotate(${f < HITS[HITS.length - 1] + 8 ? -6 : 4}deg)` }}>
            <MascotFace kind="dog" size={150} talking={dogTalk} mood={dogMood} />
          </div>
          {/* sweat drops after the hammering */}
          {f >= HITS[HITS.length - 1] + 10
            ? [0, 1].map((i) => {
                const t = (f + i * 17) % 34;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 1000 - i * 140,
                      top: 440 + t * 1.6,
                      width: 16,
                      height: 22,
                      borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                      background: "#7CC3FF",
                      border: `3px solid ${C.ink}`,
                      opacity: interpolate(t, [0, 4, 26, 34], [0, 1, 1, 0]),
                    }}
                  />
                );
              })
            : null}
          <Hammer angle={hamA} len={150} style={{ left: PIVOT[0], top: PIVOT[1] }} />

          {/* 「预算」 tag crossed out → 不在预算 */}
          {f >= TAG_IN ? (
            <div
              style={{
                position: "absolute",
                left: 170,
                top: 498 + Math.sin(f * 0.1) * 5,
                transform: `scale(${sp(f, TAG_IN, { damping: 10 })}) rotate(${-4 + (f >= CROSS ? Math.sin((f - CROSS) * 0.8) * 6 * Math.exp(-(f - CROSS) / 8) : 0)}deg)`,
                transformOrigin: "50% 50%",
              }}
            >
              <StruckTag crossAt={CROSS} size={46} />
            </div>
          ) : null}
          {f >= NOTE ? (
            <div
              style={{
                position: "absolute",
                left: 396,
                top: 492,
                fontFamily: FONT.display,
                fontSize: 60,
                color: C.red,
                whiteSpace: "nowrap",
                textShadow: `3px 3px 0 ${C.paper}, -3px -3px 0 ${C.paper}, 3px -3px 0 ${C.paper}, -3px 3px 0 ${C.paper}`,
                transform: `rotate(-6deg) scale(${interpolate(sp(f, NOTE, { damping: 9, stiffness: 240 }), [0, 1], [2, 1])})`,
                opacity: Math.min(1, sp(f, NOTE) * 2),
                transformOrigin: "30% 50%",
              }}
            >
              不在预算
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ================= 欧姐 + checklist board ================= */}
      {f >= CLIP_IN ? (
        // scale-pop anchored at the board's bottom edge (y≈1290) so nothing dips into the caption zone while it enters
        <div style={{ position: "absolute", inset: 0, transform: `scale(${0.7 + 0.3 * clip})`, transformOrigin: "540px 1290px", opacity: Math.min(1, clip * 2.5) }}>
          {/* cat behind the board */}
          <div style={{ position: "absolute", left: 92, top: 732 + catFloat }}>
            <MascotFace kind="cat" size={164} talking={catTalk} mood={f >= CROSS && f < CROSS + 40 ? "raise" : "normal"} glint={catGlint} />
          </div>
          {/* board */}
          <div
            style={{
              position: "absolute",
              left: BOARD.l,
              top: BOARD.t + boardFloat,
              width: BOARD.w,
              height: BOARD.h,
              background: "#C8874A",
              border: `${BORDER}px solid ${C.ink}`,
              borderRadius: 30,
              boxShadow: SHADOW,
              boxSizing: "border-box",
            }}
          >
            {/* paper */}
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: 20,
                bottom: 16,
                background: C.paper,
                border: `4px solid ${C.ink}`,
                borderRadius: 16,
                transform: "rotate(-0.4deg)",
              }}
            />
            {/* clip */}
            <div
              style={{
                position: "absolute",
                left: BOARD.w / 2 - 90,
                top: -30,
                width: 180,
                height: 58,
                background: "linear-gradient(180deg, #E3E7ED, #A9B0BC)",
                border: `${BORDER}px solid ${C.ink}`,
                borderRadius: 16,
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "absolute", left: 68, top: 10, width: 32, height: 16, borderRadius: 8, background: C.ink }} />
            </div>
          </div>
          {/* cat paws on the board edge */}
          {[124, 214].map((x, i) => (
            <div
              key={x}
              style={{
                position: "absolute",
                left: x,
                top: BOARD.t - 20 + boardFloat + (i ? Math.sin(f * 0.12) * 2 : 0),
                width: 50,
                height: 42,
                borderRadius: "50%",
                background: "#9FC3FF",
                border: `5px solid ${C.ink}`,
                boxSizing: "border-box",
              }}
            />
          ))}

          {/* contents (move with the board) */}
          <div style={{ position: "absolute", left: 0, top: boardFloat, width: 1080, height: 1920 }}>
            {/* header */}
            <div style={{ position: "absolute", left: 250, top: BOARD.t + 38, display: "flex", alignItems: "center", gap: 10 }}>
              {f >= HEAD ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${sp(f, HEAD, { damping: 10 })})`, transformOrigin: "left center" }}>
                  <Emoji e="📋" size={50} />
                  <span style={{ fontFamily: FONT.display, fontSize: 54, color: C.ink, lineHeight: 1.1 }}>先查三件事</span>
                </div>
              ) : (
                <div style={{ width: 300, height: 26, borderRadius: 13, background: "#ECECF0", marginTop: 18 }} />
              )}
            </div>

            {/* rows */}
            <CheckRow top={BOARD.t + 100} h={86} litAt={ROW[0]} num="1">
              <span style={{ fontFamily: FONT.black, fontSize: 42, color: C.ink, whiteSpace: "nowrap" }}>转化跟踪设对了吗？</span>
            </CheckRow>
            <CheckRow top={BOARD.t + 192} h={112} litAt={ROW[1]} num="2">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: FONT.black, fontSize: 42, color: C.ink, whiteSpace: "nowrap", lineHeight: 1.15 }}>
                  商品 <span style={{ fontFamily: FONT.num, fontSize: 40 }}>Feed</span>
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge at={B1} litAt={ROW[1]} text="审核过了吗？" />
                  <Badge at={B2} litAt={ROW[1]} text="信息全吗？" />
                </div>
              </div>
            </CheckRow>
            <CheckRow top={BOARD.t + 310} h={86} litAt={ROW[2]} num="3">
              <span style={{ fontFamily: FONT.black, fontSize: 42, color: C.ink, whiteSpace: "nowrap" }}>定向是不是太窄？</span>
            </CheckRow>

            {/* illustration window */}
            <div
              style={{
                position: "absolute",
                left: WIN.l,
                top: WIN.t,
                width: WIN.w,
                height: WIN.h,
                borderRadius: 22,
                border: `4px ${which === 0 ? "dashed" : "solid"} ${which === 0 ? "#B9B9C2" : C.ink}`,
                background: which === 0 ? "#FAFAFC" : C.cream,
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transform: `scaleX(${flipX})`,
                }}
              >
                {which === 0 ? (
                  <div style={{ fontFamily: FONT.display, fontSize: 150, color: "#C9C9D1", transform: `translateY(${Math.sin(f * 0.12) * 8}px) rotate(${Math.sin(f * 0.07) * 8}deg)` }}>?</div>
                ) : which === 1 ? (
                  <>
                    <Radar size={236} t={f - ROW[0]} />
                    <WinLabel text="转化跟踪" />
                  </>
                ) : which === 2 ? (
                  <>
                    <FeedCard
                      w={212}
                      scan={interpolate(f, [B1 - 2, B1 + 26], [0, 1], clamp)}
                      fill={interpolate(f, [B2, B2 + 22], [0, 1], clamp)}
                    />
                    <WinLabel text="商品 Feed" />
                  </>
                ) : (
                  <>
                    <Spotlight
                      w={262}
                      h={262}
                      t={f}
                      narrow={interpolate(f, [ROW[2] + 8, ROW[2] + 50], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })}
                    />
                    <WinLabel text="定向太窄？" />
                  </>
                )}
              </div>
            </div>
            {/* pointer from the active row to the window */}
            {which > 0 ? (
              <svg
                width={40}
                height={40}
                style={{
                  position: "absolute",
                  left: WIN.l - 34 + Math.sin(f * 0.3) * 4,
                  top: BOARD.t + [100 + 43, 192 + 30, 310 + 43][which - 1] - 20,
                  overflow: "visible",
                }}
              >
                <path d="M4 6 L30 20 L4 34 Z" fill={ORANGE} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ================= sfx ================= */}
      <Sfx name="click" at={HITS[1]} volume={0.3} />
      <Sfx name="click" at={HITS[4]} volume={0.3} />
      <Sfx name="stamp" at={at(1) - 2} volume={0.3} />
      <Sfx name="swish" at={CROSS} volume={0.35} />
      <Sfx name="whoosh" at={CLIP_IN} volume={0.18} />
      <Sfx name="pop" at={ROW[0]} volume={0.35} />
      <Sfx name="pop" at={ROW[1]} volume={0.35} />
      <Sfx name="click" at={B1} volume={0.25} />
      <Sfx name="pop" at={ROW[2]} volume={0.35} />
    </AbsoluteFill>
  );
};

/** One checklist row: empty box + grey placeholder until `litAt`, then orange box ✔ + content */
const CheckRow: React.FC<{ top: number; h: number; litAt: number; num: string; children: React.ReactNode }> = ({ top, h, litAt, num, children }) => {
  const f = useCurrentFrame();
  const lit = f >= litAt;
  const s = sp(f, litAt, { damping: 11, stiffness: 200 });
  const tick = interpolate(f, [litAt + 3, litAt + 11], [0, 1], clamp);
  const band = interpolate(f, [litAt, litAt + 8], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 92, top, width: 596, height: h }}>
      {/* highlight band */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: C.orangeSoft,
          transformOrigin: "left center",
          transform: `scaleX(${band})`,
          opacity: band > 0 ? 1 : 0,
        }}
      />
      <div style={{ position: "absolute", left: 10, top: 0, height: h, display: "flex", alignItems: "center", gap: 10 }}>
        {/* checkbox */}
        <div
          style={{
            width: 62,
            height: 62,
            flex: "none",
            borderRadius: 14,
            border: `5px solid ${lit ? C.ink : "#B9B9C2"}`,
            background: lit ? ORANGE : C.paper,
            boxSizing: "border-box",
            transform: `scale(${lit ? punch(f, litAt, 0.3, 4) : 1})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: h > 100 ? "flex-start" : "center",
            marginTop: h > 100 ? 8 : 0,
          }}
        >
          {lit ? (
            <svg width={40} height={40} style={{ overflow: "visible" }}>
              <path d="M5 21 L16 32 L36 7" fill="none" stroke={C.paper} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
            </svg>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: h > 100 ? "flex-start" : "center", gap: 8, alignSelf: h > 100 ? "flex-start" : "center", marginTop: h > 100 ? 6 : 0 }}>
          {/* ordinal badge (same round pill as the ①②③ in 第4步, in the chapter colour) */}
          <div
            style={{
              width: 52,
              height: 52,
              flex: "none",
              borderRadius: 26,
              background: lit ? ORANGE : "#ECECF0",
              border: `4px solid ${lit ? C.ink : "#C9C9D1"}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.num,
              fontSize: 34,
              lineHeight: 1,
              color: lit ? C.paper : "#B9B9C2",
              textShadow: lit ? `2px 2px 0 ${C.ink}` : undefined,
              transform: `scale(${lit ? punch(f, litAt + 2, 0.3, 4) : 1})`,
            }}
          >
            {num}
          </div>
          {lit ? (
            <div style={{ transform: `translateX(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 2) }}>{children}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ width: 300, height: 22, borderRadius: 11, background: "#ECECF0" }} />
              {h > 100 ? <div style={{ width: 200, height: 22, borderRadius: 11, background: "#ECECF0" }} /> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ at: number; litAt: number; text: string }> = ({ at, litAt, text }) => {
  const f = useCurrentFrame();
  const on = f >= at;
  const rowLit = f >= litAt; // full-contrast ink text as soon as the row is lit, yellow fill when its word is spoken
  const s = sp(f, at, { damping: 9, stiffness: 240 });
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT.black,
        fontSize: 36,
        lineHeight: 1.25,
        color: rowLit ? C.ink : "#A9A9B6",
        background: on ? C.yellow : C.paper,
        border: `3px ${on ? "solid" : "dashed"} ${on ? C.ink : rowLit ? "#8A8A96" : "#C9C9D1"}`,
        borderRadius: 14,
        padding: "0 8px",
        whiteSpace: "nowrap",
        transform: `scale(${on ? interpolate(s, [0, 1], [1.35, 1]) : 1})`,
        boxShadow: on ? `3px 3px 0 ${C.ink}` : undefined,
      }}
    >
      {text}
    </span>
  );
};

const WinLabel: React.FC<{ text: string }> = ({ text }) => (
  <span
    style={{
      fontFamily: FONT.black,
      fontSize: 36,
      lineHeight: 1.2,
      color: C.paper,
      background: ORANGE,
      border: `4px solid ${C.ink}`,
      borderRadius: 14,
      padding: "0 14px",
      whiteSpace: "nowrap",
      textShadow: `2px 2px 0 ${C.ink}`,
    }}
  >
    {text}
  </span>
);

export default Step2Check;
