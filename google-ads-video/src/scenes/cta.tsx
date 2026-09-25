import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { clamp, DrawArrow, Emoji, Pop, Sfx, useShake, useSpring } from "../components/kit";
import { Tag } from "../components/Shared";
import { idOfKind, talkingAt } from "../components/Mascots";
import { BurstRing, Buddy, CHECK_W, Checklist, GOLD, PlusIcon, Sparkle, StarSticker } from "../components/ending/parts";
import { BORDER, C, FONT } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const INK = C.ink;
const STAR = { cx: 792, cy: 446, size: 452 };
const LIST = { x: 46, y: 222, s: 0.74 };
const BTN = { cx: 540, cy: 796, w: 520, h: 144 };
const PUP = { x: 700, y: 912, size: 228 };
const CAT = { x: 130, y: 912, size: 228 };
const BB = { x: 96, y: 866, size: 300 }; // the 加预算 button waiting below the checklist during line 0

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();

  const SLAP = Math.max(at(0) + 6, wordAt(0, "收藏") - 2);
  const LIST_IN = wordAt(0, "加预算前") - 6;
  const CHECK = wordAt(0, "对一遍") - 2;
  const flash = [CHECK, CHECK + 5, CHECK + 10, CHECK + 15];
  const FOLLOW = at(1) - 5;
  const CAT_IN = at(1) - 12;
  const GLINT = at(1) + 2;
  const WAVE = at(1) + 8;
  const TAP = wordAt(1, "少走弯路") - 6;

  const talkDog = talkingAt(idOfKind("dog"), scene.start + f);
  const talkCat = talkingAt(idOfKind("cat"), scene.start + f);

  /* 阿冲 leaps in holding the star, flings it at the screen */
  const REL = SLAP - 6; // star leaves his paws
  const up = interpolate(f, [0, REL], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const down = interpolate(f, [REL + 2, SLAP + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const jump = -230 * up * (1 - down);
  const land = interpolate(f, [SLAP + 10, SLAP + 13, SLAP + 20], [0, 1, 0], clamp);
  const pupIn = useSpring(0, { damping: 14, stiffness: 160 });
  const holdArm = f < REL ? 168 : interpolate(f, [REL, REL + 4, SLAP + 10], [168, 120, 20], clamp);
  const waving = f >= WAVE;
  const waveA = Math.sin((f - WAVE) * 0.45) * 24;

  /* star sticker: held → flies at the camera → slams */
  const u = PUP.size / 200;
  const heldX = PUP.x + 100 * u;
  const heldY = PUP.y + jump + (1 - pupIn) * 500 - 30;
  const fly = interpolate(f, [REL, SLAP], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const starS = useSpring(SLAP, { damping: 10, stiffness: 230 });
  const starX = interpolate(fly, [0, 1], [heldX, STAR.cx]);
  const starY = interpolate(fly, [0, 1], [heldY, STAR.cy]);
  const starScale = f < SLAP ? interpolate(fly, [0, 1], [0.34, 1.13]) : interpolate(starS, [0, 1], [1.13, 1]);
  const starRot = f < SLAP ? interpolate(fly, [0, 1], [-14, 24]) : interpolate(starS, [0, 1], [24, 8]);
  const shakeX = useShake(SLAP + 1, 14, 14);
  const shakeY = useShake(SLAP + 2, 12, 8);
  const starBob = f > SLAP + 20 ? Math.sin(f * 0.1) * 6 : 0;
  const shine = ((f - SLAP - 10) % 60) / 26;

  /* checklist */
  const listS = useSpring(LIST_IN, { damping: 14, stiffness: 160 });
  const pencilT = interpolate(f, [CHECK - 4, CHECK + 20], [0, 1], clamp);

  /* 加预算 button: pops in below the checklist, then slides out left before 欧姐 walks in */
  const BB_IN = LIST_IN + 3;
  const BB_OUT = CAT_IN - 6;
  const bbIn = useSpring(BB_IN, { damping: 11, stiffness: 190 });
  const bbOut = interpolate(f, [BB_OUT, BB_OUT + 11], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bbShift = -620 * bbOut;

  /* follow button */
  const btnS = useSpring(FOLLOW, { damping: 9, stiffness: 220 });
  const beat = f >= at(1) ? Math.max(0, Math.sin((f - at(1)) * 0.28)) ** 3 : 0;
  const tapDown = interpolate(f, [TAP + 6, TAP + 9, TAP + 14], [0, 1, 0], clamp);
  const btnScale = interpolate(btnS, [0, 1], [0.2, 1]) * (1 + 0.08 * beat) * (1 - 0.07 * tapDown);

  /* 欧姐 */
  const catS = useSpring(CAT_IN, { damping: 13, stiffness: 150 });
  const glint = interpolate(f, [GLINT, GLINT + 12], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      {/* checklist thumbnail */}
      {f >= LIST_IN ? (
        <div
          style={{
            position: "absolute",
            left: LIST.x,
            top: LIST.y + Math.sin(f * 0.08) * 4,
            transformOrigin: "0 0",
            transform: `translateX(${(1 - listS) * -560}px) rotate(${-4 + (1 - listS) * -10}deg) scale(${LIST.s})`,
          }}
        >
          <Checklist tickAt={[0, 0, 0, 0]} flash={flash} />
          {pencilT > 0 && pencilT < 1 ? (
            <div
              style={{
                position: "absolute",
                left: CHECK_W - 70,
                top: 120 + pencilT * 400,
                transform: `rotate(${-10 + Math.sin(f * 1.3) * 10}deg)`,
              }}
            >
              <Emoji e="✏️" size={96} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 加预算 button ← checklist: "check the list before you press it" */}
      {f >= BB_IN && f < BB_OUT + 12 ? (
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${bbShift}px)` }}>
          <DrawArrow at={CHECK - 6} dur={12} d="M 300 648 Q 336 760 252 858" width={600} height={900} color={INK} stroke={9} style={{ left: 0, top: 0 }} />
          <Pop at={CHECK} style={{ position: "absolute", left: 334, top: 716, transform: "rotate(-6deg)" }}>
            <Tag color={C.yellow} size={40}>
              先对一遍
            </Tag>
          </Pop>
          <div
            style={{
              position: "absolute",
              left: BB.x,
              top: BB.y + Math.sin(f * 0.12) * 5,
              transformOrigin: "50% 100%",
              transform: `scale(${bbIn}) rotate(${-4 + Math.sin(f * 0.1) * 2 - 10 * bbOut}deg)`,
            }}
          >
            <BudgetButton size={BB.size} />
          </div>
        </div>
      ) : null}

      {/* star sticker slapped on the screen */}
      <>
        <BurstRing p={interpolate(f, [SLAP + 1, SLAP + 18], [0, 1], clamp)} x={STAR.cx} y={STAR.cy} r={220} color={C.yellow} n={14} />
        <div
          style={{
            position: "absolute",
            left: starX - STAR.size / 2,
            top: starY - STAR.size / 2 + starBob,
            transform: `scale(${starScale * interpolate(pupIn, [0, 1], [0.6, 1])}) rotate(${starRot}deg)`,
            zIndex: f < REL + 2 ? 0 : 2,
          }}
        >
          <StarSticker size={STAR.size} label="收藏" fontSize={108} shine={f > SLAP ? shine : -1} />
        </div>
          {f >= SLAP + 6
            ? [
                { x: 530, y: 260, ph: 0 },
                { x: 1010, y: 300, ph: 1.7 },
                { x: 560, y: 640, ph: 3.1 },
                { x: 1000, y: 640, ph: 4.4 },
              ].map((p, i) => <Sparkle key={i} x={p.x} y={p.y} size={i % 2 ? 60 : 48} phase={p.ph} color={i % 2 ? C.yellow : GOLD} />)
            : null}
      </>

      {/* follow button */}
      {f >= FOLLOW ? (
        <>
          {[0, 1].map((k) => {
            const t = (((f - at(1) - k * 12) % 24) + 24) % 24;
            if (f < at(1) + k * 12) return null;
            const p = t / 24;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: BTN.cx - BTN.w / 2,
                  top: BTN.cy - BTN.h / 2,
                  width: BTN.w,
                  height: BTN.h,
                  borderRadius: BTN.h / 2,
                  border: `6px solid ${C.red}`,
                  transform: `scale(${1 + 0.35 * p}, ${1 + 0.7 * p})`,
                  opacity: 0.7 * (1 - p),
                  boxSizing: "border-box",
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: BTN.cx - BTN.w / 2,
              top: BTN.cy - BTN.h / 2,
              width: BTN.w,
              height: BTN.h,
              borderRadius: BTN.h / 2,
              background: `linear-gradient(180deg, #FF6B5E, ${C.red} 55%, #C9362A)`,
              border: `${BORDER}px solid ${INK}`,
              boxShadow: `${10 - 6 * tapDown}px ${10 - 6 * tapDown}px 0 ${INK}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
              transform: `scale(${btnScale}) translate(${4 * tapDown}px, ${4 * tapDown}px)`,
            }}
          >
            <PlusIcon size={70} />
            <span style={{ fontFamily: FONT.black, fontSize: 84, color: C.paper, textShadow: `4px 4px 0 ${INK}`, lineHeight: 1.1, whiteSpace: "nowrap" }}>关注</span>
          </div>
          {/* tap */}
          {f >= TAP - 8 ? (
            <div
              style={{
                position: "absolute",
                left: BTN.cx + 150,
                top: BTN.cy + 10 + interpolate(f, [TAP - 8, TAP + 2], [260, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) + tapDown * 18,
                opacity: interpolate(f, [TAP - 8, TAP - 2, TAP + 26, TAP + 34], [0, 1, 1, 0], clamp),
                transform: "rotate(-18deg)",
              }}
            >
              <Emoji e="👆" size={110} />
            </div>
          ) : null}
        </>
      ) : null}

      {/* 欧姐 waves */}
      {f >= CAT_IN ? (
        <div style={{ position: "absolute", left: CAT.x + (1 - catS) * -520, top: CAT.y }}>
          <Buddy
            kind="cat"
            size={CAT.size}
            talking={talkCat}
            mood={talkCat > 0.05 ? "normal" : "happy"}
            glint={glint}
            armL={14}
            armR={waving ? 112 + waveA * 0.8 : interpolate(catS, [0, 1], [14, 112])}
            wag={Math.sin(f * 0.2) * 10}
          />
        </div>
      ) : null}

      {/* 阿冲: jump, slap, then wave */}
      <div
        style={{
          position: "absolute",
          left: PUP.x,
          top: PUP.y + jump + (1 - pupIn) * 500,
          transformOrigin: "50% 100%",
          transform: `scale(${1 + 0.08 * land}, ${1 - 0.1 * land})`,
        }}
      >
        <Buddy
          kind="dog"
          size={PUP.size}
          talking={talkDog}
          mood={f < SLAP + 10 ? "happy" : talkDog > 0.05 ? "normal" : "happy"}
          armL={waving ? 150 - waveA : holdArm}
          armR={waving ? 14 : holdArm}
          stomp={[0, 0]}
          wag={Math.sin(f * 0.6) * 20}
        />
      </div>

      <Sfx name="whoosh" at={2} volume={0.25} />
      <Sfx name="stamp" at={SLAP} volume={0.5} />
      <Sfx name="sparkle" at={SLAP + 8} volume={0.3} />
      <Sfx name="swish" at={LIST_IN} volume={0.3} />
      <Sfx name="click" at={CHECK + 2} volume={0.3} />
      <Sfx name="click" at={TAP + 8} volume={0.35} />
    </AbsoluteFill>
  );
};

export default Cta;
