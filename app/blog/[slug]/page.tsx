import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";

import Comments from "@/components/blog/Comments";
import PostNav from "@/components/blog/PostNav";
import TableOfContents from "@/components/blog/TableOfContents";
import Container from "@/components/ui/Container";
import { getAdjacentPosts, getPost, getPostSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

/* The folder is `[slug]`, so URLs stay /blog/<slug> — required, because
   utterances threads are keyed on the pathname. */
type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const description = post.subtitle || post.title;

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.date,
      tags: [...post.tags],
      url: `/blog/${post.slug}`,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { newer, older } = await getAdjacentPosts(slug);

  return (
    <Container width="prose" className="py-10 sm:py-12">
      <TableOfContents headings={post.headings} />

      <Link
        href="/blog"
        className="group inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg"
      >
        <LuArrowLeft
          className="size-3 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        All posts
      </Link>

      <article className="mt-6">
        <header className="border-b border-border pb-6">
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-3 text-base leading-relaxed text-fg-muted">{post.subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-fg-subtle">
            <time dateTime={post.date} className="label-mono">
              {formatDate(post.date)}
            </time>
            {post.tags.length > 0 && (
              <ul className="flex flex-wrap gap-x-2 gap-y-1">
                {post.tags.map((tag) => (
                  <li key={tag} className="after:ml-2 after:content-['·'] last:after:content-none">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* Rendered at build time: GFM, raw HTML, heading ids, shiki dual-theme
            highlighting and scrollable table wrappers are all already applied. */}
        <div
          className="prose prose-lg mt-8"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      <PostNav newer={newer} older={older} />
      <Comments />
    </Container>
  );
}
