import React from "react";
import { AbsoluteFill, Easing, Freeze, interpolate, useCurrentFrame } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { clamp, Marker, Sfx, useFloat, useShake, useSpring } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { Burst, Coin, Lock, Paw, Puff, SpeedLines, StopSign } from "../components/opening/props";
import { Panel } from "../components/Shared";
import { BORDER, C, FONT, SHADOW } from "../theme";
import { useLineStarts, useScene, useWordTime } from "../timeline";

// ── layout ────────────────────────────────────────────────────────────────
const BTN = 520; // big button size
const BTN_L = 540 - BTN / 2;
const BTN_T = 700;
const BTN_H = BTN * 0.82;
const GROUP_OY = BTN_T - 10;
const GROUP_ORIGIN = `540px ${GROUP_OY}px`;
const GROUP_SCALE = 0.6;
const GROUP_TY = 460 - GROUP_OY + 6; // group top (stop sign) lands at y≈460 in phase C
const REC_X = 890; // where 阿冲 lands after bouncing off the cover
const REC_Y = BTN_T + 145;

const DOG = "chong";
const CAT = "ou";

const useGroupShrink = (at: number) => useSpring(at, { damping: 15, stiffness: 150 });

/** Phase-C shrink of the button group (button + cover + cat) so the row of puppies fits below. */
const useGroupTransform = (at: number) => {
  const s = useGroupShrink(at);
  return { transformOrigin: GROUP_ORIGIN, transform: `translateY(${GROUP_TY * s}px) scale(${1 - (1 - GROUP_SCALE) * s})` };
};

// ── mini ad dashboard ───────────────────────────────────────────────────────
const MiniDashboard: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const f = useCurrentFrame();
  const bob = useFloat(6, 0.09);
  const out = useSpring(exitAt, { damping: 20, stiffness: 160 });
  // the ↑ hops faster and faster until 「停！」 (phase = ∫ speed, speed 0.2 → ~0.55 by frame 76)
  const fe = Math.min(f, ESCALATE_END);
  const hop = Math.abs(Math.sin(fe * 0.2 + fe * fe * 0.0023)) * (22 + 6 * (fe / ESCALATE_END));
  const dot = 1 + 0.25 * Math.sin(fe * 0.35 + fe * fe * 0.003);
  if (out > 0.995) return null;
  const pts: Array<[number, number]> = [
    [8, 112],
    [48, 92],
    [86, 100],
    [124, 66],
    [160, 74],
    [196, 30],
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 178 + bob,
        transform: `translate(${-900 * out}px, ${-120 * out}px) rotate(${-3 - 28 * out}deg)`,
      }}
    >
      <Panel title="Google Ads" width={590} bodyStyle={{ padding: "22px 30px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FONT.bold, fontSize: 38, color: C.muted, lineHeight: 1.2 }}>广告表现：</div>
            <div style={{ fontFamily: FONT.black, fontSize: 64, color: C.ink, lineHeight: 1.2 }}>跑得还行</div>
          </div>
          <div style={{ position: "relative", width: 250, height: 140 }}>
            <svg width={210} height={140} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={C.green} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={196} cy={30} r={13 * dot} fill={C.green} stroke={C.ink} strokeWidth={4} />
            </svg>
            <svg width={64} height={96} viewBox="0 0 64 96" style={{ position: "absolute", right: 0, top: 4 - hop, overflow: "visible" }}>
              <path d="M32 4 L60 40 L42 40 L42 90 L22 90 L22 40 L4 40 Z" fill={C.ink} transform="translate(5 5)" />
              <path d="M32 4 L60 40 L42 40 L42 90 L22 90 L22 40 L4 40 Z" fill={C.green} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Panel>
    </div>
  );
};

// ── coin fountain behind the button (phase A) ─────────────────────────────
// coins shoot out in bursts whose cadence speeds up toward 「停！」 (14 → 5 frames apart);
// the two negative bursts make sure frame 0 already has coins in the air.
const ESCALATE_END = 76;
const BURSTS = [-26, -12, 0, 14, 27, 38, 47, 55, 62, 67, 72, 76];
const COIN_LIFE = 44;

/** 0…1 kick of the big button on each coin burst (fast rise, quick decay) */
const burstPulse = (f: number, until: number) => {
  let last = -999;
  for (const b of BURSTS) if (b <= f && b < until) last = b;
  const t = f - last;
  if (t < 0 || t > 14) return 0;
  return t < 2 ? t / 2 : Math.exp(-(t - 2) / 3.5);
};

const CoinFountain: React.FC<{ endAt: number }> = ({ endAt }) => {
  const f = useCurrentFrame();
  const vanish = interpolate(f, [endAt, endAt + 5], [1, 0], clamp);
  if (vanish <= 0) return null;
  const coins: React.ReactNode[] = [];
  BURSTS.forEach((b, j) => {
    const tau = f - b;
    if (tau < 0 || tau > COIN_LIFE) return;
    const n = j < 5 ? 3 : j < 9 ? 4 : 5;
    for (let c = 0; c < n; c++) {
      const side = (c + j) % 2 === 0 ? -1 : 1;
      const vx = side * (3.8 + ((c * 7 + j * 3) % 5) * 1.15);
      const vy = -(20 + ((c * 3 + j * 5) % 4) * 1.6);
      const x = 540 + vx * tau;
      const y = 980 + vy * tau + 0.55 * tau * tau;
      const o = interpolate(tau, [0, 3, COIN_LIFE - 6, COIN_LIFE], [0, 1, 1, 0], clamp) * vanish;
      coins.push(<Coin key={`${j}-${c}`} size={66} spin={f * 0.22 + c + j} style={{ left: x - 33, top: y - 33, opacity: o }} />);
    }
  });
  return <>{coins}</>;
};

// ── 阿冲 diving at the button, then recoiling off the glass cover ───────────
const ChongDiver: React.FC<{ slam: number; poof: number; wordRush: number }> = ({ slam, poof, wordRush }) => {
  const f = useCurrentFrame();
  const scene = useScene();
  const bob = useFloat(10, 0.16);
  const rc = useSpring(slam + 1, { damping: 9, stiffness: 170 });
  const excl = useSpring(slam + 3, { damping: 10, stiffness: 260 });
  const gone = interpolate(f, [poof, poof + 5], [1, 0], clamp);
  if (gone <= 0) return null;
  // phase A path: glides in from the upper right, then on 「马上」 a short wind-back and a ~70px lunge
  // down-left at the button, growing 12% bigger (he stays there, looming, until the freeze)
  const p = interpolate(f, [0, 76], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const lunge = interpolate(f, [wordRush - 2, wordRush + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const windBack = interpolate(f, [wordRush - 8, wordRush - 2], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }) * (1 - lunge);
  const push = lunge - 0.25 * windBack;
  const big = 1 + 0.12 * lunge * Math.max(0, 1 - rc);
  const ax = interpolate(p, [0, 1], [850, 690]) - push * 60;
  const ay = interpolate(p, [0, 1], [470, 605]) + push * 36 + bob * (1 - rc);
  // after the recoil: nervous shiver so he never freezes on the stage
  const shiverX = rc * Math.sin(f * 1.3) * 2.5;
  const x = ax + (REC_X - ax) * rc + shiverX;
  const y = ay + (REC_Y - ay) * rc + rc * (Math.sin(f * 0.9) * 3 + bob * 0.4);
  const rot = interpolate(p, [0, 1], [-8, -22]) + (16 - interpolate(p, [0, 1], [-8, -22])) * rc + rc * Math.sin(f * 0.7) * 2;
  // arm: wind-up wiggle, then swings down at the dome right before the freeze
  const wind = Math.sin(f * 0.45) * 12;
  const armA = interpolate(f, [58, 80], [-28, -160], { ...clamp, easing: Easing.in(Easing.quad) }) + (f < 58 ? wind : 0);
  const armOut = interpolate(rc, [0, 0.35], [1, 0], clamp);
  const talking = talkingAt(idOfKind("dog") ?? DOG, scene.start + f);
  const mood = rc > 0.05 ? (f > slam + 34 ? "sweat" : "shock") : "money";
  const size = 250;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${gone * big})` }}>
      {rc < 0.3 ? <SpeedLines t={f} dir={128} len={200} opacity={1 - rc * 3} /> : null}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${rot}deg)` }}>
        {armOut > 0 ? (
          <div style={{ position: "absolute", left: -78, top: 52, opacity: armOut }}>
            <Paw length={150} width={58} angle={armA} />
          </div>
        ) : null}
        <MascotFace kind="dog" size={size} talking={talking} mood={mood} style={{ position: "absolute", left: -size / 2, top: -size / 2 }} />
        {armOut > 0 ? (
          <div style={{ position: "absolute", left: 70, top: 64, opacity: armOut }}>
            <Paw length={90} width={50} angle={40 + Math.sin(f * 0.3) * 10} />
          </div>
        ) : null}
      </div>
      {f >= slam + 3 ? (
        <div
          style={{
            position: "absolute",
            left: -30,
            top: -size / 2 - 96,
            fontFamily: FONT.display,
            fontSize: 96,
            color: C.red,
            textShadow: `4px 4px 0 ${C.ink}`,
            transform: `scale(${excl * (1 + 0.08 * Math.sin(f * 0.5))}) rotate(${12 + Math.sin(f * 0.35) * 4}deg)`,
            whiteSpace: "nowrap",
          }}
        >
          !!
        </div>
      ) : null}
    </div>
  );
};

// ── big button + glass cover + lock + hanging sign ───────────────────────────
const CoveredButton: React.FC<{ slam: number; shrinkAt: number }> = ({ slam, shrinkAt }) => {
  const f = useCurrentFrame();
  const shrink = useGroupShrink(shrinkAt);
  const tagBoost = 1 + (0.8 / GROUP_SCALE - 1) * shrink; // keep the sign text ≥ 35 px when the group shrinks
  const cover = useSpring(slam - 3, { damping: 11, stiffness: 320, mass: 0.7 });
  const lockIn = useSpring(slam + 6, { damping: 10, stiffness: 240 });
  const tagIn = useSpring(slam + 10, { damping: 12, stiffness: 200 });
  const kick = burstPulse(f, slam);
  const glow = f < slam ? Math.min(1, 0.55 + 0.3 * Math.sin(f * 0.3) + 0.3 * kick) : 0;
  const swing = Math.sin((f - slam - 10) * 0.16) * 14 * Math.exp(-Math.max(0, f - slam - 10) / 40) + Math.sin(f * 0.09) * 3;
  const gleam = interpolate((f - slam - 14) % 70, [0, 22], [0, 1], clamp);
  const tagY = BTN_T + BTN_H - 22;
  return (
    <>
      <BudgetButton
        size={BTN}
        cover={f < slam - 3 ? 0 : cover}
        glow={glow}
        style={{ position: "absolute", left: BTN_L, top: BTN_T, transform: `scale(${1 + 0.05 * kick}, ${1 + 0.035 * kick})`, transformOrigin: "50% 100%" }}
      />
      {/* moving shine across the glass */}
      {f >= slam + 4 ? (
        <div
          style={{
            position: "absolute",
            left: BTN_L + 50,
            top: BTN_T + 34,
            width: BTN - 100,
            height: 290,
            overflow: "hidden",
            borderRadius: "180px 180px 20px 20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              left: interpolate(gleam, [0, 1], [-120, BTN]),
              width: 46,
              height: 400,
              background: "rgba(255,255,255,0.75)",
              transform: "rotate(22deg)",
            }}
          />
        </div>
      ) : null}
      {/* lock + sign hanging from the front rim */}
      {f >= slam + 6 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: tagY,
              transformOrigin: "0 0",
              transform: `rotate(${swing}deg) scale(${tagIn * tagBoost})`,
            }}
          >
            <div style={{ position: "absolute", left: -3, top: 0, width: 6, height: 44, background: C.ink, borderRadius: 3 }} />
            <div
              style={{
                position: "absolute",
                left: -128,
                top: 38,
                width: 256,
                height: 92,
                background: C.yellow,
                border: `${BORDER}px solid ${C.ink}`,
                borderRadius: 18,
                boxShadow: `6px 6px 0 ${C.ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "absolute", top: 8, left: 119, width: 14, height: 14, borderRadius: 7, background: C.ink }} />
              <span style={{ fontFamily: FONT.black, fontSize: 44, color: C.ink, marginTop: 10 }}>还没排查</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 540 - 42, top: tagY - 92, transform: `scale(${lockIn})`, transformOrigin: "50% 100%" }}>
            <Lock size={84} open={interpolate(lockIn, [0, 1], [0.8, 0], clamp)} />
          </div>
        </>
      ) : null}
    </>
  );
};

// ── 欧姐 slides in with a stop paddle (lives outside the freeze: she stops time) ──
const OuStopper: React.FC<{ at: number; glintAt: number; raiseAt: number }> = ({ at, glintAt, raiseAt }) => {
  const f = useCurrentFrame();
  const scene = useScene();
  const s = useSpring(at, { damping: 13, stiffness: 190 });
  const sign = useSpring(at + 3, { damping: 7, stiffness: 150 });
  const bob = useFloat(5, 0.12, 1);
  if (f < at) return null;
  const x = interpolate(s, [0, 1], [-380, 40]);
  const talking = talkingAt(idOfKind("cat") ?? CAT, scene.start + f);
  const glint = interpolate(f, [glintAt, glintAt + 12], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: BTN_T - 20 + bob,
          transformOrigin: "85px 360px",
          transform: `rotate(${interpolate(sign, [0, 1], [-50, -6])}deg)`,
        }}
      >
        <StopSign size={180} stick={170} />
      </div>
      <MascotFace
        kind="cat"
        size={235}
        talking={talking}
        mood={f >= raiseAt ? "raise" : "normal"}
        glint={glint}
        style={{ position: "absolute", left: 0, top: BTN_T + 220 + bob * 0.5 }}
      />
    </div>
  );
};

// ── headline that slams in ───────────────────────────────────────────────────
const HookTitle: React.FC<{ at: number; markAt: number; shrinkAt: number }> = ({ at, markAt, shrinkAt }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 12, stiffness: 230 });
  const sh = useGroupShrink(shrinkAt);
  const pulse = 1 + 0.015 * Math.sin((f - at) * 0.2);
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        top: 162,
        width: 980,
        transform: `rotate(${interpolate(s, [0, 1], [-14, -2])}deg) scale(${interpolate(s, [0, 1], [2.3, 1]) * pulse * (1 - 0.18 * sh)})`,
        transformOrigin: "50% 0",
        opacity: Math.min(1, s * 3),
        background: C.paper,
        border: `${BORDER}px solid ${C.ink}`,
        borderRadius: 34,
        boxShadow: SHADOW,
        padding: "20px 20px 26px",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: FONT.display, fontSize: 86, lineHeight: 1.15, color: C.ink }}>Google Ads 想扩量</div>
      <div style={{ fontFamily: FONT.display, fontSize: 146, lineHeight: 1.12, color: C.ink, whiteSpace: "nowrap" }}>
        <span style={{ color: C.red }}>
          <Marker at={markAt} dur={9}>
            别急着
          </Marker>
        </span>
        加预算
      </div>
    </div>
  );
};

// ── phase C: 6 puppies whacking their own buttons ────────────────────────────
const XS = [130, 294, 458, 622, 786, 950];
const ORDER = [0, 3, 1, 4, 2, 5];
const ROW_BTN_T = 1150;

const MiniPup: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const f = useCurrentFrame();
  const scene = useScene();
  const e = useSpring(from + 1 + i * 1.5, { damping: 13, stiffness: 180 });
  const b = useSpring(from + i * 1.5, { damping: 11, stiffness: 220 });
  if (f < from) return null;
  const slap0 = from + 10 + ORDER[i] * 2;
  const tau = f >= slap0 ? (f - slap0) % 12 : -1;
  const down = tau < 0 ? 0 : tau < 3 ? tau / 3 : tau < 5 ? 1 : Math.max(0, 1 - (tau - 5) / 6);
  const pressed = Math.max(0, (down - 0.6) / 0.4);
  const hx = interpolate(e, [0, 1], [REC_X, XS[i]]);
  const hy = interpolate(e, [0, 1], [REC_Y, 1062]) + down * 10;
  const talking = talkingAt(idOfKind("dog") ?? DOG, scene.start + f) * 0.8;
  const armA = interpolate(down, [0, 1], [30, 178]);
  return (
    <>
      <div style={{ position: "absolute", left: XS[i] - 75, top: ROW_BTN_T, transform: `scale(${b})`, transformOrigin: "50% 100%" }}>
        <BudgetButton size={150} label="" pressed={pressed} />
      </div>
      {tau >= 3 && tau < 7 ? <Burst p={(tau - 3) / 4} r={46} n={7} style={{ left: XS[i] + 20, top: ROW_BTN_T + 36 }} /> : null}
      <div style={{ position: "absolute", left: hx, top: hy, transform: `scale(${interpolate(e, [0, 1], [0.35, 1])})` }}>
        <MascotFace kind="dog" size={120} mood="money" talking={talking} style={{ position: "absolute", left: -60, top: -60 }} />
        <div style={{ position: "absolute", left: 16, top: 38 }}>
          <Paw length={58} width={34} angle={armA} />
        </div>
      </div>
    </>
  );
};

const Bubble: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, { damping: 12, stiffness: 220 });
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 340,
        top: 838,
        width: 680,
        transform: `scale(${s}) rotate(${-1.5 + Math.sin(f * 0.2) * 0.6}deg)`,
        transformOrigin: "50% 120%",
      }}
    >
      <div
        style={{
          background: C.paper,
          border: `${BORDER}px solid ${C.ink}`,
          borderRadius: 30,
          boxShadow: `8px 8px 0 ${C.ink}`,
          padding: "12px 24px",
          textAlign: "center",
          fontFamily: FONT.black,
          fontSize: 46,
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        很多人的第一反应：<span style={{ color: C.red }}>加预算</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 318,
          bottom: -30,
          width: 0,
          height: 0,
          borderLeft: "22px solid transparent",
          borderRight: "22px solid transparent",
          borderTop: `32px solid ${C.ink}`,
        }}
      />
    </div>
  );
};

// ── scene ───────────────────────────────────────────────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useLineStarts();
  const wordAt = useWordTime();
  const STOP = at(1); // 「停！」
  const FREEZE_END = STOP + 12; // ~0.4 s frozen & desaturated
  const SLAM = FREEZE_END; // cover + title land, colour returns
  const PHASE_C = at(2) - 10;
  const POOF = at(2) - 8;
  const rush = wordAt(0, "马上");
  const markAt = wordAt(1, "别急着") - 2;

  const frozen = f >= STOP && f < FREEZE_END;
  const gray = f < STOP ? 0 : f < FREEZE_END ? 1 : interpolate(f, [FREEZE_END, FREEZE_END + 5], [1, 0], clamp);
  const shx = useShake(SLAM, 16, 22);
  const shy = useShake(SLAM + 1, 14, 14);
  const group = useGroupTransform(PHASE_C);
  const flash = f < STOP ? 0 : interpolate(f, [STOP, STOP + 5], [0.75, 0], clamp);
  // slow push-in while the greed builds (0 → 2%), a further 2.5% during the freeze, released on the slam
  const zoom =
    f < STOP
      ? 1 + 0.02 * interpolate(f, [0, STOP], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
      : frozen
        ? 1.02 + 0.025 * interpolate(f, [STOP, FREEZE_END], [0, 1])
        : 1 + 0.045 * interpolate(f, [SLAM, SLAM + 4], [1, 0], clamp);
  const puff = interpolate(f, [POOF, POOF + 14], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${shx}px, ${shy}px)` }}>
        {/* the world that gets frozen + desaturated */}
        <AbsoluteFill
          style={{
            filter: gray > 0 ? `grayscale(${gray}) contrast(${1 + 0.12 * gray})` : undefined,
            transform: `scale(${zoom})`,
          }}
        >
          <Freeze frame={STOP} active={frozen}>
            <MiniDashboard exitAt={SLAM} />
            <CoinFountain endAt={SLAM} />
            <AbsoluteFill style={group}>
              <CoveredButton slam={SLAM} shrinkAt={PHASE_C} />
            </AbsoluteFill>
            <ChongDiver slam={SLAM} poof={POOF} wordRush={rush} />
          </Freeze>
        </AbsoluteFill>

        {/* 欧姐 is not frozen */}
        <AbsoluteFill style={group}>
          <OuStopper at={STOP} glintAt={markAt} raiseAt={PHASE_C} />
        </AbsoluteFill>

        <HookTitle at={SLAM} markAt={markAt} shrinkAt={PHASE_C} />

        {/* phase C */}
        <Puff p={puff} size={220} style={{ left: REC_X, top: REC_Y }} />
        <Bubble at={at(2) + 2} />
        {XS.map((_, i) => (
          <MiniPup key={i} i={i} from={POOF} />
        ))}
      </AbsoluteFill>

      {/* freeze-frame cues */}
      {frozen ? (
        <AbsoluteFill>
          {[
            [56, 150, 0],
            [1024, 150, 90],
            [1024, 1284, 180],
            [56, 1284, 270],
          ].map(([x, y, r]) => (
            <div key={r} style={{ position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`, transformOrigin: "0 0" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 96, height: 12, background: C.ink, borderRadius: 6 }} />
              <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: 96, background: C.ink, borderRadius: 6 }} />
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} /> : null}

      <Sfx name="swish" at={rush - 3} volume={0.3} />
      {/* 1.2 s riser that tops out exactly on 「停！」 */}
      <Sfx name="riser" at={STOP - 36} volume={0.32} />
      <Sfx name="impact" at={SLAM} volume={0.45} />
      <Sfx name="pop" at={POOF} volume={0.4} />
      <Sfx name="click" at={POOF + 18} volume={0.3} />
    </AbsoluteFill>
  );
};

export default Hook;
