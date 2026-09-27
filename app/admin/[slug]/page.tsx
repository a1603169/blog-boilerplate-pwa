import { notFound, redirect } from "next/navigation";

import PostEditor from "@/components/admin/PostEditor";
import Container from "@/components/ui/Container";
import { isAuthenticated } from "@/lib/admin/auth";
import { parsePost } from "@/lib/admin/frontmatter";
import { getPostFile } from "@/lib/admin/github";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const { slug } = await params;
  const file = await getPostFile(slug);
  if (!file) notFound();

  return (
    <Container width="wide" className="py-10">
      <PostEditor mode="edit" sha={file.sha} initial={parsePost(slug, file.markdown)} />
    </Container>
  );
}
