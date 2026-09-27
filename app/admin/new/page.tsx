import { redirect } from "next/navigation";

import PostEditor from "@/components/admin/PostEditor";
import Container from "@/components/ui/Container";
import { isAuthenticated } from "@/lib/admin/auth";
import { todayIso } from "@/lib/admin/frontmatter";

export default async function NewPostPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  return (
    <Container width="wide" className="py-10">
      <PostEditor
        mode="create"
        initial={{
          slug: "",
          title: "",
          subtitle: "",
          date: todayIso(),
          tags: [],
          draft: false,
          archived: false,
          body: "",
        }}
      />
    </Container>
  );
}
