"use client";
import { useEffect, useRef, useState } from "react";
import { audio, type AudioMode } from "@/lib/audio/engine";
import { scene } from "@/lib/sceneState";
import { useSceneVersion } from "./useScene";

const MODES: { id: AudioMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "synth", label: "Synth" },
  { id: "mic", label: "Mic" },
];

export async function setAudioMode(mode: AudioMode): Promise<string | null> {
  try {
    if (mode === "off") audio.stop();
    else await audio.start(mode);
    return null;
  } catch (err) {
    audio.stop();
    return err instanceof DOMException && err.name === "NotAllowedError"
      ? "Microphone permission was declined."
      : "Audio isn't available in this browser.";
  } finally {
    scene.emit();
  }
}

/** Floating sound control with a live three-band meter. */
export function SoundDock() {
  const mode = useSceneVersion(() => audio.mode, "off" as AudioMode);
  const [error, setError] = useState<string | null>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (mode === "off") return;
    let raf = 0;
    const tick = () => {
      scene.audio.forEach((v, i) => {
        const el = bars.current[i];
        if (el) el.style.transform = `scaleY(${0.15 + v * 0.85})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {error && (
        <p role="alert" className="glass rounded-xl px-3 py-2 text-xs text-[color:var(--star)]">
          {error}
        </p>
      )}
      <div role="group" aria-label="Sound" className="glass flex items-center gap-1 rounded-full p-1 pl-3">
        <span aria-hidden className="mr-1 flex h-4 items-end gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              ref={(el) => {
                bars.current[i] = el;
              }}
              className="block h-4 w-[3px] origin-bottom rounded-full bg-[color:var(--c)] transition-transform duration-75"
              style={{ transform: "scaleY(0.15)" }}
            />
          ))}
        </span>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={async () => setError(await setAudioMode(m.id))}
            className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:text-white aria-pressed:bg-white/15 aria-pressed:text-white"
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
