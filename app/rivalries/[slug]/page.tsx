import { notFound } from "next/navigation";
import { getContentBySlug, listContent } from "@/lib/content";
import ContentArticle from "@/components/ContentArticle";

export function generateStaticParams() {
  return listContent("rivalries").map((entry) => ({ slug: entry.slug }));
}

export default async function RivalryPage(props: PageProps<"/rivalries/[slug]">) {
  const { slug } = await props.params;
  const entry = await getContentBySlug("rivalries", slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ContentArticle entry={entry} />
    </div>
  );
}
