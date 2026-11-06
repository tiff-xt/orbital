import type { Metadata } from "next";
import { Lab } from "./Lab";

export const metadata: Metadata = { title: "Lab · Orbital" };

const notes = [
  ["One shader", "The entire sky is a single fragment shader: no meshes, no textures, no 3D engine."],
  [
    "Ray-marched planet",
    "A signed-distance sphere displaced by fractal noise, marched only inside an analytic bounding sphere, so empty sky costs almost nothing.",
  ],
  [
    "Analytic rings",
    "One ray–plane intersection per pixel, banded by noise, and shadowed by casting a second ray toward the light.",
  ],
  [
    "Adaptive quality",
    "A governor watches frame times and trades resolution and march steps for frame rate, with hysteresis so it never flickers between tiers.",
  ],
];

export default function LabPage() {
  return (
    <main className="min-h-dvh px-5 pb-28 pt-28 sm:px-10">
      <Lab />
      <section className="max-w-md space-y-4 lg:mt-[40vh]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">How it works</p>
        {notes.map(([t, b]) => (
          <div key={t} className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold">{t}</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{b}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
