"""Compose an original, upbeat explainer-style background track as MIDI, then render it
with FluidSynth + the FluidR3 GM soundfont.

Usage: python3 scripts/compose_music.py --duration 185 --out public/audio/music.wav

The arrangement is built bar by bar so the final chord lands exactly on the last bar.
Everything here is generated from code, so the track is free to use.
"""
import argparse
import math
import os
import random
import subprocess

import mido
import numpy as np
import soundfile as sf

BPM = 112
TPB = 480  # ticks per beat
BAR = 4 * TPB
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"

# GM programs (0-indexed)
MARIMBA, GLOCK, PIZZ, FINGER_BASS, WARM_PAD, EPIANO, MUTED_GTR = 12, 9, 45, 33, 89, 4, 28
DRUMS = 9  # MIDI channel 10
KICK, CLAP, SNARE, CH_HAT, OP_HAT, SHAKER, TAMB, CRASH, RIDE = 36, 39, 38, 42, 46, 70, 54, 49, 51

# chord = (root midi note, quality)
C, D, E, F, G, A, B = 60, 62, 64, 65, 67, 69, 71
PROG_A = [(C, "maj"), (G, "maj"), (A, "min"), (F, "maj")]
PROG_B = [(F, "maj"), (G, "maj"), (E, "min"), (A, "min")]
PROG_C = [(A, "min"), (F, "maj"), (C, "maj"), (G, "maj")]


def triad(root, q):
    third = 3 if q == "min" else 4
    return [root, root + third, root + 7]


class Track:
    def __init__(self, name, channel, program=None):
        self.name, self.channel, self.program = name, channel, program
        self.events = []  # (abs_tick, msg)

    def note(self, tick, note, dur, vel):
        vel = max(1, min(127, int(vel)))
        self.events.append((int(tick), mido.Message("note_on", note=int(note), velocity=vel, channel=self.channel)))
        self.events.append((int(tick + dur), mido.Message("note_off", note=int(note), velocity=0, channel=self.channel)))

    def cc(self, tick, control, value):
        self.events.append((int(tick), mido.Message("control_change", control=control, value=int(value), channel=self.channel)))

    def to_midi_track(self):
        t = mido.MidiTrack()
        t.append(mido.MetaMessage("track_name", name=self.name, time=0))
        if self.program is not None:
            t.append(mido.Message("program_change", program=self.program, channel=self.channel, time=0))
        # note_off before note_on at identical ticks
        ev = sorted(self.events, key=lambda e: (e[0], 0 if e[1].type == "note_off" else 1))
        last = 0
        for tick, msg in ev:
            t.append(msg.copy(time=tick - last))
            last = tick
        return t


def build(n_bars, seed=7):
    rnd = random.Random(seed)
    hv = lambda v, s=8: v + rnd.randint(-s, s)  # humanized velocity

    marimba = Track("marimba", 0, MARIMBA)
    bass = Track("bass", 1, FINGER_BASS)
    pad = Track("pad", 2, WARM_PAD)
    pizz = Track("pizz", 3, PIZZ)
    glock = Track("glock", 4, GLOCK)
    keys = Track("epiano", 5, EPIANO)
    gtr = Track("mutedgtr", 6, MUTED_GTR)
    drums = Track("drums", DRUMS)
    tracks = [marimba, bass, pad, pizz, glock, keys, gtr, drums]
    for tr, vol in [(marimba, 92), (bass, 104), (pad, 62), (pizz, 78), (glock, 70), (keys, 70), (gtr, 72)]:
        tr.cc(0, 7, vol)
        tr.cc(0, 91, 40)  # reverb send
    drums.cc(0, 7, 100)
    drums.cc(0, 91, 25)
    pad.cc(0, 91, 90)
    glock.cc(0, 91, 70)

    # Section plan (bars). Ending bar is a single hit.
    plan = []
    body = n_bars - 1
    pattern = ["intro"] * 2 + ["A"] * 8 + ["B"] * 8 + ["break"] * 4 + ["A2"] * 8 + ["B"] * 8 + ["C"] * 8 + ["break"] * 4
    while len(plan) < body:
        plan.extend(pattern if not plan else pattern[2:])
    plan = plan[:body]
    # make the last 4 body bars a "B" lift into the ending
    for i in range(max(0, body - 4), body):
        plan[i] = "B"
    plan.append("end")

    lead_motif = {  # 4-bar glock motif over PROG_A, as (beat_offset, semitone offset from C5, length beats)
        0: [(0, 4, .5), (.5, 7, .5), (1, 9, .5), (1.5, 7, .5), (2, 4, .5), (2.5, 2, .5), (3, 0, 1)],
        1: [(0, 2, .5), (.5, 7, .5), (1, 11, .5), (1.5, 9, .5), (2, 7, 1), (3, 2, 1)],
        2: [(0, 0, .5), (.5, 4, .5), (1, 9, .5), (1.5, 7, .5), (2, 4, 1), (3, 0, 1)],
        3: [(0, -3, .5), (.5, 0, .5), (1, 5, .5), (1.5, 4, .5), (2, 2, .5), (2.5, 0, .5), (3, 2, 1)],
    }

    for bar, sec in enumerate(plan):
        t0 = bar * BAR
        prog = PROG_B if sec == "B" else PROG_C if sec == "C" else PROG_A
        root, q = prog[bar % 4]
        ch = triad(root, q)

        if sec == "end":
            final = triad(C, "maj")
            for n in final + [C + 12]:
                marimba.note(t0, n, TPB * 3, 105)
                pizz.note(t0, n, TPB * 2, 95)
            glock.note(t0, C + 24, TPB * 3, 90)
            bass.note(t0, C - 24, TPB * 3, 110)
            for n in final:
                pad.note(t0, n - 12, TPB * 4, 70)
            drums.note(t0, KICK, 120, 118)
            drums.note(t0, CRASH, 400, 105)
            continue

        # --- pad: sustained chord, lower octave, all sections
        for n in ch:
            pad.note(t0, n - 12, BAR - 10, 52 if sec != "break" else 60)

        # --- marimba 8th-note arpeggio
        arp = [ch[0], ch[1] + 12 if False else ch[2], ch[0] + 12, ch[1] + 12, ch[0] + 12, ch[2], ch[1], ch[2]]
        if sec in ("intro", "A", "A2", "B", "C"):
            for i, n in enumerate(arp):
                v = 82 if i % 2 == 0 else 66
                if sec == "intro":
                    v -= 10
                marimba.note(t0 + i * TPB // 2, n, TPB // 2 - 20, hv(v))
        elif sec == "break":
            for i in (0, 3, 6):
                marimba.note(t0 + i * TPB // 2, ch[i % 3] + 12, TPB // 2, hv(58))

        # --- bass: syncopated pop pattern
        if sec not in ("intro",):
            b = root - 24
            if sec == "break":
                bass.note(t0, b, TPB * 2 - 20, hv(88))
                bass.note(t0 + TPB * 2, b + 7, TPB * 2 - 20, hv(80))
            else:
                pat = [(0, b, .75), (1.5, b, .5), (2, b + 7, .5), (2.75, b + 12, .25), (3.5, b, .5)]
                for off, n, ln in pat:
                    bass.note(t0 + off * TPB, n, ln * TPB - 20, hv(98 if off == 0 else 84))

        # --- pizzicato off-beat chords (A2, B, C)
        if sec in ("A2", "B", "C"):
            for beat in (0.5, 1.5, 2.5, 3.5):
                for n in ch:
                    pizz.note(t0 + beat * TPB, n + 12, TPB // 3, hv(60, 5))

        # --- muted guitar 16th chops in C section
        if sec == "C":
            for s in range(16):
                if s % 4 in (0, 2) or rnd.random() < 0.3:
                    gtr.note(t0 + s * TPB // 4, ch[s % 3] + (12 if s % 8 >= 4 else 0), TPB // 5, hv(64 if s % 4 == 0 else 50))

        # --- electric piano stabs in A2
        if sec == "A2":
            for beat in (1, 3):
                for n in ch:
                    keys.note(t0 + beat * TPB, n, TPB // 2, hv(58, 5))

        # --- glockenspiel lead motif in B (every other 4-bar phrase gets it)
        if sec == "B":
            phrase_bar = bar % 4
            for off, semi, ln in lead_motif[phrase_bar]:
                glock.note(t0 + off * TPB, 72 + semi + (0 if prog is PROG_A else 0), ln * TPB - 30, hv(76, 6))

        # --- drums
        if sec == "intro":
            for s in range(8):
                drums.note(t0 + s * TPB // 2, SHAKER, 60, hv(55 if s % 2 else 70))
            if bar == 1:
                for s in range(4):
                    drums.note(t0 + 3 * TPB + s * TPB // 4, SNARE, 60, 50 + s * 15)  # little fill
        elif sec == "break":
            for s in range(8):
                drums.note(t0 + s * TPB // 2, SHAKER, 60, hv(50 if s % 2 else 62))
            drums.note(t0 + TPB, CLAP, 60, hv(62))
            drums.note(t0 + 3 * TPB, CLAP, 60, hv(62))
        else:
            for beat in (0, 2):
                drums.note(t0 + beat * TPB, KICK, 100, hv(104))
            drums.note(t0 + 2.5 * TPB, KICK, 100, hv(80))
            for beat in (1, 3):
                drums.note(t0 + beat * TPB, CLAP, 80, hv(92))
            for s in range(16):
                drums.note(t0 + s * TPB // 4, SHAKER, 50, hv(46 if s % 2 else 60))
            if sec in ("B", "C"):
                for beat in range(4):
                    drums.note(t0 + beat * TPB + TPB // 2, OP_HAT if beat == 3 else CH_HAT, 80, hv(62))
                drums.note(t0 + 3.5 * TPB, TAMB, 60, hv(58))
            # crash at the start of each 8-bar section
            if bar > 0 and plan[bar - 1] != sec:
                drums.note(t0, CRASH, 300, hv(92))
            # fill before a section change
            if bar + 1 < len(plan) and plan[bar + 1] != sec and plan[bar + 1] != "end":
                for s in range(4):
                    drums.note(t0 + 3 * TPB + s * TPB // 4, SNARE, 60, 60 + s * 12)

    mid = mido.MidiFile(ticks_per_beat=TPB)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    mid.tracks.append(meta)
    for tr in tracks:
        mid.tracks.append(tr.to_midi_track())
    return mid, plan


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True, help="seconds the track must cover")
    ap.add_argument("--out", required=True)
    ap.add_argument("--tail", type=float, default=2.5, help="seconds of ring-out after the final hit")
    args = ap.parse_args()

    bar_sec = 4 * 60 / BPM
    n_bars = math.ceil((args.duration - args.tail) / bar_sec) + 1
    mid, plan = build(n_bars)
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    midi_path = os.path.splitext(args.out)[0] + ".mid"
    mid.save(midi_path)
    raw = os.path.splitext(args.out)[0] + ".raw.wav"
    subprocess.run(["fluidsynth", "-ni", "-g", "0.45", "-r", "48000", "-R", "1", "-C", "1", "-F", raw, SF2, midi_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    x, sr = sf.read(raw, dtype="float32")
    os.remove(raw)
    final_hit = (n_bars - 1) * bar_sec
    x = x[: int((final_hit + args.tail) * sr)]
    # fade the tail
    fade = int(args.tail * 0.8 * sr)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    x /= max(1e-6, np.abs(x).max()) / 0.89
    sf.write(args.out, x, sr, subtype="PCM_16")
    print(f"bars={n_bars} bar_sec={bar_sec:.3f} final_hit_at={final_hit:.2f}s length={len(x)/sr:.2f}s")
    print("plan:", " ".join(plan))


if __name__ == "__main__":
    main()
