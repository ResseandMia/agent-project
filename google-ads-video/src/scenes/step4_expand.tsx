import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BudgetButton } from "../components/BudgetButton";
import { clamp, Emoji, Pop, Sfx, useFloat, useSpring } from "../components/kit";
import { idOfKind, MascotFace, talkingAt } from "../components/Mascots";
import { ChapterStamp, Panel, Tag } from "../components/Shared";
import { Arm, CAT, CHONG_SHOULDER, ChongHead, FingerPaw, Magnifier, NoteChong, StepPoint } from "../components/step4/parts";
import { BORDER, C, CHAPTER_COLOR, FONT, SHADOW } from "../theme";
import { useLineStarts, useWordTime } from "../timeline";

const GREEN = CHAPTER_COLOR["第4步"];
const INK = C.ink;

/* ------------------------------------------------------------------ */
/* Opening: an up arrow that splits into ← and → (horizontal expansion) */
/* ------------------------------------------------------------------ */
const ArrowShape: React.FC<{ color?: string }> = ({ color = GREEN }) => (
  <svg viewBox="0 0 200 300" width={170} height={255} style={{ overflow: "visible" }}>
    <path
      d="M100 8 L192 118 L134 118 L134 292 L66 292 L66 118 L8 118 Z"
      fill={color}
      stroke={INK}
      strokeWidth={10}
      strokeLinejoin="round"
    />
    <path d="M100 34 L56 88" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
  </svg>
);

const SplitArrow: React.FC<{ enter: number; split: number; hourglass: number; out: number }> = ({ enter, split, hourglass, out }) => {
  const f = useCurrentFrame();
  const sIn = useSpring(enter, { damping: 12 });
  const sSplit = useSpring(split, { damping: 13, stiffness: 150 });
  const sOut = interpolate(f, [out, out + 10], [1, 0], clamp);
  const bob = useFloat(10, 0.12);
  const hg = useSpring(hourglass, { damping: 10 });
  if (f < enter || sOut <= 0) return null;
  const cx = 540;
  const cy = 1045;
  const arrow = (dir: -1 | 1) => {
    const rot = dir * 90 * sSplit;
    const dx = dir * 250 * sSplit;
    return (
      <div
        key={dir}
        style={{
          position: "absolute",
          left: cx - 85 + dx,
          top: cy - 128 + (1 - sIn) * 300 + (1 - sSplit) * bob,
          transform: `rotate(${rot}deg) scale(${0.9 + 0.1 * sIn})`,
          opacity: Math.min(1, sIn * 2),
        }}
      >
        <ArrowShape />
      </div>
    );
  };
  const pulse = f > split + 14 ? 1 + Math.sin((f - split) * 0.25) * 0.04 : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: sOut, transform: `scale(${pulse})`, transformOrigin: `${cx}px ${cy}px` }}>
      {/* speed lines behind the horizontal arrows */}
      {sSplit > 0.3
        ? [-1, 1].map((d) =>
            [0, 1, 2].map((k) => (
              <div
                key={`${d}${k}`}
                style={{
                  position: "absolute",
                  top: cy - 60 + k * 50,
                  left: d < 0 ? 40 + ((f * 6 + k * 40) % 60) : undefined,
                  right: d > 0 ? 40 + ((f * 6 + k * 40) % 60) : undefined,
                  width: 60,
                  height: 10,
                  borderRadius: 5,
                  background: INK,
                  opacity: 0.25 * sSplit,
                }}
              />
            )),
          )
        : null}
      {arrow(-1)}
      {arrow(1)}
      {f >= hourglass ? (
        <div
          style={{
            position: "absolute",
            left: cx - 70,
            top: cy - 70,
            width: 140,
            height: 140,
            borderRadius: 70,
            background: C.paper,
            border: `${BORDER}px solid ${INK}`,
            boxShadow: `6px 6px 0 ${INK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${hg}) rotate(${Math.sin(f * 0.15) * 12}deg)`,
          }}
        >
          <Emoji e="⏳" size={84} />
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Live line chart + magnifier                                          */
/* ------------------------------------------------------------------ */
const PLOT = { x: 618, y: 646, w: 369, h: 206 };
const N = 34; // samples visible
const REACH = 0.86; // tip never goes further right than this fraction
const val = (t: number) =>
  Math.max(0.1, Math.min(0.9, 0.28 + t * 0.006 + 0.1 * Math.sin(t * 0.45) + 0.06 * Math.sin(t * 1.13 + 1.3) + 0.03 * Math.sin(t * 2.7)));

const useTip = (start: number) => {
  const f = useCurrentFrame();
  const k = Math.max(0, (f - start) * 0.9);
  const step = (PLOT.w * REACH) / (N - 1);
  const offset = Math.max(0, k - (N - 1));
  return { k, step, offset, x: (k - offset) * step, y: (1 - val(k)) * PLOT.h };
};

const LiveChart: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  const tip = useTip(start);
  const pts: string[] = [];
  for (let t = tip.offset; t <= tip.k + 1e-6; t += 0.5) pts.push(`${((t - tip.offset) * tip.step).toFixed(1)},${((1 - val(t)) * PLOT.h).toFixed(1)}`);
  pts.push(`${tip.x.toFixed(1)},${tip.y.toFixed(1)}`);
  const line = pts.join(" ");
  const area = pts.length > 1 ? `0,${PLOT.h} ${line} ${tip.x.toFixed(1)},${PLOT.h}` : "";
  const pulse = 1 + 0.35 * Math.abs(Math.sin(f * 0.2));
  return (
    <svg width={PLOT.w} height={PLOT.h} style={{ display: "block", overflow: "visible" }}>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={PLOT.w} y1={g * PLOT.h} y2={g * PLOT.h} stroke="#E3E5EA" strokeWidth={3} strokeDasharray="10 8" />
      ))}
      <line x1={0} x2={PLOT.w} y1={PLOT.h} y2={PLOT.h} stroke={INK} strokeWidth={4} />
      {f >= start ? (
        <>
          {area ? <polygon points={area} fill={`${GREEN}33`} /> : null}
          <polyline points={line} fill="none" stroke={GREEN} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={tip.x} cy={tip.y} r={16 * pulse} fill={`${GREEN}44`} />
          <circle cx={tip.x} cy={tip.y} r={10} fill={GREEN} stroke={INK} strokeWidth={4} />
        </>
      ) : null}
    </svg>
  );
};

const WatchGroup: React.FC<{ panelAt: number; lineStart: number; catAt: number; glintAt: number; out: number; absStart: number }> = ({
  panelAt,
  lineStart,
  catAt,
  glintAt,
  out,
  absStart,
}) => {
  const f = useCurrentFrame();
  const tip = useTip(lineStart);
  const sCat = useSpring(catAt, { damping: 12 });
  const o = interpolate(f, [out, out + 8], [1, 0], clamp);
  const bob = useFloat(6, 0.1, 1);
  if (f < panelAt || o <= 0) return null;
  const lensX = PLOT.x + tip.x;
  const lensY = PLOT.y + tip.y;
  const r = 50;
  const handle = 92;
  const deg = 118;
  const box = (r + handle) * 2 + 20;
  const rad = (deg * Math.PI) / 180;
  const pawX = lensX + Math.cos(rad) * (r + handle - 6);
  const pawY = lensY + Math.sin(rad) * (r + handle - 6);
  const glint = interpolate(f, [glintAt, glintAt + 14], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <Pop at={panelAt} from="right" distance={200} style={{ position: "absolute", left: 590, top: 540 }}>
        <Panel title="实时数据" accent={GREEN} width={425} bodyStyle={{ padding: 22 }}>
          <LiveChart start={lineStart} />
        </Panel>
      </Pop>
      {f >= panelAt + 4 ? (
        <div
          style={{
            position: "absolute",
            left: 590 + 425 - 62,
            top: 565,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: Math.abs(Math.sin(f * 0.12)) > 0.3 ? 1 : 0.35,
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.red, border: `3px solid ${INK}` }} />
        </div>
      ) : null}
      {f >= catAt ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 632,
              top: 915 + (1 - sCat) * 260 + bob,
              opacity: Math.min(1, sCat * 2),
            }}
          >
            <MascotFace kind="cat" size={176} mood="raise" glint={glint} talking={talkingAt(idOfKind("cat"), absStart + f) * 0.6} />
          </div>
          <div style={{ opacity: Math.min(1, sCat * 2), transform: `translateY(${(1 - sCat) * 260}px)` }}>
            <Magnifier r={r} handle={handle} deg={deg} style={{ left: lensX - box / 2, top: lensY - box / 2 }} />
            <svg width={60} height={60} style={{ position: "absolute", left: pawX - 30, top: pawY - 30, overflow: "visible" }}>
              <circle cx={30} cy={30} r={22} fill={CAT.main} stroke={INK} strokeWidth={5} />
              <path d="M22 34 L22 44 M30 36 L30 46 M38 34 L38 44" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            </svg>
          </div>
          <Pop at={glintAt} from="scale" style={{ position: "absolute", left: 845, top: 1010 }}>
            <div
              style={{
                fontFamily: FONT.black,
                fontSize: 40,
                color: C.paper,
                background: GREEN,
                border: `5px solid ${INK}`,
                borderRadius: 18,
                padding: "2px 16px",
                boxShadow: `5px 5px 0 ${INK}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transform: `rotate(${4 + Math.sin(f * 0.1) * 2}deg)`,
              }}
            >
              <Emoji e="👀" size={40} />
              盯紧
            </div>
          </Pop>
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Button group: the glass cover opens, one finger presses gently       */
/* ------------------------------------------------------------------ */
const BTN = { x: 236, size: 400, floor: 1190 };
const BTN_H = BTN.size * 0.82;
const BTN_S = BTN.size / 420;
const BTN_TOP = BTN.floor - BTN_H;
const DOME_X = BTN.x + BTN.size / 2;
const DOME_TOP = BTN_TOP + BTN_H - 252 * BTN_S;
// 阿冲's floating head, left of the button (head centre ≈ level with the dome)
const PUP_SIZE = 240;
const PUP_U = PUP_SIZE / 200;
const PUP_LEFT = 30;
const PUP_TOP = 872;
const PAW_SIZE = 96;

const PressGroup: React.FC<{ enter: number; sign: number; lift: number; paw: number; press: number; out: number; absStart: number }> = ({
  enter,
  sign,
  lift,
  paw,
  press,
  out,
  absStart,
}) => {
  const f = useCurrentFrame();
  const sIn = useSpring(enter, { damping: 13 });
  const o = interpolate(f, [out, out + 8], [1, 0], clamp);
  const cover = 1 - interpolate(f, [lift, lift + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sPaw = useSpring(paw, { damping: 14 });
  // gentle press: down, hold, up
  const pressed =
    interpolate(f, [press, press + 6], [0, 0.32], { ...clamp, easing: Easing.out(Easing.quad) }) -
    interpolate(f, [press + 14, press + 22], [0, 0.32], clamp);
  const sSign = useSpring(sign, { damping: 9, stiffness: 220 });
  const sPark = useSpring(lift + 2, { damping: 13, stiffness: 120 });
  const glow = interpolate(f, [press + 4, press + 12, press + 40], [0, 0.9, 0.35], clamp);
  const bob = useFloat(5, 0.1);
  const headBob = useFloat(6, 0.13, 1);
  if (f < enter || o <= 0) return null;
  const tipHover = DOME_TOP - 70;
  const tipTouch = DOME_TOP + pressed * 44 * BTN_S + 2;
  const tipTarget =
    f < press
      ? tipHover + Math.sin(f * 0.2) * 5 * sPaw
      : interpolate(f, [press, press + 6, press + 14, press + 24], [tipHover, tipTouch, tipTouch, tipHover - 10], clamp);
  const retract = interpolate(f, [press + 24, press + 36], [0, 1], clamp);
  const armO = f >= paw ? Math.min(1, sPaw * 3) * (1 - retract) : 0;
  const armOut = armO > 0.02;
  const headY = PUP_TOP + headBob;
  // shoulder: hidden behind the lower right of his head, so the arm grows out from under the chin
  const shoulder: [number, number] = [PUP_LEFT + CHONG_SHOULDER.R[0] * PUP_U, headY + CHONG_SHOULDER.R[1] * PUP_U];
  // fist centre: reaches out from near the shoulder to hover above the dome, then back
  const fistTarget: [number, number] = [DOME_X, tipTarget - PAW_SIZE * 0.92];
  const reach = Math.min(1, sPaw) * (1 - retract * 0.6);
  const fist: [number, number] = [
    shoulder[0] + 40 + (fistTarget[0] - shoulder[0] - 40) * reach,
    shoulder[1] - 60 + (fistTarget[1] - shoulder[1] + 60) * reach,
  ];
  const talking = talkingAt(idOfKind("dog"), absStart + f);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o * Math.min(1, sIn * 2), transform: `translateY(${(1 - sIn) * 260}px)` }}>
      {/* coins */}
      {[-1, 0, 1].map((d, i) => {
        const t0 = press + 6 + i * 3;
        const t = f - t0;
        if (t < 0 || t > 34) return null;
        const p = t / 34;
        return (
          <div
            key={d}
            style={{
              position: "absolute",
              left: DOME_X - 34 + d * 110 * p,
              top: DOME_TOP - 20 - 220 * Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.5) + (d === 0 ? -30 * p : 0),
              opacity: interpolate(p, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
              transform: `rotate(${d * 40 * p}deg) scale(${0.85 + 0.3 * p})`,
            }}
          >
            <Emoji e="🪙" size={68} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: BTN.x, top: BTN_TOP + bob * 0.2 }}>
        <BudgetButton size={BTN.size} cover={cover} pressed={pressed} glow={glow} />
      </div>
      {/* "✓ 优化完" sign: hangs on the glass cover, then detaches when the cover lifts and parks top-left */}
      {f >= sign
        ? (() => {
            const x0 = DOME_X - 120;
            const y0 = BTN_TOP + 20 * BTN_S - 96;
            const x1 = 80;
            const y1 = 620;
            const k = Math.min(1.05, sPark);
            const x = x0 + (x1 - x0) * k;
            const y = y0 + (y1 - y0) * k - Math.sin(Math.min(1, sPark) * Math.PI) * 90;
            const parked = f > lift + 16;
            const rot = parked ? -5 + Math.sin(f * 0.1) * 2.5 : Math.sin(f * 0.18) * 4 - 20 * Math.sin(Math.min(1, sPark) * Math.PI);
            return (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 240,
                  display: "flex",
                  justifyContent: "center",
                  transform: `scale(${sSign * (1 + 0.18 * Math.min(1, sPark))}) rotate(${rot}deg)`,
                  transformOrigin: "center bottom",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.black,
                    fontSize: 42,
                    color: C.paper,
                    background: GREEN,
                    border: `5px solid ${INK}`,
                    borderRadius: 18,
                    boxShadow: `5px 5px 0 ${INK}`,
                    padding: "2px 20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ 优化完
                </div>
              </div>
            );
          })()
        : null}
      {/* 阿冲's arm reaching over: one finger (the arm starts behind his head) */}
      <Arm from={shoulder} to={[fist[0] - 14, fist[1] + 6]} bend={-26} opacity={armO} />
      {/* 阿冲: floating head beside the button (same head-only look as in steps 1–3) */}
      <div style={{ position: "absolute", left: PUP_LEFT, top: headY, transform: `rotate(${f >= press ? Math.sin(f * 0.4) * 4 : -3}deg)` }}>
        <ChongHead
          size={PUP_SIZE}
          mood={f >= press + 4 ? "happy" : "normal"}
          talking={talking}
          paws={
            f >= press + 24
              ? // after the press: both paws up, cheering
                [
                  { x: 8, y: 122 + Math.sin(f * 0.5) * 8 },
                  { x: 192, y: 122 - Math.sin(f * 0.5) * 8 },
                ].slice(0, armOut ? 1 : 2)
              : // before: little fists at his sides, pumping with excitement
                [
                  { x: 12, y: 198 + Math.sin(f * 0.45) * 6 },
                  { x: 188, y: 198 - Math.sin(f * 0.45) * 6 },
                ].slice(0, armOut ? 1 : 2)
          }
        />
      </div>
      {armO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: fist[0] - PAW_SIZE / 2,
            top: fist[1] - PAW_SIZE * 0.44,
            opacity: armO,
            transform: `rotate(${(1 - Math.min(1, sPaw)) * -40}deg)`,
            transformOrigin: `${PAW_SIZE * 0.3}px ${PAW_SIZE * 0.44}px`,
          }}
        >
          <FingerPaw size={PAW_SIZE} />
        </div>
      ) : null}
      {f >= press && f < press + 30 ? (
        <svg width={260} height={120} style={{ position: "absolute", left: DOME_X - 130, top: DOME_TOP - 70, overflow: "visible" }}>
          {[-1, 1].map((d) => {
            const p = interpolate(f, [press + 4, press + 16], [0, 1], clamp);
            return (
              <g key={d} opacity={1 - p}>
                <line x1={130 + d * (50 + 30 * p)} y1={70 - 20 * p} x2={130 + d * (80 + 30 * p)} y2={40 - 30 * p} stroke={INK} strokeWidth={7} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 搜索字词报告 table                                                  */
/* ------------------------------------------------------------------ */
type Row = { term: string; v: number; hi?: boolean; brand?: boolean };
const ROWS: Row[] = [
  { term: "字词 A", v: 0.86, hi: true },
  { term: "品牌词", v: 0.94, brand: true },
  { term: "字词 B", v: 0.3 },
  { term: "字词 C", v: 0.74, hi: true },
  { term: "字词 D", v: 0.2 },
];
const ROW_H = 92;

const TableRow: React.FC<{ row: Row; i: number; enter: number; mark: number; grey: number; tagAt: number }> = ({
  row,
  i,
  enter,
  mark,
  grey,
  tagAt,
}) => {
  const f = useCurrentFrame();
  const s = useSpring(enter, { damping: 14 });
  const bar = interpolate(f, [enter + 3, enter + 17], [0, row.v], { ...clamp, easing: Easing.out(Easing.cubic) });
  const m = row.hi ? interpolate(f, [mark, mark + 9], [0, 1], clamp) : 0;
  const g = row.brand ? interpolate(f, [grey, grey + 10], [0, 1], clamp) : 0;
  const tagS = useSpring(tagAt, { damping: 12, stiffness: 220 });
  if (f < enter) return <div style={{ height: ROW_H }} />;
  const barColor = row.hi || row.brand ? GREEN : C.blue;
  const pulse = row.hi && f > tagAt + 10 ? 1 + 0.03 * Math.sin((f - tagAt) * 0.2) : 1;
  // idle once the highlight has landed: marker breathes, bar gently swells
  const idle = row.hi && f > mark + 12 ? Math.sin((f - mark - 12) * 0.2) : 0;
  const markerO = 0.32 + 0.08 * idle;
  const barScale = 1 + 0.02 * idle;
  const tagWobble = row.brand && f > tagAt + 8 ? Math.sin((f - tagAt - 8) * 0.1) * 3 : 0;
  return (
    <div
      style={{
        position: "relative",
        height: ROW_H,
        borderTop: i === 0 ? undefined : "3px dashed #D9DBE2",
        transform: `translateY(${(1 - s) * 60}px)`,
        opacity: Math.min(1, s * 1.8),
      }}
    >
      {/* green marker sweep */}
      {m > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -12,
            top: 12,
            height: ROW_H - 24,
            width: 870,
            background: GREEN,
            opacity: markerO,
            borderRadius: 12,
            transformOrigin: "left center",
            transform: `scaleX(${m}) skewX(-10deg)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          opacity: 1 - 0.62 * g,
          filter: g > 0 ? `grayscale(${g})` : undefined,
        }}
      >
        <div style={{ width: 250, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT.black, fontSize: 44, color: INK, whiteSpace: "nowrap" }}>{row.term}</span>
        </div>
        <div
          style={{
            width: 330,
            height: 36,
            borderRadius: 18,
            background: "#EEF0F4",
            border: `4px solid ${INK}`,
            overflow: "hidden",
            transform: `scale(${barScale})`,
            transformOrigin: "left center",
          }}
        >
          <div style={{ width: `${bar * 100}%`, height: "100%", background: barColor, borderRight: bar > 0.02 ? `4px solid ${INK}` : undefined }} />
        </div>
      </div>
      {/* right-hand tag (not faded) */}
      {(row.hi || row.brand) && f >= tagAt ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: ROW_H,
            display: "flex",
            alignItems: "center",
            transform: `scale(${tagS * pulse}) rotate(${row.brand ? -4 + tagWobble : 3}deg)`,
            transformOrigin: "right center",
          }}
        >
          {row.brand ? (
            <Tag color="#E1E2E8" text="#55555F" size={36}>
              不计入
            </Tag>
          ) : (
            <Tag color={GREEN} text={C.paper} size={36} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Emoji e="🎯" size={36} />
              重点投
            </Tag>
          )}
        </div>
      ) : null}
    </div>
  );
};

const SearchTable: React.FC<{ enter: number; mark: number; grey: number; brandTag: number; focusTag: number; out: number }> = ({
  enter,
  mark,
  grey,
  brandTag,
  focusTag,
  out,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [out, out + 8], [1, 0], clamp);
  const sIn = useSpring(enter, { damping: 14 });
  if (f < enter || o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 385,
        opacity: o * Math.min(1, sIn * 2),
        transform: `translateY(${(1 - sIn) * 120 - (1 - o) * 80}px)`,
      }}
    >
      <Panel title="搜索字词报告" accent={GREEN} width={940} bodyStyle={{ padding: "14px 28px 18px" }}>
        <div style={{ display: "flex", height: 54, alignItems: "center", borderBottom: `4px solid ${INK}` }}>
          <div style={{ width: 250, fontFamily: FONT.bold, fontSize: 36, color: C.muted }}>搜索字词</div>
          <div style={{ width: 330, fontFamily: FONT.bold, fontSize: 36, color: C.muted }}>转化</div>
        </div>
        {ROWS.map((r, i) => (
          <TableRow
            key={r.term}
            row={r}
            i={i}
            enter={enter + 6 + i * 6}
            mark={mark + (r.hi && i > 1 ? 8 : 0)}
            grey={grey}
            tagAt={r.brand ? brandTag : focusTag + (i > 1 ? 6 : 0)}
          />
        ))}
      </Panel>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Folder of good Meta creatives → Demand Gen / YouTube                  */
/* ------------------------------------------------------------------ */
const FOLDER = { x: 270, y: 620, w: 540, h: 300, flapTop: 706 };
const CARD_W = 150;
const CARD_H = 190;
const CARDS = [
  { e: "🎬", bg: C.blueSoft, inside: [355, 760], fan: [345, 500, -14], land: [232, 1062, -8], box: 0 },
  { e: "📸", bg: C.redSoft, inside: [480, 752], fan: [478, 484, -5], land: [336, 1056, 7], box: 0 },
  { e: "▶️", bg: C.yellowSoft, inside: [605, 752], fan: [612, 484, 5], land: [744, 1062, -7], box: 1 },
  { e: "🖼️", bg: C.greenSoft, inside: [728, 760], fan: [745, 500, 14], land: [848, 1056, 8], box: 1 },
];

const Creative: React.FC<{ e: string; bg: string; scale?: number }> = ({ e, bg, scale = 1 }) => (
  <div
    style={{
      width: CARD_W,
      height: CARD_H,
      background: C.paper,
      border: `5px solid ${INK}`,
      borderRadius: 18,
      boxShadow: `6px 6px 0 ${INK}`,
      padding: 10,
      boxSizing: "border-box",
      transform: `scale(${scale})`,
      display: "flex",
      flexDirection: "column",
      gap: 9,
      position: "relative",
    }}
  >
    <div
      style={{
        height: 100,
        borderRadius: 10,
        background: bg,
        border: `4px solid ${INK}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Emoji e={e} size={58} />
    </div>
    <div style={{ height: 12, width: "90%", borderRadius: 6, background: "#D5D7DE" }} />
    <div style={{ height: 12, width: "60%", borderRadius: 6, background: "#D5D7DE" }} />
    <div style={{ position: "absolute", right: -16, top: -18 }}>
      <Emoji e="🔥" size={40} />
    </div>
  </div>
);

const BOXES = [
  { x: 70, label: "Demand Gen", sub: "（需求开发）" },
  { x: 580, label: "YouTube", sub: "" },
];
const BOX = { y: 996, w: 430, h: 262, front: 1090 };

const MetaToChannels: React.FC<{
  folderAt: number;
  openAt: number;
  ghostAt: number;
  boxAt: [number, number];
  flyAt: [number, number];
}> = ({ folderAt, openAt, ghostAt, boxAt, flyAt }) => {
  const f = useCurrentFrame();
  const sGhost0 = useSpring(ghostAt, { damping: 12 });
  const sGhost1 = useSpring(ghostAt + 6, { damping: 12 });
  const sGhost = [sGhost0, sGhost1];
  const sF = useSpring(folderAt, { damping: 12 });
  const open = interpolate(f, [openAt - 4, openAt + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const float = useFloat(6, 0.09);
  const sBox0 = useSpring(boxAt[0], { damping: 11 });
  const sBox1 = useSpring(boxAt[1], { damping: 11 });
  const sBox = [sBox0, sBox1];
  if (f < folderAt) return null;
  const FLY = 17;
  const cardState = (i: number) => {
    const c = CARDS[i];
    const outT = openAt + i * 4;
    const pOut = interpolate(f, [outT, outT + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
    const flyT = flyAt[c.box] + (i % 2) * 6;
    const pFly = interpolate(f, [flyT, flyT + FLY], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const bobC = Math.sin(f * 0.12 + i * 1.3) * 7 * pOut * (1 - pFly);
    const x0 = c.inside[0] + (c.fan[0] - c.inside[0]) * pOut;
    const y0 = c.inside[1] + (c.fan[1] - c.inside[1]) * pOut + bobC + float * (1 - pOut);
    const r0 = c.fan[2] * pOut;
    const x = x0 + (c.land[0] - x0) * pFly;
    const y = y0 + (c.land[1] - y0) * pFly - Math.sin(pFly * Math.PI) * 120;
    const r = r0 + (c.land[2] - r0) * pFly + Math.sin(pFly * Math.PI) * (c.box ? 25 : -25);
    const sc = 1 - 0.18 * pFly;
    return { x, y, r, sc, flying: f >= flyT, landed: pFly >= 1, landT: flyT + FLY };
  };
  const states = CARDS.map((_, i) => cardState(i));
  const renderCard = (i: number) => {
    const st = states[i];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: st.x - CARD_W / 2,
          top: st.y - CARD_H / 2,
          transform: `rotate(${st.r}deg) scale(${st.sc})`,
        }}
      >
        <Creative e={CARDS[i].e} bg={CARDS[i].bg} />
      </div>
    );
  };
  const squash = (b: number) => {
    const landT = Math.min(...states.filter((_, i) => CARDS[i].box === b).map((s) => s.landT));
    const t = f - landT;
    return t >= 0 && t < 14 ? 1 - 0.07 * Math.sin((t / 14) * Math.PI) * (1 - t / 14) * 2 : 1;
  };
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* folder back + tab */}
      <div
        style={{
          position: "absolute",
          left: FOLDER.x,
          top: FOLDER.y + (1 - sF) * 300 + float,
          opacity: Math.min(1, sF * 2),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -40,
            width: 200,
            height: 60,
            background: "#E0A400",
            border: `${BORDER}px solid ${INK}`,
            borderRadius: "20px 20px 0 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FOLDER.w,
            height: FOLDER.h,
            background: "#E0A400",
            border: `${BORDER}px solid ${INK}`,
            borderRadius: "0 24px 24px 24px",
            boxShadow: SHADOW,
          }}
        />
      </div>
      {/* cards still in / leaving the folder */}
      {CARDS.map((_, i) => (states[i].flying ? null : f >= folderAt ? renderCard(i) : null))}
      {/* folder front flap */}
      <div
        style={{
          position: "absolute",
          left: FOLDER.x,
          top: FOLDER.flapTop + (1 - sF) * 300 + float,
          width: FOLDER.w,
          height: FOLDER.y + FOLDER.h - FOLDER.flapTop,
          opacity: Math.min(1, sF * 2),
          transformOrigin: "50% 100%",
          transform: `perspective(900px) rotateX(${-38 * open}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.yellow,
            border: `${BORDER}px solid ${INK}`,
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: FONT.black, fontSize: 44, color: INK, whiteSpace: "nowrap" }}>Meta 上跑得好的素材</span>
        </div>
        <div style={{ position: "absolute", right: -22, top: -46, transform: `rotate(${Math.sin(f * 0.2) * 8}deg) scale(${1 + 0.06 * Math.sin(f * 0.3)})` }}>
          <Emoji e="🔥" size={84} />
        </div>
      </div>
      {/* destination ghosts: dashed outlines waiting for the cards, solidified at boxAt */}
      {BOXES.map((b, i) => {
        const go = Math.min(1, sGhost[i] * 2) * interpolate(f, [boxAt[i] - 1, boxAt[i] + 2], [1, 0], clamp);
        if (f < ghostAt + i * 6 || go <= 0) return null;
        const breathe = 0.35 + 0.08 * Math.sin(f * 0.15 + i * 1.6);
        return (
          <div
            key={`ghost${i}`}
            style={{
              position: "absolute",
              left: b.x + 8,
              top: BOX.y + 8,
              width: BOX.w - 16,
              height: BOX.h - 16,
              borderRadius: 26,
              border: `6px dashed ${INK}`,
              background: "rgba(255,255,255,0.35)",
              opacity: go * breathe,
              transform: `scale(${0.8 + 0.2 * sGhost[i]}) translateY(${Math.sin(f * 0.12 + i) * 4}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.num,
              fontSize: 110,
              color: INK,
            }}
          >
            ?
          </div>
        );
      })}
      {/* boxes (back walls) */}
      {BOXES.map((b, i) =>
        f >= boxAt[i] ? (
          <div
            key={`back${i}`}
            style={{
              position: "absolute",
              left: b.x,
              top: BOX.y + (1 - sBox[i]) * 40,
              width: BOX.w,
              height: BOX.h,
              opacity: Math.min(1, sBox[i] * 2),
              transform: `scale(${0.8 + 0.2 * sBox[i]}) scaleY(${squash(i)})`,
              transformOrigin: "50% 100%",
              background: C.greenSoft,
              border: `${BORDER}px solid ${INK}`,
              borderRadius: 26,
              boxShadow: SHADOW,
            }}
          />
        ) : null,
      )}
      {/* flying / landed cards */}
      {CARDS.map((_, i) => (states[i].flying ? renderCard(i) : null))}
      {/* boxes (front walls with labels) */}
      {BOXES.map((b, i) =>
        f >= boxAt[i] ? (
          <div
            key={`front${i}`}
            style={{
              position: "absolute",
              left: b.x,
              top: BOX.front + (1 - sBox[i]) * 40,
              width: BOX.w,
              height: BOX.y + BOX.h - BOX.front,
              opacity: Math.min(1, sBox[i] * 2),
              transform: `scale(${0.8 + 0.2 * sBox[i]}) scaleY(${squash(i)})`,
              transformOrigin: "50% 100%",
              background: C.paper,
              border: `${BORDER}px solid ${INK}`,
              borderRadius: 26,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <span style={{ fontFamily: FONT.num, fontSize: b.sub ? 50 : 56, color: INK, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b.label}</span>
            {b.sub ? <span style={{ fontFamily: FONT.bold, fontSize: 34, color: C.muted, whiteSpace: "nowrap", lineHeight: 1.2 }}>{b.sub}</span> : null}
          </div>
        ) : null,
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 阿冲 with notebook: centre (具体怎么扩？) → shrinks into the corner    */
/* ------------------------------------------------------------------ */
const NotesChong: React.FC<{ enter: number; move: number; out: number; absStart: number }> = ({ enter, move, out, absStart }) => {
  const f = useCurrentFrame();
  const sIn = useSpring(enter, { damping: 11 });
  const sMove = useSpring(move, { damping: 15, stiffness: 140 });
  const o = interpolate(f, [out, out + 8], [1, 0], clamp);
  const bob = useFloat(6, 0.14);
  const q1 = useSpring(enter + 6, { damping: 8 });
  const q2 = useSpring(enter + 14, { damping: 8 });
  if (f < enter || o <= 0) return null;
  const size = 280;
  const x = interpolate(sMove, [0, 1], [400, 862]);
  const y = interpolate(sMove, [0, 1], [600, 1090]);
  const sc = interpolate(sMove, [0, 1], [1, 0.5]) * interpolate(sIn, [0, 1], [0.4, 1]);
  const penWiggle = Math.sin(f * 0.9) * 12;
  const write = interpolate(f, [enter + 6, move + 90], [0, 1], clamp);
  const talking = talkingAt(idOfKind("dog"), absStart + f);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob * (1 - sMove),
        transform: `scale(${sc})`,
        transformOrigin: "0 0",
        opacity: o * Math.min(1, sIn * 2),
      }}
    >
      <NoteChong size={size} talking={talking} write={write} pen={penWiggle} noteW={78} />
      {sMove < 0.5 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: size + 10,
              top: 10,
              fontFamily: FONT.display,
              fontSize: 120,
              color: GREEN,
              WebkitTextStroke: `4px ${INK}`,
              transform: `scale(${q1}) rotate(${12 + Math.sin(f * 0.2) * 6}deg)`,
              opacity: 1 - sMove * 2,
            }}
          >
            ?
          </div>
          <div
            style={{
              position: "absolute",
              left: size + 90,
              top: 90,
              fontFamily: FONT.display,
              fontSize: 80,
              color: C.yellow,
              WebkitTextStroke: `4px ${INK}`,
              transform: `scale(${q2}) rotate(${-10 + Math.sin(f * 0.25) * 6}deg)`,
              opacity: 1 - sMove * 2,
            }}
          >
            ?
          </div>
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
export default function Step4Expand() {
  const f = useCurrentFrame();
  const { at, scene } = useLineStarts();
  const wordAt = useWordTime();

  // line 0 — chapter opener
  const split = wordAt(0, "横向扩量") - 2;
  const hourglass = wordAt(0, "耐心评估") - 4;
  const shrink = at(1) - 10;
  // line 1 — button + live data
  const groupIn = at(1) - 10;
  const sign = wordAt(1, "优化完") - 4;
  const lift = sign + 12;
  const pawIn = lift + 8;
  const press = wordAt(1, "加预算") - 2;
  const panelAt = lift + 4;
  const catAt = wordAt(1, "同时") - 4;
  const glintAt = wordAt(1, "盯紧") - 2;
  const l1Out = at(2) - 6;
  // line 2 — 具体怎么扩？
  const pupIn = at(2) - 4;
  // line 3/4 — search terms
  const tableIn = at(3) - 5;
  const mark = wordAt(3, "高转化词") - 6;
  const grey = at(4);
  const brandTag = at(4) + 6;
  const focusTag = wordAt(4, "重点投") - 6;
  const l4Out = at(5) - 8;
  // line 5/6 — creatives
  const folderAt = at(5) - 4;
  const openAt = wordAt(5, "跑得好") - 4;
  const dgFly = wordAt(6, "Demand") - 2;
  const ytFly = wordAt(6, "YouTube") - 12;

  const stampO = interpolate(f, [l1Out, l1Out + 8], [1, 0], clamp);
  // chapter-opener sunburst, same treatment as the 01/02/03 openers
  const rays = interpolate(f, [2, 10, shrink, shrink + 10], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      {rays > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: 535 - 560,
            width: 1120,
            height: 1120,
            borderRadius: "50%",
            opacity: rays * 0.9,
            background: `repeating-conic-gradient(from ${f * 0.6}deg, ${C.greenSoft} 0deg 9deg, transparent 9deg 18deg)`,
            WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 30%, transparent 68%)",
          }}
        />
      ) : null}
      {/* chapter opener (scaled so the long title fits the frame) */}
      {stampO > 0 ? (
        <AbsoluteFill style={{ transform: "scale(0.86)", transformOrigin: "540px 270px", opacity: stampO }}>
          <ChapterStamp at={at(0)} num="04" title="横向扩量，并且耐心评估" color={GREEN} shrinkAt={shrink} />
        </AbsoluteFill>
      ) : null}
      <SplitArrow enter={4} split={split} hourglass={hourglass} out={shrink - 2} />
      <Sfx name="swish" at={split} volume={0.35} />
      <Sfx name="pop" at={hourglass} volume={0.3} />

      {/* line 1 */}
      <PressGroup enter={groupIn} sign={sign} lift={lift} paw={pawIn} press={press} out={l1Out} absStart={scene.start} />
      <WatchGroup panelAt={panelAt} lineStart={panelAt + 6} catAt={catAt} glintAt={glintAt} out={l1Out} absStart={scene.start} />
      <Sfx name="swish" at={lift} volume={0.3} />
      <Sfx name="coin" at={press + 6} volume={0.4} />
      <Sfx name="sparkle" at={glintAt} volume={0.25} />


      {/* line 3/4 */}
      <StepPoint at={tableIn} num="1" label="找高转化词" out={l4Out} />
      <SearchTable enter={tableIn} mark={mark} grey={grey} brandTag={brandTag} focusTag={focusTag} out={l4Out} />
      <Pop at={brandTag + 8} from="left" out={l4Out} style={{ position: "absolute", left: 76, top: 1078 }}>
        <div style={{ fontFamily: FONT.bold, fontSize: 36, color: C.muted, whiteSpace: "nowrap" }}>（找高转化词时排除品牌词）</div>
      </Pop>
      {/* line 2 → 4: puppy takes notes (drawn above the table while it shrinks into the corner) */}
      <NotesChong enter={pupIn} move={at(3) - 8} out={l4Out} absStart={scene.start} />
      <Sfx name="pop" at={pupIn + 2} volume={0.3} />
      <Sfx name="sparkle" at={mark} volume={0.3} />
      <Sfx name="pop" at={brandTag} volume={0.3} />
      <Sfx name="pop" at={focusTag} volume={0.35} />

      {/* line 5/6 */}
      <StepPoint at={folderAt - 2} num="2" label="跑得好的素材" />
      <MetaToChannels folderAt={folderAt} openAt={openAt} ghostAt={at(5) + 22} boxAt={[at(6) - 10, at(6) - 4]} flyAt={[dgFly, ytFly]} />
      <Sfx name="pop" at={openAt} volume={0.3} />
      <Sfx name="pop" at={dgFly + 17} volume={0.3} />
      <Sfx name="pop" at={ytFly + 17} volume={0.3} />
    </AbsoluteFill>
  );
}
