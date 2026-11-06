"use client";
import { useEffect } from "react";
import { normalizeSeed } from "@/lib/identity";
import { scene } from "@/lib/sceneState";

declare global {
  interface Window {
    __ORBITAL_SEED__?: string;
  }
}

/** Hands the seed resolved before first paint to the scene and React. */
export function IdentityBoot() {
  useEffect(() => {
    const seed = normalizeSeed(window.__ORBITAL_SEED__) ?? "orbital";
    scene.setSeed(seed);
  }, []);
  return null;
}
