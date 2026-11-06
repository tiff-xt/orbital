import Link from "next/link";
import { Logo } from "./Logo";
import { WarpLink } from "./WarpLink";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-3 pr-2"
      >
        <WarpLink href="/" className="flex items-center gap-2.5 font-display text-sm font-extrabold tracking-[0.25em]">
          <Logo />
          ORBITAL
        </WarpLink>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/#work" className="rounded-full px-3 py-1.5 text-white/70 transition-colors hover:text-white">
            Work
          </Link>
          <WarpLink
            href="/lab"
            className="rounded-full bg-white/10 px-4 py-1.5 text-white transition-colors hover:bg-white/20"
          >
            Lab
          </WarpLink>
        </div>
      </nav>
    </header>
  );
}
