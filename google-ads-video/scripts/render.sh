#!/usr/bin/env bash
# Full render: SFX → music (length from the timeline) → Remotion render → loudness mastering.
# Run scripts/build_tts.py first (voice + timeline).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${OUT:-out/google-ads-scaling.mp4}
mkdir -p out public/audio

python3 scripts/make_sfx.py public/sfx >/dev/null

# music length: whole video, or from the post-hook restart point to the end
DUR=$(python3 -c "
import json
tl=json.load(open('src/data/timeline.json')); a=json.load(open('src/data/audio.json'))
start=a.get('musicRestartAt',0)
print((tl['totalFrames']-start)/tl['fps'])")
python3 scripts/compose_music.py --duration "$DUR" --out public/audio/music.wav

node scripts/gen_scene_index.mjs
npx tsc --noEmit -p .
npx remotion render Main out/raw.mp4 --codec=h264 --crf=18 --audio-codec=aac --audio-bitrate=256k \
  --pixel-format=yuv420p --concurrency=4 --log=error

# two-pass EBU R128 loudness normalization to -14 LUFS / -1 dBTP (short-video platform standard)
STATS=$(ffmpeg -hide_banner -i out/raw.mp4 -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i out/raw.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 256k -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
echo "done → $OUT"
