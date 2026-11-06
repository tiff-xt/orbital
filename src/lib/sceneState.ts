import { identity, normalizeSeed, type Identity, type Planet, PALETTES } from "./identity";
import { resolveLab, type LabOverrides } from "./labParams";

/**
 * Per-frame scene inputs, shared by React islands and the render loop.
 * Deliberately not React state: the canvas reads it every frame, and UI
 * writes to it, without re-rendering anything.
 */
export type Stats = { fps: number; frameMs: number; tier: string; scale: number; steps: number };

type Listener = () => void;

class SceneState {
  // On the client the pre-paint script has already resolved the seed.
  identity: Identity = identity(
    (typeof window !== "undefined" && normalizeSeed((window as { __ORBITAL_SEED__?: string }).__ORBITAL_SEED__)) ||
      "orbital",
  );
  /** Lab overrides on top of the seeded identity. */
  overrides: LabOverrides = {};
  audio: [number, number, number] = [0, 0, 0];
  audioGain = 1;
  warp = 0;
  /** Where the planet sits: beside the hero copy, or clear of the lab panel. */
  layout: "hero" | "lab" = "hero";
  /** Lab controls sheet expanded (phones/tablets): lift the planet above it. */
  sheetOpen = false;
  stats: Stats = { fps: 0, frameMs: 0, tier: "high", scale: 1, steps: 64 };

  private listeners = new Set<Listener>();
  private warpAnim = 0;

  get planet(): Planet {
    return resolveLab(this.identity, this.overrides).planet;
  }
  get palette() {
    return PALETTES[resolveLab(this.identity, this.overrides).paletteIndex];
  }

  setSeed(seed: string) {
    this.identity = identity(seed);
    this.overrides = {};
    this.applyCssPalette();
    this.emit();
  }

  override(patch: SceneState["overrides"]) {
    this.overrides = { ...this.overrides, ...patch };
    if ("paletteIndex" in patch) this.applyCssPalette();
    this.emit();
  }

  resetOverrides() {
    this.overrides = {};
    this.applyCssPalette();
    this.emit();
  }

  applyCssPalette() {
    if (typeof document === "undefined") return;
    const p = this.palette;
    const s = document.documentElement.style;
    s.setProperty("--void", p.void);
    s.setProperty("--a", p.a);
    s.setProperty("--b", p.b);
    s.setProperty("--c", p.c);
    s.setProperty("--star", p.star);
  }

  /** Animate warp to a target; resolves when it gets there. */
  warpTo(target: number, ms = 480): Promise<void> {
    cancelAnimationFrame(this.warpAnim);
    const from = this.warp;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        this.warp = from + (target - from) * e;
        if (k < 1) this.warpAnim = requestAnimationFrame(step);
        else resolve();
      };
      this.warpAnim = requestAnimationFrame(step);
    });
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  emit() {
    this.listeners.forEach((l) => l());
  }
}

export const scene = new SceneState();
