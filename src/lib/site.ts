import type { Metadata } from "next";

export const SITE_URL = "https://orbital-by-tiff.vercel.app";

/** Shared social metadata. Pages spread these, because Next replaces (not merges) nested objects. */
export const baseOpenGraph = {
  type: "website",
  siteName: "Orbital",
  locale: "en",
} satisfies Metadata["openGraph"];

export const baseTwitter = { card: "summary_large_image" } satisfies Metadata["twitter"];
