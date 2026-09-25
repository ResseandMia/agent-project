import React from "react";
import { useCurrentFrame } from "remotion";
import { TL } from "../timeline";
import { C } from "../theme";

export type Kind = "cat" | "dog";
export type Mood = "normal" | "happy" | "shock" | "smug" | "sad" | "money" | "dizzy" | "sweat" | "zen" | "raise";

const EXPERT_RE = /专家|老师|老司机|导师|顾问|排查师|投放师|expert|mentor|narrator|讲解|优化师|操盘/i;

/** Which drawing a speaker id uses: the expert is the cat with glasses, everyone else the puppy. */
export const kindOf = (id: string): Kind => {
  const ch = TL.characters.find((c) => c.id === id);
  if (!ch) return id.includes("expert") ? "cat" : "dog";
  const explicit = (ch as { kind?: string }).kind;
  if (explicit === "cat" || explicit === "dog") return explicit;
  if (EXPERT_RE.test(ch.role) || EXPERT_RE.test(ch.id)) return "cat";
  const others = TL.characters.filter((c) => c.id !== id);
  // if no one else is an expert, the first character is
  if (!others.some((o) => EXPERT_RE.test(o.role) || EXPERT_RE.test(o.id)) && TL.characters[0]?.id === id) return "cat";
  return "dog";
};

export const speakerStyle = (id: string) =>
  kindOf(id) === "cat" ? { color: C.blue, side: "left" as const } : { color: C.red, side: "right" as const };

export const idOfKind = (k: Kind) => TL.characters.find((c) => kindOf(c.id) === k)?.id ?? k;

const INK = C.ink;

const useBlink = (offset: number) => {
  const f = useCurrentFrame();
  const t = (f + offset) % 97;
  return t < 3 ? 0.12 : t < 5 ? 0.5 : 1;
};

const Mouth: React.FC<{ talking: number; mood: Mood; y: number }> = ({ talking, mood, y }) => {
  const open = Math.min(1, talking * 1.4);
  if (open > 0.08 || mood === "shock") {
    const ry = mood === "shock" ? 16 : 3 + open * 15;
    return (
      <g>
        <ellipse cx={100} cy={y + ry * 0.5} rx={mood === "shock" ? 13 : 12 + open * 4} ry={ry} fill="#7A1F1F" stroke={INK} strokeWidth={4} />
        <ellipse cx={100} cy={y + ry * 1.05} rx={8} ry={Math.max(1, ry * 0.35)} fill="#F07F8A" />
      </g>
    );
  }
  if (mood === "sad" || mood === "sweat" || mood === "dizzy") return <path d={`M86 ${y + 10} Q100 ${y - 2} 114 ${y + 10}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  if (mood === "happy" || mood === "smug" || mood === "money" || mood === "zen")
    return <path d={`M84 ${y} Q100 ${y + 18} 116 ${y}`} fill="#7A1F1F" stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
  return <path d={`M86 ${y} Q93 ${y + 8} 100 ${y} Q107 ${y + 8} 114 ${y}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
};

const Cat: React.FC<{ talking: number; mood: Mood; glint: number }> = ({ talking, mood, glint }) => {
  const blink = useBlink(0);
  const main = "#9FC3FF";
  return (
    <g>
      {/* ears */}
      <path d="M38 78 L48 18 L92 52 Z" fill={main} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M162 78 L152 18 L108 52 Z" fill={main} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M50 64 L55 34 L78 52 Z" fill="#F7B2BD" />
      <path d="M150 64 L145 34 L122 52 Z" fill="#F7B2BD" />
      {/* head */}
      <ellipse cx={100} cy={112} rx={82} ry={72} fill={main} stroke={INK} strokeWidth={6} />
      {/* cheeks */}
      <ellipse cx={52} cy={134} rx={13} ry={8} fill="#F7A1B0" opacity={0.75} />
      <ellipse cx={148} cy={134} rx={13} ry={8} fill="#F7A1B0" opacity={0.75} />
      {/* eyes */}
      {mood === "smug" ? (
        <>
          <path d="M60 106 Q70 98 80 106" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d="M120 106 Q130 98 140 106" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={70} cy={106} rx={9} ry={11 * blink} fill={INK} />
          <ellipse cx={130} cy={106} rx={9} ry={11 * blink} fill={INK} />
          {blink > 0.9 ? (
            <>
              <circle cx={73} cy={102} r={3} fill="#fff" />
              <circle cx={133} cy={102} r={3} fill="#fff" />
            </>
          ) : null}
        </>
      )}
      {/* glasses */}
      <circle cx={70} cy={106} r={25} fill="#ffffff33" stroke={INK} strokeWidth={5} />
      <circle cx={130} cy={106} r={25} fill="#ffffff33" stroke={INK} strokeWidth={5} />
      <path d="M95 104 Q100 98 105 104" fill="none" stroke={INK} strokeWidth={5} />
      {glint > 0 ? (
        <g opacity={Math.sin(Math.min(1, glint) * Math.PI)}>
          <path d={`M${50 + glint * 30} 90 L${60 + glint * 30} 84 L${70 + glint * 10} 124 L${60 + glint * 10} 128 Z`} fill="#fff" />
          <path d={`M${110 + glint * 30} 90 L${120 + glint * 30} 84 L${130 + glint * 10} 124 L${120 + glint * 10} 128 Z`} fill="#fff" />
        </g>
      ) : null}
      {mood === "raise" ? (
        <>
          <path d="M52 72 Q66 58 84 68" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d="M118 78 L146 78" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : null}
      {/* nose */}
      <path d="M94 128 L106 128 L100 135 Z" fill="#F07F8A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* whiskers */}
      <path d="M30 128 L60 132 M30 142 L60 140 M170 128 L140 132 M170 142 L140 140" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <Mouth talking={talking} mood={mood} y={140} />
    </g>
  );
};

const Dog: React.FC<{ talking: number; mood: Mood }> = ({ talking, mood }) => {
  const blink = useBlink(41);
  const main = "#F6C98B";
  const ear = "#B9763B";
  return (
    <g>
      {/* ears */}
      <path d="M36 60 Q6 70 14 130 Q22 160 48 140 Q56 100 54 70 Z" fill={ear} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M164 60 Q194 70 186 130 Q178 160 152 140 Q144 100 146 70 Z" fill={ear} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* head */}
      <path
        d="M100 34 C150 34 176 64 174 112 C172 160 140 184 100 184 C60 184 28 160 26 112 C24 64 50 34 100 34 Z"
        fill={main}
        stroke={INK}
        strokeWidth={6}
      />
      {/* eye patch */}
      <ellipse cx={132} cy={100} rx={24} ry={22} fill="#E3A764" />
      {/* muzzle */}
      <ellipse cx={100} cy={142} rx={42} ry={30} fill="#FFF1DC" />
      {/* eyes */}
      {mood === "money" ? (
        <>
          {[70, 130].map((x) => (
            <g key={x}>
              <circle cx={x} cy={102} r={17} fill={C.green} stroke={INK} strokeWidth={4} />
              <text x={x} y={113} textAnchor="middle" fontFamily="Montserrat Black" fontSize={30} fill="#fff">$</text>
            </g>
          ))}
        </>
      ) : mood === "dizzy" ? (
        <>
          {[70, 130].map((x) => (
            <path
              key={x}
              d={`M${x} 102 m-2 0 a2 2 0 1 1 4 0 a6 6 0 1 1 -10 0 a10 10 0 1 1 18 0 a14 14 0 1 1 -24 0`}
              fill="none"
              stroke={INK}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
        </>
      ) : mood === "happy" || mood === "zen" ? (
        <>
          <path d={mood === "zen" ? "M60 100 Q70 110 80 100" : "M60 104 Q70 92 80 104"} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={mood === "zen" ? "M120 100 Q130 110 140 100" : "M120 104 Q130 92 140 104"} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={70} cy={102} rx={11} ry={(mood === "shock" ? 15 : 13) * blink} fill={INK} />
          <ellipse cx={130} cy={102} rx={11} ry={(mood === "shock" ? 15 : 13) * blink} fill={INK} />
          {blink > 0.9 ? (
            <>
              <circle cx={74} cy={97} r={4} fill="#fff" />
              <circle cx={134} cy={97} r={4} fill="#fff" />
            </>
          ) : null}
        </>
      )}
      {mood === "sad" ? (
        <path d="M56 84 L82 90 M144 84 L118 90" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      ) : null}
      {/* headband 冲 */}
      <path d="M30 70 Q100 46 170 70 L172 88 Q100 64 28 88 Z" fill={C.red} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M170 74 L196 62 L192 84 Z M172 80 L194 92 L180 100 Z" fill={C.red} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={100} cy={66} r={15} fill="#fff" stroke={INK} strokeWidth={3} />
      <text x={100} y={74} textAnchor="middle" fontFamily="Noto Sans SC Black" fontSize={20} fill={C.red}>冲</text>
      {mood === "sweat" ? (
        <path d="M160 96 Q170 112 164 122 Q154 128 150 118 Q150 108 160 96 Z" fill="#7CC3FF" stroke={INK} strokeWidth={3} />
      ) : null}
      {/* cheeks */}
      <ellipse cx={50} cy={132} rx={12} ry={7} fill="#F7A1B0" opacity={0.8} />
      <ellipse cx={150} cy={132} rx={12} ry={7} fill="#F7A1B0" opacity={0.8} />
      {/* nose */}
      <ellipse cx={100} cy={126} rx={13} ry={9} fill={INK} />
      <ellipse cx={96} cy={123} rx={4} ry={2.5} fill="#fff" opacity={0.7} />
      <Mouth talking={talking} mood={mood} y={142} />
    </g>
  );
};

/** A mascot head. `talking` 0..1 drives mouth + bounce. */
export const MascotFace: React.FC<{
  id?: string;
  kind?: Kind;
  size?: number;
  talking?: number;
  mood?: Mood;
  style?: React.CSSProperties;
  flip?: boolean;
  glint?: number; // 0..1 progress of a light glint across the cat's glasses
}> = ({ id, kind, size = 160, talking = 0, mood = "normal", style, flip, glint = 0 }) => {
  const k = kind ?? kindOf(id ?? "");
  const bounce = talking * 10;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{
        overflow: "visible",
        transform: `translateY(${-bounce}px) scale(${1 + talking * 0.05}, ${1 + talking * 0.07}) ${flip ? "scaleX(-1)" : ""}`,
        transformOrigin: "center bottom",
        ...style,
      }}
    >
      {k === "cat" ? <Cat talking={talking} mood={mood} glint={glint} /> : <Dog talking={talking} mood={mood} />}
    </svg>
  );
};

/** The mascot that is speaking at a frame, with its loudness (for scene-embedded characters). */
export const talkingAt = (id: string, absFrame: number) => {
  for (const s of TL.scenes)
    for (const l of s.lines)
      if (l.speaker === id && absFrame >= l.start && absFrame < l.end) return l.env[absFrame - l.start] ?? 0;
  return 0;
};

export { INK };
