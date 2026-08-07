import { siteConfig } from "@/lib/site-config";

export default function SiteFooter() {
  return (
    <footer className="bg-league-primary text-white/70 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          {siteConfig.leagueName} · est. {siteConfig.foundedYear}
        </p>
        <p>Live league data via Sleeper. Lore, records &amp; hot takes hand-curated.</p>
      </div>
    </footer>
  );
}
