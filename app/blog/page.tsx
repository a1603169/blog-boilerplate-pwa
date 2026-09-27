import type { Metadata } from "next";

import PostBrowser from "@/components/blog/PostBrowser";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import { getCommentCounts } from "@/lib/comments";
import { getPostSummaries, getTagCounts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Study notes and write-ups on Kubernetes, GCP and AWS certifications, JavaScript internals, algorithms and data structures.",
};

/*
 * Still prerendered, but regenerated hourly so comment counts do not sit frozen
 * at whatever they were during the last content build. A new comment does not
 * trigger a deploy, so without this the numbers would only move when you publish.
 */
export const revalidate = 3600;

export default async function BlogPage() {
  const [posts, tags, commentCounts] = await Promise.all([
    getPostSummaries(),
    getTagCounts(),
    getCommentCounts(),
  ]);

  return (
    <Container className="py-10 sm:py-12">
      <PageHeader title="Writing" />
      <PostBrowser posts={posts} tags={tags} commentCounts={commentCounts} />
    </Container>
  );
}
