#!/usr/bin/env bash
# One-time setup: system packages, Python/Node deps, offline TTS/ASR models, fonts.
# Tested on Ubuntu 24.04 with Node 22 and Python 3.11.
set -euo pipefail
cd "$(dirname "$0")/.."
MODELS=${MODELS:-$HOME/.cache/google-ads-video/models}

sudo_if() { if [ "$(id -u)" = 0 ]; then "$@"; else sudo "$@"; fi; }

# 1. system packages: ffmpeg, fonts for emoji/CJK fallback, FluidSynth + GM soundfont for the music
sudo_if apt-get update -qq
sudo_if env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg fonts-noto-cjk fonts-noto-color-emoji fluidsynth fluid-soundfont-gm

# 2. python + node deps
pip install -q sherpa-onnx soundfile numpy scipy mido fonttools
pip install -q --use-pep517 jieba
npm install --no-audit --no-fund

# 3. models (GitHub releases of k2-fsa/sherpa-onnx)
mkdir -p "$MODELS"
REL=https://github.com/k2-fsa/sherpa-onnx/releases/download
[ -d "$MODELS/kokoro-multi-lang-v1_1" ] || curl -sSL "$REL/tts-models/kokoro-multi-lang-v1_1.tar.bz2" | tar xj -C "$MODELS"
[ -d "$MODELS/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09" ] ||
  curl -sSL "$REL/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2" | tar xj -C "$MODELS"

# 4. full fonts (Google Fonts, OFL). public/fonts in git holds subsets made by scripts/subset_fonts.py
mkdir -p build/fonts-full
for pair in "ZCOOL+KuaiLe|ZCOOLKuaiLe" "ZCOOL+QingKe+HuangYou|ZCOOLQingKeHuangYou" "Noto+Sans+SC:wght@900|NotoSansSC-Black" \
  "Noto+Sans+SC:wght@700|NotoSansSC-Bold" "Noto+Sans+SC:wght@500|NotoSansSC-Medium" "Montserrat:wght@900|Montserrat-Black" \
  "Montserrat:wght@700|Montserrat-Bold"; do
  fam=${pair%%|*}; name=${pair##*|}
  [ -f "build/fonts-full/$name.ttf" ] && continue
  url=$(curl -sS "https://fonts.googleapis.com/css2?family=$fam" | grep -oE "https://fonts.gstatic.com[^)]+" | head -1)
  curl -sS -o "build/fonts-full/$name.ttf" "$url"
done
echo "setup done. models in $MODELS"
