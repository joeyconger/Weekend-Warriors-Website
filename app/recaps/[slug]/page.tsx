import { notFound } from "next/navigation";
import { getContentBySlug, listContent } from "@/lib/content";
import ContentArticle from "@/components/ContentArticle";

export function generateStaticParams() {
  return listContent("recaps").map((entry) => ({ slug: entry.slug }));
}

export default async function RecapPage(props: PageProps<"/recaps/[slug]">) {
  const { slug } = await props.params;
  const entry = await getContentBySlug("recaps", slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ContentArticle entry={entry} />
    </div>
  );
}
