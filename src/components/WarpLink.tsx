"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { scene } from "@/lib/sceneState";

/**
 * Navigation through the WebGL scene: the sky warps into hyperspace, the
 * route changes underneath, then it settles. Falls back to a normal link for
 * modified clicks, reduced motion, or no WebGL.
 */
export function WarpLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={async (e) => {
        onClick?.(e);
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button !== 0 ||
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.webgl !== "on"
        )
          return;
        e.preventDefault();
        document.documentElement.dataset.warping = "";
        await scene.warpTo(1, 520);
        router.push(withSeed(href));
        window.scrollTo(0, 0);
        await scene.warpTo(0, 700);
        delete document.documentElement.dataset.warping;
      }}
      {...rest}
    />
  );
}

/** Keep the visitor's orbit when moving between pages. */
function withSeed(href: string) {
  const url = new URL(href, location.origin);
  url.searchParams.set("seed", scene.identity.seed);
  return url.pathname + url.search + url.hash;
}
