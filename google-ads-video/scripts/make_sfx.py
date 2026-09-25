"""Synthesize every sound effect used in the video (numpy DSP + a few FluidSynth GM renders).

Usage: python3 scripts/make_sfx.py public/sfx
All sounds are generated from scratch, so there are no licensing questions.
"""
import os
import subprocess
import sys
import tempfile

import mido
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
rng = np.random.default_rng(42)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env_ad(n, a, d_curve=4.0):
    """attack (samples) then exponential-ish decay over the rest."""
    e = np.ones(n)
    a = max(1, a)
    e[:a] = np.linspace(0, 1, a)
    rest = n - a
    e[a:] = np.exp(-d_curve * np.linspace(0, 1, rest))
    return e


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def swept_noise(sec, f0, f1, q=3.0, n_seg=60):
    """noise through a band-pass whose centre sweeps f0 -> f1 (log)."""
    n = int(sec * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = n // n_seg
    centres = np.geomspace(f0, f1, n_seg)
    win = np.hanning(seg * 2)
    for i, fc in enumerate(centres):
        s = max(0, i * seg - seg // 2)
        e = min(n, s + seg * 2)
        bw = fc / q
        y = bandpass(noise[s:e], max(30, fc - bw / 2), min(SR / 2 - 100, fc + bw / 2))
        out[s:e] += y * win[: e - s]
    return out


def bell(freq, sec, partials=((1, 1.0), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12)), decay=5.0):
    x = np.zeros(int(sec * SR))
    tt = t(sec)
    for mult, amp in partials:
        x += amp * np.sin(2 * np.pi * freq * mult * tt) * np.exp(-decay * mult ** 0.6 * tt)
    x *= env_ad(len(x), int(0.002 * SR), 0.5)
    return x


def norm(x, peak=0.9):
    return x / max(1e-9, np.abs(x).max()) * peak


def stereo(x, width=0.0):
    if width <= 0:
        return np.stack([x, x], 1)
    d = int(0.012 * SR * width)
    r = np.concatenate([np.zeros(d), x[:-d] if d else x])
    return np.stack([x, 0.8 * x + 0.2 * r], 1)


def fs_render(notes, program=None, channel=0, sec=3.0, bend=None, gain=0.6):
    """Render GM notes [(start_beat, note, dur_beats, vel)] at 120bpm through FluidSynth."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(120), time=0))
    if program is not None:
        tr.append(mido.Message("program_change", program=program, channel=channel, time=0))
    tr.append(mido.Message("control_change", control=91, value=30, channel=channel, time=0))
    ev = []
    for sb, n, db, v in notes:
        ev.append((int(sb * 480), mido.Message("note_on", note=n, velocity=v, channel=channel)))
        ev.append((int((sb + db) * 480), mido.Message("note_off", note=n, velocity=0, channel=channel)))
    for tick, val in (bend or []):
        ev.append((int(tick * 480), mido.Message("pitchwheel", pitch=int(val), channel=channel)))
    ev.sort(key=lambda e: e[0])
    last = 0
    for tick, m in ev:
        tr.append(m.copy(time=tick - last))
        last = tick
    with tempfile.TemporaryDirectory() as d:
        mp, wp = os.path.join(d, "a.mid"), os.path.join(d, "a.wav")
        mid.save(mp)
        subprocess.run(["fluidsynth", "-ni", "-g", str(gain), "-r", str(SR), "-F", wp, SF2, mp],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        x, _ = sf.read(wp, dtype="float64")
    x = x[: int(sec * SR)]
    return x


def trim_silence(x, thresh=1e-3):
    mono = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    idx = np.where(mono > thresh)[0]
    if len(idx) == 0:
        return x
    return x[idx[0]: idx[-1] + int(0.02 * SR)]


def make_all(out):
    os.makedirs(out, exist_ok=True)
    S = {}

    # whoosh: swept band-pass noise, fast in / slow out
    w = swept_noise(0.5, 300, 4500, q=2.5) * np.sin(np.pi * np.linspace(0, 1, int(0.5 * SR))) ** 1.5
    S["whoosh"] = stereo(norm(w, 0.7), 1)

    # soft swoosh for small elements
    w2 = swept_noise(0.28, 1500, 6000, q=2) * np.sin(np.pi * np.linspace(0, 1, int(0.28 * SR))) ** 2
    S["swish"] = stereo(norm(w2, 0.45), 1)

    # riser: 1.2 s rising noise + rising sine
    n = int(1.2 * SR)
    ramp = np.linspace(0, 1, n)
    rs = swept_noise(1.2, 200, 7000, q=4) * ramp ** 2
    ph = 2 * np.pi * np.cumsum(np.geomspace(200, 1400, n)) / SR
    rs = norm(rs, 0.6) + 0.18 * np.sin(ph) * ramp ** 2
    S["riser"] = stereo(norm(rs, 0.7), 1)

    # pop: pitch-drop sine blip
    n = int(0.09 * SR)
    f = np.geomspace(1100, 320, n)
    p = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, int(0.002 * SR), 5)
    S["pop"] = stereo(norm(p, 0.8))

    # click: tiny UI click
    n = int(0.03 * SR)
    c = highpass(rng.standard_normal(n), 2000) * env_ad(n, 20, 12) + 0.5 * np.sin(2 * np.pi * 2400 * t(0.03)) * env_ad(n, 5, 15)
    S["click"] = stereo(norm(c, 0.6))

    # ding: single bright bell
    S["ding"] = stereo(norm(bell(1568, 1.2), 0.7), 0.5)

    # chime: happy arpeggio C6 E6 G6 C7
    ch = np.zeros(int(1.4 * SR))
    for i, fr in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        b = bell(fr, 1.0, decay=6)
        s = int(i * 0.075 * SR)
        ch[s: s + len(b)] += b * (0.8 + 0.1 * i)
    S["chime"] = stereo(norm(ch, 0.7), 0.6)

    # cash register: "cha" (drawer/noise) + "ching" (two bells)
    n = int(1.3 * SR)
    cash = np.zeros(n)
    cha = bandpass(rng.standard_normal(int(0.12 * SR)), 1500, 7000) * env_ad(int(0.12 * SR), 50, 6)
    cash[: len(cha)] += cha * 0.9
    thunk = np.sin(2 * np.pi * 140 * t(0.1)) * env_ad(int(0.1 * SR), 30, 8)
    cash[: len(thunk)] += thunk * 0.5
    for fr, start, amp in [(2637, 0.10, 0.9), (3520, 0.16, 0.8)]:
        b = bell(fr, 1.0, partials=((1, 1), (2.0, .4), (3.01, .25), (4.2, .15)), decay=4.5)
        s = int(start * SR)
        cash[s: s + len(b)] += b[: n - s] * amp
    S["cash"] = stereo(norm(cash, 0.75), 0.7)

    # coin: two-step square blip
    parts = []
    for fr, d in [(988, 0.07), (1319, 0.33)]:
        tt = t(d)
        sq = signal.square(2 * np.pi * fr * tt, 0.5) * 0.5 + 0.5 * np.sin(2 * np.pi * fr * tt)
        parts.append(lowpass(sq, 6000) * env_ad(len(tt), 20, 3 if d > 0.1 else 0.5))
    S["coin"] = stereo(norm(np.concatenate(parts), 0.45))

    # buzzer: wrong-answer
    tt = t(0.55)
    bz = signal.sawtooth(2 * np.pi * 110 * tt) + signal.sawtooth(2 * np.pi * 116.5 * tt)
    bz = lowpass(bz, 1800) * np.minimum(1, np.minimum(tt / 0.01, (0.55 - tt) / 0.06))
    S["buzzer"] = stereo(norm(bz, 0.5))

    # stamp: thump + paper slap
    n = int(0.35 * SR)
    th = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 55, n)) / SR) * env_ad(n, 40, 7)
    sl = bandpass(rng.standard_normal(n), 800, 5000) * env_ad(n, 10, 30)
    S["stamp"] = stereo(norm(th + 0.6 * sl, 0.85))

    # boing: vibrato pitch-drop
    n = int(0.6 * SR)
    tt = t(0.6)
    fr = 420 * np.exp(-2.2 * tt) + 160 + 25 * np.sin(2 * np.pi * 14 * tt) * np.exp(-3 * tt)
    bo = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_ad(n, 100, 3)
    S["boing"] = stereo(norm(bo, 0.6))

    # sparkle: random high pings
    n = int(0.9 * SR)
    sp = np.zeros(n)
    for i in range(9):
        fr = rng.choice([2093, 2349, 2637, 3136, 3520, 4186])
        b = bell(fr, 0.4, partials=((1, 1), (2.76, .3)), decay=9)
        s = int((0.03 + i * 0.07 + rng.uniform(0, 0.03)) * SR)
        sp[s: s + len(b)] += b[: n - s] * (1 - i / 12)
    S["sparkle"] = stereo(norm(sp, 0.5), 1)

    # typing: 1.2 s of key clicks
    n = int(1.2 * SR)
    ty = np.zeros(n)
    pos = 0.02
    while pos < 1.12:
        k = int(0.018 * SR)
        clk = bandpass(rng.standard_normal(k), 1500, 6000) * env_ad(k, 8, 10)
        clk += 0.4 * np.sin(2 * np.pi * rng.uniform(300, 500) * t(0.018)) * env_ad(k, 8, 14)
        s = int(pos * SR)
        ty[s: s + k] += clk * rng.uniform(0.5, 1.0)
        pos += rng.uniform(0.055, 0.12)
    S["typing"] = stereo(norm(ty, 0.5), 0.5)

    # record scratch: back-and-forth pitch-modulated band-passed noise + saw
    n = int(0.55 * SR)
    tt = t(0.55)
    rate = np.sin(2 * np.pi * 3.2 * tt) * np.exp(-1.2 * tt)
    fr = 300 + 900 * np.abs(rate)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(fr) / SR)
    nz = bandpass(rng.standard_normal(n), 400, 3500)
    sc = (0.6 * saw + nz) * (0.3 + np.abs(rate)) * np.minimum(1, (0.55 - tt) / 0.05)
    S["scratch"] = stereo(norm(lowpass(sc, 4000), 0.7))

    # GM based -----------------------------------------------------------
    # tick-tock clock (wood blocks) 2 s
    S["ticktock"] = trim_silence(fs_render([(i * 0.5, 76 if i % 2 == 0 else 77, 0.2, 110) for i in range(8)], channel=9, sec=2.3))
    # drum roll 1.6 s + crash
    roll = [(i * 0.0625, 38, 0.05, 50 + int(60 * i / 48)) for i in range(48)] + [(3.0, 49, 1.5, 115), (3.0, 36, 0.5, 120)]
    S["drumroll"] = trim_silence(fs_render(roll, channel=9, sec=4.5))
    # impact: orchestra hit + timpani + kick
    hit = norm(fs_render([(0, 48, 1.0, 120), (0, 60, 1.0, 110)], program=55, sec=1.4), 1.0)
    timp = norm(fs_render([(0, 41, 1.0, 127)], program=47, sec=1.4), 1.0)
    kick = norm(fs_render([(0, 36, 0.5, 127)], channel=9, sec=1.4), 1.0)
    L = min(len(hit), len(timp), len(kick))
    S["impact"] = trim_silence(hit[:L] * 0.7 + timp[:L] * 0.6 + kick[:L] * 0.7)
    # drum hit for chapter stamps: kick + snare + tom + short crash
    S["drumhit"] = trim_silence(fs_render([(0, 36, 0.4, 127), (0, 38, 0.3, 120), (0, 45, 0.3, 105), (0, 57, 0.8, 100)], channel=9, sec=1.6, gain=0.8))
    # sad trombone
    notes = [(0, 55, 0.45, 100), (0.5, 54, 0.45, 100), (1.0, 53, 0.45, 100), (1.5, 52, 1.6, 100)]
    bend = [(1.5 + i * 0.05, 8192 + 350 * np.sin(i * 1.1)) for i in range(30)] + [(3.2, 8192)]
    bend = [(b0, min(16383, max(0, v)) - 8192) for b0, v in bend]
    S["sadtrombone"] = trim_silence(fs_render(notes, program=57, sec=3.6, bend=bend))
    # success fanfare (brass) short
    fan = [(0, 60, 0.2, 105), (0.25, 64, 0.2, 105), (0.5, 67, 0.2, 105), (0.75, 72, 1.0, 115)]
    S["fanfare"] = trim_silence(fs_render(fan, program=61, sec=2.4))

    for k, v in S.items():
        v = np.asarray(v, dtype=np.float64)
        if v.ndim == 1:
            v = stereo(v)
        v = v / max(1e-9, np.abs(v).max()) * min(0.9, np.abs(v).max() if np.abs(v).max() < 0.9 else 0.9)
        sf.write(os.path.join(out, f"{k}.wav"), v.astype(np.float32), SR, subtype="PCM_16")
        print(f"{k:12s} {len(v)/SR:5.2f}s")


if __name__ == "__main__":
    make_all(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
