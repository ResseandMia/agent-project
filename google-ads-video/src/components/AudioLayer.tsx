import React, { useMemo } from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { allLines, TL } from "../timeline";

const MUSIC_BED = 0.26; // music level when nobody is talking
const MUSIC_UNDER = 0.075; // music level under the voice
export const MUSIC_CUTS: Array<[number, number]> = []; // [from, to) frames where the music is silenced (filled per video)

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
          <Sequence key={`sfx-${l.id}`} from={Math.max(0, l.start - 4)} durationInFrames={150} layout="none">
            <Audio src={staticFile(`sfx/${l.sfx}.wav`)} volume={0.45} />
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
