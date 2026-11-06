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
      const g = this.mode === "mic" ? gain * 2.2 : gain * 1.3;
      raw = [shape(b[0], g), shape(b[1], g), shape(b[2], g * 1.4)];
    }
    this.levels = this.levels.map((v, i) => envelope(v, raw[i])) as [number, number, number];
    return this.levels;
  }
}

let synthGeneration = 0;

/** ~92 bpm ambient loop: detuned pad, sub kick, filtered noise hats. */
function startSynth(ctx: AudioContext, analyser: AnalyserNode) {
  const generation = ++synthGeneration;
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.2);
  master.connect(analyser);
  // The analyser feeds the speakers only while the synth plays.
  analyser.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 6;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 650;
  lfo.connect(lfoGain).connect(filter.frequency);
  filter.connect(master);
  const voices = [110, 164.81, 220, 246.94].flatMap((f) =>
    [-6, 6].map((detune) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.connect(g).connect(filter);
      return o;
    }),
  );
  [lfo, ...voices].forEach((o) => o.start());

  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
  const ch = noise.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

  const beat = 60 / 92;
  let next = ctx.currentTime + 0.1;
  let step = 0;
  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.5);
  };
  const hat = (t: number, level = 1) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18 * level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    s.connect(hp).connect(g).connect(master);
    s.start(t);
    s.stop(t + 0.08);
  };
  const schedule = () => {
    while (next < ctx.currentTime + 0.2) {
      if (step % 2 === 0) kick(next);
      else hat(next);
      if (step % 8 === 7) hat(next + beat / 4, 0.5);
      next += beat / 2;
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
      [lfo, ...voices].forEach((o) => o.stop());
      master.disconnect();
      // Don't cut the speakers if a newer synth started during the fade.
      if (generation === synthGeneration) analyser.disconnect();
    }, 450);
  };
}

export const audio = new AudioEngine();
