import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { prePaintScript } from "@/lib/identity";
import { Scene } from "@/components/Scene";
import { IdentityBoot } from "@/components/IdentityBoot";
import { SoundDock } from "@/components/SoundDock";
import { Header } from "@/components/Header";
import { baseOpenGraph, baseTwitter, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "800"] });

const title = "Orbital: a studio for things that move";
const description =
  "A fictional design and motion studio, rendered entirely with shaders. Every visit generates its own identity.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · Orbital" },
  description,
  applicationName: "Orbital",
  authors: [{ name: "Tiff", url: "https://github.com/tiff-xt" }],
  alternates: { canonical: "/" },
  openGraph: { ...baseOpenGraph, title, description, url: "/" },
  twitter: { ...baseTwitter, title, description },
};

export const viewport: Viewport = { themeColor: "#04050d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <Scene />
        <IdentityBoot />
        <Header />
        {children}
        <SoundDock />
      </body>
    </html>
  );
}
