"use client";
import { useEffect, useState } from "react";
import { PALETTES, randomSeed } from "@/lib/identity";
import { CONTROLS, decodeLab, encodeLab, resolveLab, type LabOverrides } from "@/lib/labParams";
import { scene } from "@/lib/sceneState";
import { useIdentity, useSceneVersion } from "@/components/useScene";

const NO_OVERRIDES: LabOverrides = {};
const groups = [...new Set(CONTROLS.map((c) => c.group))];

export function Lab() {
  // Read through snapshots (not `scene` directly) so the first client render
  // matches the server HTML; the visitor's own seed is applied right after.
  const id = useIdentity();
  const overrides = useSceneVersion(() => scene.overrides, NO_OVERRIDES);
  const { planet, paletteIndex } = resolveLab(id, overrides);
  const [stats, setStats] = useState(scene.stats);
  const [audioLevels, setAudioLevels] = useState(scene.audio);
  const [gain, setGain] = useState(scene.audioGain);
  const [copied, setCopied] = useState(false);

  // Restore overrides from the URL. Declared before the sync effect below,
  // so on mount it runs first and the URL is never overwritten with defaults.
  useEffect(() => {
    const o = decodeLab(new URLSearchParams(location.search), PALETTES.length);
    if (Object.keys(o).length) scene.override(o);
  }, []);

  // Keep the URL in sync so the current state is always shareable.
  useEffect(() => {
    const url = new URL(location.href);
    const params = encodeLab(scene.overrides);
    params.set("seed", scene.identity.seed);
    url.search = params.toString();
    history.replaceState(null, "", url);
  }, [id, overrides]);

  useEffect(() => {
    scene.layout = "lab";
    scene.emit();
    return () => {
      scene.layout = "hero";
      scene.emit();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStats({ ...scene.stats });
      setAudioLevels([...scene.audio]);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy this link", location.href);
    }
  };

  return (
    <aside
      aria-label="Scene controls"
      className="glass fixed bottom-20 right-4 top-20 z-30 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl sm:right-6"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h1 className="font-display text-lg font-extrabold tracking-[0.2em]">LAB</h1>
        <div className="flex gap-1 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => scene.setSeed(randomSeed())}
            className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20"
          >
            New seed
          </button>
          <button
            type="button"
            onClick={() => scene.resetOverrides()}
            className="rounded-full px-3 py-1.5 text-white/70 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Palette</legend>
          <div className="grid grid-cols-4 gap-2">
            {PALETTES.map((p, i) => (
              <button
                key={p.name}
                type="button"
                aria-pressed={i === paletteIndex}
                onClick={() => scene.override({ paletteIndex: i })}
                className="group rounded-xl border border-line p-1.5 text-[10px] text-white/70 transition-colors aria-pressed:border-white/60 aria-pressed:text-white"
              >
                <span
                  className="block h-8 rounded-lg transition-transform group-hover:scale-[1.04]"
                  style={{ background: `linear-gradient(135deg, ${p.a}, ${p.b} 60%, ${p.c})` }}
                />
                <span className="mt-1 block">{p.name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {groups.map((g) => (
          <fieldset key={g}>
            <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">{g}</legend>
            <div className="space-y-3">
              {CONTROLS.filter((c) => c.group === g).map((c) => {
                const id = `ctl-${c.key}`;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-xs">
                      <label htmlFor={id} className="text-white/80">
                        {c.label}
                      </label>
                      <output htmlFor={id} className="font-mono tabular-nums text-white/50">
                        {planet[c.key].toFixed(c.step < 0.01 ? 3 : 2)}
                      </output>
                    </div>
                    <input
                      id={id}
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={planet[c.key]}
                      onChange={(e) => scene.override({ [c.key]: Number(e.target.value) })}
                      className="mt-1 w-full"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Audio</legend>
          <div className="flex justify-between text-xs">
            <label htmlFor="ctl-gain" className="text-white/80">
              Sensitivity
            </label>
            <output htmlFor="ctl-gain" className="font-mono text-white/50">{gain.toFixed(1)}×</output>
          </div>
          <input
            id="ctl-gain"
            type="range"
            min={0.2}
            max={3}
            step={0.1}
            value={gain}
            onChange={(e) => {
              scene.audioGain = Number(e.target.value);
              setGain(scene.audioGain);
            }}
            className="mt-1 w-full"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] text-white/50">
            {(["Bass", "Mid", "High"] as const).map((b, i) => (
              <div key={b}>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full origin-left rounded-full bg-[color:var(--c)]"
                    style={{ transform: `scaleX(${audioLevels[i]})` }}
                  />
                </div>
                <span className="mt-1 block">{b}</span>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="border-t border-line px-5 py-3">
        <dl className="grid grid-cols-4 gap-2 font-mono text-[10px] text-white/50">
          {[
            ["fps", stats.fps],
            ["frame", `${stats.frameMs.toFixed(1)}ms`],
            ["tier", stats.tier],
            ["steps", stats.steps],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="tabular-nums text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={copy}
          className="mt-3 w-full rounded-full bg-white py-2 text-sm font-medium text-black"
        >
          {copied ? "Link copied" : "Copy link to this planet"}
        </button>
      </div>
    </aside>
  );
}
