"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/season", label: "Season" },
  { href: "/odds", label: "Odds" },
  // Individual recap/analysis posts still live at /recaps/[slug] (their
  // permalinks didn't move when Recaps folded into Storylines), so this
  // tab also lights up there.
  { href: "/storylines", label: "Storylines", alsoActiveUnder: ["/recaps"] },
  { href: "/managers", label: "Managers" },
  { href: "/draft", label: "Draft Central" },
  { href: "/history", label: "History" },
  { href: "/wall-of-shame", label: "Wall of Shame" },
] as const;

function isActive(pathname: string, tab: { href: string; alsoActiveUnder?: readonly string[] }) {
  if (tab.href === "/") return pathname === "/";
  if (pathname === tab.href || pathname.startsWith(`${tab.href}/`)) return true;
  return (tab.alsoActiveUnder ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="relative border-t border-white/10 bg-league-primary-light">
      <div className="mx-auto max-w-6xl relative">
        <div className="overflow-x-auto no-scrollbar">
          <ul className="flex min-w-max px-2 sm:px-4">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={clsx(
                      "block whitespace-nowrap px-2.5 sm:px-3 py-3 text-sm font-medium uppercase tracking-wide border-b-2 transition-colors",
                      active
                        ? "border-league-accent text-league-accent"
                        : "border-transparent text-white/75 hover:text-white hover:border-white/30"
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Fade hints that the tab bar scrolls horizontally when it overflows. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-league-primary-light to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-league-primary-light to-transparent" />
      </div>
    </nav>
  );
}
