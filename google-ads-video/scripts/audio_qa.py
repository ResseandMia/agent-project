"""Audio QA on a rendered video: is every voice line still intelligible in the final mix?

  python3 scripts/audio_qa.py out/google-ads-scaling.mp4 --models <models dir>

For each line it cuts the mixed audio at the line's timing, runs SenseVoice ASR and compares the transcript with
the ASR transcript of the clean TTS clip (build/tts_qa.json). A big difference means music/SFX mask the voice.
It also reports the voice-to-background level difference (loudness during speech vs. in the pauses).
"""
import argparse
import json
import os
import subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def cer(ref, hyp):
    r = [c for c in ref if "一" <= c <= "鿿"]
    h = [c for c in hyp if "一" <= c <= "鿿"]
    if not r:
        return 0.0
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        p = d[:]
        d[0] = i
        for j in range(1, len(h) + 1):
            d[j] = min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1] / len(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--models", required=True)
    args = ap.parse_args()
    import sherpa_onnx

    d = [x for x in os.listdir(args.models) if x.startswith("sherpa-onnx-sense-voice")][0]
    d = os.path.join(args.models, d)
    rec = sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=f"{d}/model.int8.onnx", tokens=f"{d}/tokens.txt", num_threads=4, use_itn=False, language="zh")

    sr = 16000
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", args.video, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    tl = json.load(open(os.path.join(ROOT, "src/data/timeline.json")))
    clean = {q["id"]: q for q in json.load(open(os.path.join(ROOT, "build/tts_qa.json")))}
    fps = tl["fps"]
    speech_mask = np.zeros(len(x), dtype=bool)
    rows = []
    for s in tl["scenes"]:
        for ln in s["lines"]:
            a, b = int(ln["start"] / fps * sr), int(ln["end"] / fps * sr)
            speech_mask[a:b] = True
            st = rec.create_stream()
            st.accept_waveform(sr, x[a:b])
            rec.decode_stream(st)
            ref = clean.get(ln["id"], {}).get("asr", "")
            rows.append({"id": ln["id"], "mix_asr": st.result.text, "clean_asr": ref, "diff": round(cer(ref, st.result.text), 3)})

    def lufs_like(sig):
        return 10 * np.log10(np.mean(sig ** 2) + 1e-12)

    v, bg = lufs_like(x[speech_mask]), lufs_like(x[~speech_mask])
    bad = [r for r in rows if r["diff"] > 0.12]
    print(f"{len(rows)} lines, mean diff vs clean {np.mean([r['diff'] for r in rows]):.3f}, {len(bad)} lines > 0.12")
    for r in bad:
        print(f"  {r['id']:16s} {r['diff']:.2f} | clean: {r['clean_asr']} | mix: {r['mix_asr']}")
    print(f"level during speech {v:.1f} dB, in pauses {bg:.1f} dB (difference {v - bg:.1f} dB)")
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    json.dump(rows, open(os.path.join(ROOT, "build/audio_qa.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
