import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import NavTabs from "@/components/NavTabs";

export default function SiteHeader() {
  return (
    <header className="bg-league-primary text-white">
      <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="group">
          <span className="block font-display text-2xl sm:text-3xl font-semibold uppercase tracking-wide">
            {siteConfig.leagueName}
          </span>
          <span className="block text-xs sm:text-sm text-league-accent uppercase tracking-[0.2em]">
            Fantasy Football League
          </span>
        </Link>
      </div>
      <NavTabs />
    </header>
  );
}
