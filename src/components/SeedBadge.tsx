"use client";
import { useState } from "react";
import { randomSeed } from "@/lib/identity";
import { scene } from "@/lib/sceneState";
import { useIdentity } from "./useScene";

/** Shows the visitor's generated identity, with reroll and share. */
export function SeedBadge() {
  const id = useIdentity();
  const [copied, setCopied] = useState(false);

  const reroll = () => {
    const seed = randomSeed();
    scene.setSeed(seed);
    const url = new URL(location.href);
    url.searchParams.set("seed", seed);
    history.replaceState(null, "", url);
  };
  const share = async () => {
    const url = new URL(location.href);
    url.searchParams.set("seed", id.seed);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      prompt("Copy this link", url.toString());
    }
  };

  return (
    <div className="glass inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-3xl py-1.5 pl-4 pr-1.5 font-mono text-xs sm:rounded-full">
      <span className="whitespace-nowrap text-white/60">Your orbit</span>
      <span className="whitespace-nowrap tabular-nums text-white" aria-live="polite">
        {id.seed} · {id.palette.name}
      </span>
      <span className="ml-auto flex">
        <button
          type="button"
          onClick={reroll}
          className="group rounded-full bg-white/10 px-3 py-1.5 text-white transition-colors hover:bg-white/20"
        >
          <span aria-hidden className="mr-1.5 inline-block transition-transform duration-500 group-hover:rotate-180">
            ↻
          </span>
          Reroll
        </button>
        <button type="button" onClick={share} className="rounded-full px-3 py-1.5 text-white/70 hover:text-white">
          {copied ? "Copied" : "Share"}
        </button>
      </span>
    </div>
  );
}
