import { bandLevels, envelope, shape } from "./bands";

export type AudioMode = "off" | "synth" | "mic";

/**
 * Audio input for the visuals. Two sources:
 *  - "synth": a generative ambient loop built from oscillators and noise,
 *    so there are no audio files to license or download;
 *  - "mic": the visitor's microphone, analysed locally, never recorded or sent.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private stopSource: (() => void) | null = null;
  private levels: [number, number, number] = [0, 0, 0];
  mode: AudioMode = "off";

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.6;
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }
    return { ctx: this.ctx, analyser: this.analyser! };
  }

  async start(mode: Exclude<AudioMode, "off">) {
    this.stop();
    const { ctx, analyser } = this.ensure();
    await ctx.resume();
    if (mode === "mic") {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser); // analysed only: never routed to the speakers
      this.stopSource = () => {
        src.disconnect();
        stream.getTracks().forEach((t) => t.stop());
      };
    } else {
      this.stopSource = startSynth(ctx, analyser);
    }
    this.mode = mode;
  }

  stop() {
    this.stopSource?.();
    this.stopSource = null;
    this.mode = "off";
  }

  /** Call once per frame. Returns smoothed bass/mid/high in 0..1. */
  read(gain = 1): [number, number, number] {
    let raw: [number, number, number] = [0, 0, 0];
    if (this.mode !== "off" && this.analyser && this.data && this.ctx) {
      this.analyser.getByteFrequencyData(this.data);
      const b = bandLevels(this.data, this.ctx.sampleRate, this.analyser.fftSize);
      const g = this.mode === "mic" ? gain * 2.2 : gain * 1.05;
      raw = [shape(b[0], g), shape(b[1], g), shape(b[2], g * 1.4)];
    }
    this.levels = this.levels.map((v, i) => envelope(v, raw[i])) as [number, number, number];
    return this.levels;
  }
}

let synthGeneration = 0;

const BPM = 126;
// A minor progression, one chord per bar: Am, F, C, G.
const CHORDS = [
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [55, 60, 64, 67],
  [55, 59, 62, 67],
];
const BASS = [45, 41, 48, 43];
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/**
 * A small progressive-house loop, synthesised live: four-on-the-floor kick,
 * claps on 2 and 4, off-beat bass, 16th hats with open hats on the off-beats,
 * a side-chained supersaw pad and a filtered pluck arp. A compressor glues it
 * and keeps peaks safe. No samples, so nothing to download or license.
 */
function startSynth(ctx: AudioContext, analyser: AnalyserNode) {
  const generation = ++synthGeneration;
  const t0 = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.5, t0 + 1.5);
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -14;
  glue.ratio.value = 4;
  glue.attack.value = 0.005;
  glue.release.value = 0.12;
  master.connect(glue).connect(analyser);
  analyser.connect(ctx.destination);

  // Everything except the kick goes through a bus that ducks on every beat.
  const pump = ctx.createGain();
  pump.connect(master);

  // ── Pad: detuned supersaw through a slowly opening low-pass ──
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.Q.value = 2;
  padFilter.frequency.setValueAtTime(600, t0);
  padFilter.frequency.linearRampToValueAtTime(2600, t0 + 16);
  const padGain = ctx.createGain();
  padGain.gain.value = 0.06;
  padFilter.connect(padGain).connect(pump);
  const padVoices = [0, 1, 2, 3].flatMap(() =>
    [-12, 0, 12].map((detune) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.detune.value = detune;
      o.connect(padFilter);
      o.start();
      return o;
    }),
  );
  const setChord = (bar: number, t: number) => {
    const chord = CHORDS[bar % CHORDS.length];
    padVoices.forEach((o, i) => o.frequency.setTargetAtTime(midi(chord[Math.floor(i / 3)]), t, 0.02));
  };

  // ── Shared noise for hats and claps ──
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
  const ch = noise.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.4);
    // Side-chain: duck everything else, then swell back.
    pump.gain.setValueAtTime(0.25, t);
    pump.gain.linearRampToValueAtTime(1, t + (60 / BPM) * 0.8);
  };

  const noiseHit = (t: number, type: BiquadFilterType, freq: number, level: number, decay: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    s.connect(f).connect(g).connect(pump);
    s.start(t, Math.random() * 0.3);
    s.stop(t + decay + 0.02);
  };
  const clap = (t: number) => {
    // A clap is a few noise bursts a few ms apart.
    [0, 0.012, 0.024].forEach((d, i) => noiseHit(t + d, "bandpass", 1500, i === 2 ? 0.5 : 0.3, i === 2 ? 0.18 : 0.03));
  };

  const bass = (t: number, note: number, len: number) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = midi(note);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 8;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(160, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(f).connect(g).connect(pump);
    o.start(t);
    o.stop(t + len + 0.02);
  };

  const pluck = (t: number, note: number, bright: number) => {
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = midi(note);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 6;
    f.frequency.setValueAtTime(800 + bright * 3200, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(f).connect(g).connect(pump);
    o.start(t);
    o.stop(t + 0.22);
  };

  const sixteenth = 60 / BPM / 4;
  let next = t0 + 0.1;
  let step = 0; // 16th notes
  const schedule = () => {
    while (next < ctx.currentTime + 0.25) {
      const inBar = step % 16;
      const bar = Math.floor(step / 16);
      const section = Math.floor(bar / 4) % 4; // 4-bar sections: build, drop, drop, break
      const t = next;
      if (inBar === 0) setChord(bar, t);
      if (inBar % 4 === 0 && section !== 3) kick(t);
      if ((inBar === 4 || inBar === 12) && section > 0) clap(t);
      if (inBar % 4 === 2) {
        noiseHit(t, "highpass", 6500, section === 0 ? 0.12 : 0.22, 0.14); // open hat
        if (section !== 3) bass(t, BASS[bar % BASS.length], sixteenth * 1.8);
      } else if (section > 0) {
        noiseHit(t, "highpass", 9000, 0.05, 0.03); // closed hat
      }
      if (section === 1 || section === 2) {
        const chord = CHORDS[bar % CHORDS.length];
        const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
        pluck(t, chord[pattern[inBar % 8]] + 12, (bar % 4) / 3);
      }
      next += sixteenth;
      step++;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 25);

  return () => {
    window.clearInterval(timer);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.4);
    window.setTimeout(() => {
      padVoices.forEach((o) => o.stop());
      master.disconnect();
      glue.disconnect();
      // Don't cut the speakers if a newer synth started during the fade.
      if (generation === synthGeneration) analyser.disconnect();
    }, 450);
  };
}

export const audio = new AudioEngine();
