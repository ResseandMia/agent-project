import React, { createContext, useContext } from "react";
import timelineJson from "./data/timeline.json";

export type CaptionChunk = { text: string; start: number; end: number };
export type Line = {
  id: string;
  speaker: string;
  text: string;
  keywords: string[];
  sfx?: string;
  audio: string;
  start: number; // absolute frame
  end: number;
  relStart: number; // frame relative to scene start
  relEnd: number;
  captions: CaptionChunk[]; // absolute frames
  env: number[]; // per-frame loudness 0..1 from relStart
};
export type Scene = {
  id: string;
  chapter: string;
  title: string;
  start: number;
  duration: number;
  lines: Line[];
};
export type Character = { id: string; name: string; voice: string; role: string; look?: string };
export type Timeline = {
  fps: number;
  totalFrames: number;
  characters: Character[];
  scenes: Scene[];
  endCard?: string;
};

export const TL = timelineJson as unknown as Timeline;

export const allLines = (): Line[] => TL.scenes.flatMap((s) => s.lines);

const SceneCtx = createContext<Scene | null>(null);
/** scene context without the throwing guard (for components usable inside and outside scenes) */
export const SceneCtxOptional = SceneCtx;
export const SceneProvider: React.FC<{ scene: Scene; children: React.ReactNode }> = ({ scene, children }) =>
  React.createElement(SceneCtx.Provider, { value: scene }, children);

export const useScene = (): Scene => {
  const s = useContext(SceneCtx);
  if (!s) throw new Error("useScene outside scene");
  return s;
};

/** relative start frame of line i in the current scene (negative index counts from end) */
export const useLineStarts = () => {
  const s = useScene();
  const starts = s.lines.map((l) => l.relStart);
  const ends = s.lines.map((l) => l.relEnd);
  const at = (i: number) => starts[i < 0 ? starts.length + i : i] ?? 0;
  const endAt = (i: number) => ends[i < 0 ? ends.length + i : i] ?? s.duration;
  return { at, endAt, n: starts.length, scene: s };
};

/** Frame (relative to scene) at which a given substring of a line is spoken (proportional estimate via caption chunks). */
export const useWordTime = () => {
  const s = useScene();
  return (lineIdx: number, needle: string, fallbackOffset = 0) => {
    const l = s.lines[lineIdx < 0 ? s.lines.length + lineIdx : lineIdx];
    if (!l) return fallbackOffset;
    const full = l.captions.map((c) => c.text.replace(/\n/g, "")).join("");
    const pos = full.indexOf(needle);
    if (pos < 0) return l.relStart + fallbackOffset;
    let acc = 0;
    for (const c of l.captions) {
      const len = c.text.replace(/\n/g, "").length;
      if (pos < acc + len) {
        const frac = (pos - acc) / Math.max(1, len);
        return Math.round(c.start - s.start + frac * (c.end - c.start));
      }
      acc += len;
    }
    return l.relStart + fallbackOffset;
  };
};
