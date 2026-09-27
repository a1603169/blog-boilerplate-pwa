import Link from "next/link";

import type { PostSummary } from "@/types/post";
import { formatDate } from "@/lib/utils";

export default function PostListItem({ post }: { post: PostSummary }) {
  return (
    <li className="border-b border-border">
      <Link
        href={`/blog/${post.slug}`}
        className="group block py-5 transition-colors hover:bg-bg-subtle/60"
      >
        <h2 className="font-serif text-lg font-semibold leading-snug text-fg transition-colors group-hover:text-accent sm:text-xl">
          {post.title}
        </h2>

        {post.subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{post.subtitle}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {/* Mono for the date only — tabular figures keep the column aligned. */}
          <time dateTime={post.date} className="label-mono text-fg-subtle">
            {formatDate(post.date)}
          </time>
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-x-2 gap-y-1 text-fg-subtle">
              {post.tags.map((tag) => (
                <li key={tag} className="after:ml-2 after:content-['·'] last:after:content-none">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </li>
  );
}
