import Link from "next/link";
import { redirect } from "next/navigation";
import { LuPlus } from "react-icons/lu";

import { logout } from "@/app/admin/actions";
import PostTable from "@/components/admin/PostTable";
import Container from "@/components/ui/Container";
import { isAuthenticated } from "@/lib/admin/auth";
import { getPostFile, listPostFiles } from "@/lib/admin/github";
import { parsePost } from "@/lib/admin/frontmatter";

export interface AdminPostRow {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  archived: boolean;
}

/**
 * Reads frontmatter for every post so the list can show titles and draft state.
 *
 * That is one API call per post. Fine for a single-author admin behind a password,
 * and it guarantees the list reflects the repository rather than the last build.
 */
async function loadRows(): Promise<AdminPostRow[]> {
  const files = await listPostFiles();

  const rows = await Promise.all(
    files.map(async ({ slug }) => {
      const file = await getPostFile(slug);
      if (!file) return null;
      const draft = parsePost(slug, file.markdown);
      return {
        slug,
        title: draft.title || slug,
        date: draft.date,
        draft: draft.draft,
        archived: draft.archived,
      };
    }),
  );

  return rows
    .filter((row): row is AdminPostRow => row !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  let rows: AdminPostRow[] = [];
  let error: string | null = null;

  try {
    rows = await loadRows();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Could not reach GitHub.";
  }

  const draftCount = rows.filter((row) => row.draft).length;
  const archivedCount = rows.filter((row) => row.archived).length;

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-fg">Posts</h1>
          <p className="mt-1 text-sm text-fg-subtle">
            {rows.length} total{draftCount > 0 && `, ${draftCount} draft`}
            {archivedCount > 0 && `, ${archivedCount} archived`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
          >
            <LuPlus className="size-4" aria-hidden />
            New post
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-8 rounded-lg border border-red-500/40 p-4 text-sm text-red-500">
          {error}
        </p>
      ) : (
        <PostTable rows={rows} />
      )}
    </Container>
  );
}
