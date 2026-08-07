import Link from "next/link";
import type { ContentSummary, ContentType } from "@/lib/content";

export default function ContentList({
  type,
  entries,
}: {
  type: ContentType;
  entries: ContentSummary[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-league-ink/50">
        Nothing here yet — add a markdown file to <code>content/{type}/</code>.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map((entry) => (
        <Link
          key={entry.slug}
          href={`/${type}/${entry.slug}`}
          className="block bg-white rounded-lg border border-league-ink/10 shadow-sm p-5 hover:border-league-accent/60 transition-colors"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            {entry.frontmatter.date ? (
              <p className="text-xs uppercase tracking-wide text-league-ink/40">
                {new Date(entry.frontmatter.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            ) : (
              <span />
            )}
            {entry.frontmatter.category === "analysis" ? (
              <span className="inline-flex items-center rounded-full bg-league-primary/10 text-league-primary text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
                Analysis
              </span>
            ) : null}
          </div>
          <h3 className="font-display text-league-primary text-lg font-semibold">
            {entry.frontmatter.title}
          </h3>
          {entry.frontmatter.excerpt ? (
            <p className="text-sm text-league-ink/60 mt-1">
              {String(entry.frontmatter.excerpt)}
            </p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
