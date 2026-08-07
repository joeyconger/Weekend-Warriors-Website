import type { ContentEntry } from "@/lib/content";

export default function ContentArticle({ entry }: { entry: ContentEntry }) {
  return (
    <article>
      {entry.frontmatter.date ? (
        <p className="text-xs uppercase tracking-wide text-league-ink/40 mb-2">
          {new Date(entry.frontmatter.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      ) : null}
      <h1 className="font-display uppercase tracking-wide text-league-primary text-2xl mb-6">
        {entry.frontmatter.title}
      </h1>
      <div
        className="prose prose-slate max-w-none prose-headings:font-display prose-a:text-league-primary"
        dangerouslySetInnerHTML={{ __html: entry.html }}
      />
    </article>
  );
}
