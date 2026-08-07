"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/managers", label: "Managers" },
  { href: "/records", label: "Records" },
  { href: "/season", label: "Season" },
  { href: "/standings", label: "Standings" },
  { href: "/draft", label: "Draft Central" },
  { href: "/recaps", label: "Recaps" },
  { href: "/rivalries", label: "Rivalries" },
  { href: "/wall-of-shame", label: "Wall of Shame" },
  { href: "/storylines", label: "Storylines" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-white/10 bg-league-primary-light">
      <div className="mx-auto max-w-6xl overflow-x-auto no-scrollbar">
        <ul className="flex min-w-max px-2 sm:px-4">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={clsx(
                    "block whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-medium uppercase tracking-wide border-b-2 transition-colors",
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
    </nav>
  );
}
