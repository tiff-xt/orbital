"use client";
import { audio } from "@/lib/audio/engine";
import { setAudioMode } from "./SoundDock";
import { useSceneVersion } from "./useScene";

export function SoundButton({
  mode = "synth",
  children,
  className,
}: {
  mode?: "synth" | "mic";
  children: React.ReactNode;
  className?: string;
}) {
  const current = useSceneVersion(() => audio.mode, "off");
  const on = current === mode;
  return (
    <button type="button" aria-pressed={on} onClick={() => setAudioMode(on ? "off" : mode)} className={className}>
      {on ? "Stop sound" : children}
    </button>
  );
}
