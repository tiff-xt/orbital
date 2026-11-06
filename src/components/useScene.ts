"use client";
import { useSyncExternalStore } from "react";
import { identity } from "@/lib/identity";
import { scene } from "@/lib/sceneState";

const serverIdentity = identity("orbital");
const subscribe = (cb: () => void) => scene.subscribe(cb);

/** Re-renders when the seed, overrides or audio mode change (not per frame). */
export function useIdentity() {
  return useSyncExternalStore(
    subscribe,
    () => scene.identity,
    () => serverIdentity,
  );
}

export function useSceneVersion<T>(read: () => T, server: T) {
  return useSyncExternalStore(subscribe, read, () => server);
}
