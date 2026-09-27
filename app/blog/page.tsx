import type { Metadata } from "next";

import PostBrowser from "@/components/blog/PostBrowser";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import { getPostSummaries, getTagCounts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Study notes and write-ups on Kubernetes, GCP and AWS certifications, JavaScript internals, algorithms and data structures.",
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getPostSummaries(), getTagCounts()]);

  return (
    <Container className="py-10 sm:py-12">
      <PageHeader title="Writing" />
      <PostBrowser posts={posts} tags={tags} />
    </Container>
  );
}
