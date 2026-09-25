import React, { useMemo } from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { allLines, TL } from "../timeline";

const MUSIC_BED = 0.19; // music level when nobody is talking
const MUSIC_UNDER = 0.06; // music level under the voice
export const MUSIC_CUTS: Array<[number, number]> = []; // [from, to) frames where the music is silenced (filled per video)

/** frames a line-level SFX starts before its line, so long sounds finish before the first word */
const SFX_LEAD: Record<string, number> = { scratch: 17, whoosh: 15, cash: 6, drumhit: 6, impact: 4, ticktock: 4 };
const SFX_LINE_VOLUME: Record<string, number> = { scratch: 0.38, typing: 0.22, ticktock: 0.22, buzzer: 0.26, coin: 0.3 };

/** per-frame music gain: ducked under voice, with smooth attack/release */
const useMusicEnvelope = (cuts: Array<[number, number]>) =>
  useMemo(() => {
    const n = TL.totalFrames;
    const target = new Float32Array(n).fill(MUSIC_BED);
    for (const l of allLines()) for (let f = Math.max(0, l.start - 3); f < Math.min(n, l.end + 4); f++) target[f] = MUSIC_UNDER;
    for (const [a, b] of cuts) for (let f = Math.max(0, a); f < Math.min(n, b); f++) target[f] = 0;
    const out = new Float32Array(n);
    let v = target[0];
    for (let f = 0; f < n; f++) {
      const t = target[f];
      const k = t < v ? 0.35 : 0.08; // duck fast, recover slowly
      v += (t - v) * k;
      out[f] = v;
    }
    // hard cuts must be exactly silent
    for (const [a, b] of cuts) for (let f = Math.max(0, a); f < Math.min(n, b); f++) out[f] = 0;
    return out;
  }, [cuts]);

export const AudioLayer: React.FC<{ musicCuts?: Array<[number, number]>; musicRestartAt?: number }> = ({
  musicCuts = MUSIC_CUTS,
  musicRestartAt,
}) => {
  const env = useMusicEnvelope(musicCuts);
  const lines = allLines();
  return (
    <>
      {lines.map((l) => (
        <Sequence key={l.id} from={l.start} durationInFrames={Math.max(1, l.end - l.start + 15)} layout="none">
          <Audio src={staticFile(l.audio)} volume={1} />
        </Sequence>
      ))}
      {lines
        .filter((l) => l.sfx)
        .map((l) => (
          <Sequence key={`sfx-${l.id}`} from={Math.max(0, l.start - (SFX_LEAD[l.sfx ?? ""] ?? 4))} durationInFrames={150} layout="none">
            <Audio src={staticFile(`sfx/${l.sfx}.wav`)} volume={SFX_LINE_VOLUME[l.sfx ?? ""] ?? 0.32} />
          </Sequence>
        ))}
      {musicRestartAt !== undefined ? (
        <>
          {/* opening sting before the cut: the track's chorus (bar 10); after the cut the track restarts from its intro */}
          <Sequence from={0} durationInFrames={musicRestartAt} layout="none">
            <Audio src={staticFile("audio/music.wav")} startFrom={Math.round(10 * (240 / 112) * TL.fps)} volume={(f) => env[f] ?? 0} />
          </Sequence>
          <Sequence from={musicRestartAt} durationInFrames={TL.totalFrames - musicRestartAt} layout="none">
            <Audio src={staticFile("audio/music.wav")} volume={(f) => env[f + musicRestartAt] ?? 0} />
          </Sequence>
        </>
      ) : (
        <Audio src={staticFile("audio/music.wav")} volume={(f) => env[f] ?? 0} />
      )}
    </>
  );
};
