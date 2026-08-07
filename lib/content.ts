import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export type ContentType = "recaps" | "rivalries" | "wall-of-shame";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export interface ContentFrontmatter {
  title: string;
  date?: string;
  excerpt?: string;
  [key: string]: unknown;
}

export interface ContentEntry {
  slug: string;
  frontmatter: ContentFrontmatter;
  html: string;
}

export interface ContentSummary {
  slug: string;
  frontmatter: ContentFrontmatter;
}

function dirFor(type: ContentType): string {
  return path.join(CONTENT_ROOT, type);
}

/** Lists all entries for a content type, newest `date` first (undated entries last). */
export function listContent(type: ContentType): ContentSummary[] {
  const dir = dirFor(type);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        frontmatter: data as ContentFrontmatter,
      };
    })
    .sort((a, b) => {
      const da = a.frontmatter.date ? Date.parse(a.frontmatter.date) : 0;
      const db = b.frontmatter.date ? Date.parse(b.frontmatter.date) : 0;
      return db - da;
    });
}

export async function getContentBySlug(
  type: ContentType,
  slug: string
): Promise<ContentEntry | null> {
  const filePath = path.join(dirFor(type), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);

  return {
    slug,
    frontmatter: data as ContentFrontmatter,
    html: processed.toString(),
  };
}
