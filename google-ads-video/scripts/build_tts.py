"""Build the voiceover and the frame-accurate timeline from src/data/script.json.

  python3 scripts/build_tts.py --models <dir with kokoro-multi-lang-v1_1 and sense-voice>

Outputs
  public/audio/vo/<line>.wav   one file per spoken line (Kokoro v1.1-zh via sherpa-onnx)
  src/data/timeline.json       scenes/lines with frame timings, caption chunks, mouth envelopes
  build/tts_qa.json            ASR (SenseVoice) transcript + character error rate per line

Script text conventions
  {显示|朗读}   show the left part in captions, speak the right part (e.g. {Demand Gen|需求开发广告})
  ROAS etc.     are normalized for speech automatically (see normalize_speech)
"""
import argparse
import json
import math
import os
import re

import jieba
import numpy as np
import soundfile as sf

jieba.setLogLevel(60)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
VOICES = {"female": 20, "male": 59}  # Kokoro v1.1-zh speaker ids chosen by ASR/pitch sweep
SPEED = {"female": 1.3, "male": 1.25}  # ≈4.9 / 5.1 chars per second; ASR error stays < 4%

DIG = "零一二三四五六七八九"


def int2zh(n: int) -> str:
    if n == 0:
        return "零"
    units = [(10 ** 8, "亿"), (10 ** 4, "万"), (1000, "千"), (100, "百"), (10, "十")]
    out, need_zero = "", False
    for val, name in units:
        q, n = divmod(n, val)
        if q:
            if need_zero:
                out += "零"
            out += (int2zh(q) if q >= 10 else DIG[q]) + name
            need_zero = False
        elif out and n:
            need_zero = True
    if n:
        if need_zero:
            out += "零"
        out += DIG[n]
    if out.startswith("一十"):
        out = out[1:]
    return out


def num2zh(s: str) -> str:
    s = s.replace(",", "")
    if "." in s:
        a, b = s.split(".", 1)
        return int2zh(int(a or 0)) + "点" + "".join(DIG[int(c)] for c in b)
    return int2zh(int(s))


LIANG_MW = "周个步件倍种次条天块位小"


def normalize_speech(text: str) -> str:
    t = text
    t = re.sub(r"\{([^|}]*)\|([^}]*)\}", r"\2", t)  # markup → spoken part
    t = t.replace("Google Ads", "谷歌广告").replace("google ads", "谷歌广告")
    t = t.replace("Demand Gen", "需求开发广告")
    t = t.replace("……", "，").replace("…", "，")
    t = t.replace("CTR", "点击率")
    t = re.sub(r"ROAS", "R, O, A, S", t, flags=re.I)
    t = re.sub(r"\$\s*(\d+(?:\.\d+)?)", r"\1美元", t)
    # percent ranges and percents
    t = re.sub(r"(\d+(?:\.\d+)?)%?\s*[–—\-~～到至]\s*(\d+(?:\.\d+)?)%", lambda m: f"百分之{num2zh(m.group(1))}到{num2zh(m.group(2))}", t)
    t = re.sub(r"(\d+(?:\.\d+)?)%", lambda m: "百分之" + num2zh(m.group(1)), t)
    # numeric ranges like 2–6 小时
    t = re.sub(r"(\d+)\s*[–—~～\-]\s*(\d+)", lambda m: f"{m.group(1)}到{m.group(2)}", t)
    # dates are handled well by the TTS frontend; keep "9月1日" as is
    def repl(m):
        pre, num, nxt = m.group(1), m.group(2), m.group(3)
        if nxt and nxt in "月日号":
            return pre + num + nxt
        if num == "2" and not pre and nxt and (nxt in LIANG_MW or nxt == "到"):
            return "两" + nxt
        return pre + num2zh(num) + nxt
    t = re.sub(r"(第?)(\d+(?:\.\d+)?)\s*(.?)", repl, t)
    t = t.replace("÷", "除以").replace("＝", "等于").replace("=", "等于").replace("+", "加").replace("＋", "加")
    t = t.replace("×", "乘以").replace("→", "，").replace("·", "").replace("/", "、")
    t = t.replace("“", "").replace("”", "").replace("「", "").replace("」", "").replace("《", "").replace("》", "")
    t = re.sub(r"[（(]([^）)]*)[）)]", r"，\1，", t)
    t = re.sub(r"\s+", " ", t).strip()
    cjk = r"[\u4e00-\u9fff，。！？、；：]"
    t = re.sub(rf"(?<={cjk})\s+|\s+(?={cjk})", "", t)
    t = t.lstrip("，。、；：,. ")
    t = re.sub(r"，\s*([，。！？])", r"\1", t)
    return t


def display_text(text: str) -> str:
    return re.sub(r"\{([^|}]*)\|([^}]*)\}", r"\1", text)


PUNCT = "，。！？；：、…,.!?;:"


def vis_len(s: str) -> float:
    """display width in Chinese-character units (ASCII counts ~half)"""
    return sum(0.55 if ord(ch) < 128 else 1 for ch in s if ch != " ")
KEEP_END = "？！?!"


def chunk_caption(text: str, max_len=15):
    """split display text into caption chunks at punctuation, then by length."""
    parts, cur = [], ""
    for ch in text:
        cur += ch
        if ch in PUNCT:
            parts.append(cur)
            cur = ""
    if cur.strip():
        parts.append(cur)
    out = []
    for p in parts:
        body = p.strip()
        while vis_len(body.rstrip(PUNCT)) > max_len:
            # split near an even point, only at jieba word boundaries (never inside words/numbers)
            n = vis_len(body.rstrip(PUNCT))
            target = n / math.ceil(n / max_len)
            bounds, pos = [], 0
            for w in jieba.lcut(body):
                pos += len(w)
                bounds.append(pos)
            bounds = [b for b in bounds if 2 <= b <= len(body) - 2]
            if not bounds:
                break
            cut = min(bounds, key=lambda b: abs(vis_len(body[:b]) - target) + (0 if body[b - 1] in " =+÷，" else 0.6))
            out.append(body[:cut].strip())
            body = body[cut:].strip()
        if body:
            out.append(body)
    # merge very short chunks into the previous one
    merged = []
    for p in out:
        bare = p.rstrip(PUNCT)
        if merged and vis_len(bare) <= 4 and vis_len(merged[-1].rstrip(PUNCT)) + vis_len(bare) <= max_len + 2:
            merged[-1] += p
        else:
            merged.append(p)
    cleaned = []
    for p in merged:
        p = p.strip()
        while p and p[-1] in PUNCT and p[-1] not in KEEP_END:
            p = p[:-1]
        if p:
            cleaned.append(p)
    return cleaned


def spoken_weight(s: str) -> float:
    sp = normalize_speech(s)
    w = 0.0
    for ch in sp:
        if "一" <= ch <= "鿿":
            w += 1
        elif ch.isalpha():
            w += 0.45
        elif ch in "，,、":
            w += 0.8
        elif ch in "。！？!?；;":
            w += 1.2
    return max(w, 0.5)


def load_tts(models):
    import sherpa_onnx

    m = os.path.join(models, "kokoro-multi-lang-v1_1")
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=f"{m}/model.onnx", voices=f"{m}/voices.bin", tokens=f"{m}/tokens.txt",
                data_dir=f"{m}/espeak-ng-data", dict_dir=f"{m}/dict",
                lexicon=f"{m}/lexicon-us-en.txt,{m}/lexicon-zh.txt"),
            num_threads=4),
        rule_fsts=f"{m}/phone-zh.fst,{m}/date-zh.fst,{m}/number-zh.fst",
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg)


def load_asr(models):
    import sherpa_onnx

    d = [x for x in os.listdir(models) if x.startswith("sherpa-onnx-sense-voice")][0]
    d = os.path.join(models, d)
    return sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=f"{d}/model.int8.onnx", tokens=f"{d}/tokens.txt", num_threads=4, use_itn=False, language="zh")


def trim(x, sr, thresh_db=-42, pad=0.03):
    frame = int(0.01 * sr)
    rms = np.array([np.sqrt(np.mean(x[i:i + frame] ** 2) + 1e-12) for i in range(0, len(x), frame)])
    db = 20 * np.log10(rms + 1e-12)
    idx = np.where(db > thresh_db)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] * frame - int(pad * sr))
    b = min(len(x), (idx[-1] + 1) * frame + int(pad * sr))
    y = x[a:b].copy()
    f = int(0.008 * sr)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def envelope(x, sr):
    hop = sr // FPS
    env = []
    for i in range(0, len(x), hop):
        seg = x[i:i + hop]
        rms = np.sqrt(np.mean(seg ** 2) + 1e-12)
        env.append(float(np.clip((20 * np.log10(rms) + 42) / 26, 0, 1)))
    env = np.array(env)
    sm = np.convolve(env, [0.25, 0.5, 0.25], mode="same")
    return [round(float(v), 2) for v in sm]


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
    ap.add_argument("--models", required=True)
    ap.add_argument("--script", default=os.path.join(ROOT, "src/data/script.json"))
    ap.add_argument("--only-timeline", action="store_true", help="reuse existing wavs, just rebuild timing")
    args = ap.parse_args()

    script = json.load(open(args.script))
    chars = {c["id"]: c for c in script["characters"]}
    vo_dir = os.path.join(ROOT, "public/audio/vo")
    os.makedirs(vo_dir, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)

    tts = None if args.only_timeline else load_tts(args.models)
    asr = None if args.only_timeline else load_asr(args.models)

    cursor = 0
    scenes_out, qa = [], []
    for si, sc in enumerate(script["scenes"]):
        lead = int(sc.get("leadIn", 0.25) * FPS)
        tail = int(sc.get("tail", 0.25) * FPS)
        s_start = cursor
        t = s_start + lead
        lines_out = []
        prev_speaker = None
        for li, ln in enumerate(sc["lines"]):
            lid = f"{sc['id']}_{li}"
            wav = os.path.join(vo_dir, f"{lid}.wav")
            voice = chars[ln["speaker"]]["voice"]
            speech = normalize_speech(ln["text"])
            if not args.only_timeline:
                a = tts.generate(speech, sid=VOICES[voice], speed=ln.get("speed", SPEED[voice]))
                x = trim(np.array(a.samples, dtype=np.float32), a.sample_rate)
                sf.write(wav, x, a.sample_rate, subtype="PCM_16")
                st = asr.create_stream()
                st.accept_waveform(a.sample_rate, x)
                asr.decode_stream(st)
                e = cer(speech, st.result.text)
                qa.append({"id": lid, "speech": speech, "asr": st.result.text, "cer": round(e, 3), "dur": round(len(x) / a.sample_rate, 2)})
                print(f"{lid:14s} cer={e:.2f} {len(x)/a.sample_rate:5.2f}s  {speech}")
            x, sr = sf.read(wav, dtype="float32")
            dur_f = math.ceil(len(x) / sr * FPS)
            if prev_speaker is not None:
                t += int(ln.get("gapBefore", 0.22 if prev_speaker != ln["speaker"] else 0.12) * FPS)
            start, end = t, t + dur_f
            disp = display_text(ln["text"])
            chunks = chunk_caption(disp)
            weights = [spoken_weight(c) for c in chunks]
            tot = sum(weights)
            caps, acc = [], start
            for c, w in zip(chunks, weights):
                d = dur_f * w / tot
                caps.append({"text": c, "start": int(round(acc)), "end": int(round(acc + d))})
                acc += d
            caps[-1]["end"] = end
            lines_out.append({
                "id": lid, "speaker": ln["speaker"], "text": disp, "keywords": ln.get("keywords", []),
                "sfx": ln.get("sfx") or None, "audio": f"audio/vo/{lid}.wav",
                "start": start, "end": end, "relStart": start - s_start, "relEnd": end - s_start,
                "captions": caps, "env": envelope(x, sr),
            })
            t = end + int(ln.get("pauseAfter", 0) * FPS)
            prev_speaker = ln["speaker"]
        s_end = t + tail + int(sc.get("hold", 0) * FPS)
        scenes_out.append({"id": sc["id"], "chapter": sc["chapter"], "title": sc.get("title_on_screen", ""),
                           "start": s_start, "duration": s_end - s_start, "lines": lines_out})
        cursor = s_end

    total = cursor
    timeline = {"fps": FPS, "totalFrames": total, "characters": script["characters"], "scenes": scenes_out,
                "endCard": script.get("end_card", "")}
    with open(os.path.join(ROOT, "src/data/timeline.json"), "w") as f:
        json.dump(timeline, f, ensure_ascii=False, separators=(",", ":"))
    if qa:
        with open(os.path.join(ROOT, "build/tts_qa.json"), "w") as f:
            json.dump(qa, f, ensure_ascii=False, indent=1)
        bad = [q for q in qa if q["cer"] > 0.15]
        print(f"\n{len(qa)} lines, mean CER {np.mean([q['cer'] for q in qa]):.3f}, {len(bad)} lines > 0.15")
        for q in bad:
            print("  CHECK", q["id"], q["cer"], "|", q["speech"], "→", q["asr"])
    print(f"total {total} frames = {total / FPS:.1f}s, {len(scenes_out)} scenes")


if __name__ == "__main__":
    main()
