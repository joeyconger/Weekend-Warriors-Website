"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/managers", label: "Managers" },
  { href: "/history", label: "History" },
  { href: "/standings", label: "Standings" },
  { href: "/draft", label: "Draft Central" },
  { href: "/recaps", label: "Recaps" },
  { href: "/rivalries", label: "Rivalries" },
  { href: "/wall-of-shame", label: "Wall of Shame" },
  { href: "/odds", label: "Odds" },
  { href: "/storylines", label: "Storylines" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="relative border-t border-white/10 bg-league-primary-light">
      <div className="mx-auto max-w-6xl relative">
        <div className="overflow-x-auto no-scrollbar">
          <ul className="flex min-w-max px-2 sm:px-4">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
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
