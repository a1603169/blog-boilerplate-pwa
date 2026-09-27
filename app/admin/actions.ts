"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  checkPassword,
  endSession,
  isPasswordLoginAllowed,
  requireAdmin,
  startSession,
} from "@/lib/admin/auth";
import {
  IMAGES_PATH,
  POSTS_PATH,
  commitFiles,
  deleteFile,
  getFileSha,
  getPostFile,
  writeFile,
} from "@/lib/admin/github";
import {
  type PostDraft,
  SLUG_PATTERN,
  parsePost,
  parseTagInput,
  serializePost,
  validateDraft,
} from "@/lib/admin/frontmatter";
import { renderMarkdown } from "@/lib/posts";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** 4 MB — comfortably under the serverless request body limit. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function draftFromForm(form: FormData): PostDraft {
  return {
    slug: String(form.get("slug") ?? "").trim(),
    title: String(form.get("title") ?? ""),
    subtitle: String(form.get("subtitle") ?? ""),
    date: String(form.get("date") ?? "").trim(),
    tags: parseTagInput(String(form.get("tags") ?? "")),
    draft: form.get("draft") === "on" || form.get("draft") === "true",
    archived: form.get("archived") === "on" || form.get("archived") === "true",
    body: String(form.get("body") ?? ""),
  };
}

/* ---------------------------------------------------------------- auth ---- */

export async function login(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    // Checked here as well as in the UI: a server action is its own HTTP entry
    // point, so hiding the form is not a control.
    if (!isPasswordLoginAllowed()) {
      return { ok: false, error: "Sign in with GitHub." };
    }
    if (!checkPassword(String(form.get("password") ?? ""))) {
      return { ok: false, error: "Wrong password." };
    }
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- posts ---- */

export async function savePost(
  _: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const draft = draftFromForm(form);
    const errors = validateDraft(draft);
    if (errors.length > 0) return { ok: false, error: errors.join(" ") };

    // Present when editing: GitHub needs the blob sha to accept an update.
    const existingSha = String(form.get("sha") ?? "").trim() || undefined;
    const originalSlug = String(form.get("originalSlug") ?? "").trim();
    const isRename = Boolean(originalSlug) && originalSlug !== draft.slug;

    // Creating, or renaming into a name that is taken, must not silently
    // overwrite another post.
    if (!existingSha || isRename) {
      const clash = await getPostFile(draft.slug);
      if (clash) return { ok: false, error: `A post named "${draft.slug}" already exists.` };
    }

    await writeFile({
      path: `${POSTS_PATH}/${draft.slug}.md`,
      content: serializePost(draft),
      message: `${existingSha ? "Update" : "Add"} post: ${draft.slug}`,
      sha: isRename ? undefined : existingSha,
    });

    // A rename is a write to the new path plus a delete of the old one; the URL
    // changes, which also orphans that post's utterances thread.
    if (isRename) {
      const old = await getPostFile(originalSlug);
      if (old) {
        await deleteFile({
          path: `${POSTS_PATH}/${originalSlug}.md`,
          sha: old.sha,
          message: `Remove renamed post: ${originalSlug}`,
        });
      }
    }

    revalidatePath("/admin");
    return {
      ok: true,
      message: draft.draft
        ? "Saved as a draft — committed, but not published to the site."
        : "Committed. The site rebuilds in about 30 seconds.",
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function deletePost(
  _: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const slug = String(form.get("slug") ?? "").trim();
    if (!SLUG_PATTERN.test(slug)) return { ok: false, error: "Invalid slug." };

    const file = await getPostFile(slug);
    if (!file) return { ok: false, error: "That post no longer exists." };

    await deleteFile({
      path: `${POSTS_PATH}/${slug}.md`,
      sha: file.sha,
      message: `Delete post: ${slug}`,
    });
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

/* ----------------------------------------------------------------- bulk ---- */

export type BulkAction = "draft" | "publish" | "archive" | "unarchive";

const BULK_LABELS: Record<BulkAction, string> = {
  draft: "Mark as draft",
  publish: "Publish",
  archive: "Archive",
  unarchive: "Unarchive",
};

/**
 * Applies one flag change to many posts in a single commit.
 *
 * `draft` removes a post from the site entirely — no page, no listing.
 * `archive` keeps the page reachable by URL but drops it from the index, the
 * landing page and the sitemap. They are independent.
 */
export async function bulkUpdate(
  _: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const action = String(form.get("action") ?? "") as BulkAction;
    if (!(action in BULK_LABELS)) return { ok: false, error: "Unknown action." };

    const slugs = form
      .getAll("slugs")
      .map((value) => String(value).trim())
      .filter((slug) => SLUG_PATTERN.test(slug));

    if (slugs.length === 0) return { ok: false, error: "Select at least one post." };

    const files: { path: string; content: string }[] = [];
    let unchanged = 0;

    for (const slug of slugs) {
      const file = await getPostFile(slug);
      if (!file) continue;

      const draft = parsePost(slug, file.markdown);
      const next: PostDraft = {
        ...draft,
        draft: action === "draft" ? true : action === "publish" ? false : draft.draft,
        archived:
          action === "archive" ? true : action === "unarchive" ? false : draft.archived,
      };

      // Skip no-ops so the commit contains only real changes.
      if (next.draft === draft.draft && next.archived === draft.archived) {
        unchanged += 1;
        continue;
      }

      files.push({ path: `${POSTS_PATH}/${slug}.md`, content: serializePost(next) });
    }

    if (files.length === 0) {
      return { ok: false, error: `Nothing to change — ${unchanged} already in that state.` };
    }

    await commitFiles({
      files,
      message: `${BULK_LABELS[action]}: ${files.length} post${files.length === 1 ? "" : "s"}`,
    });

    revalidatePath("/admin");
    return {
      ok: true,
      message:
        `${BULK_LABELS[action]} applied to ${files.length} post${files.length === 1 ? "" : "s"} ` +
        `in one commit${unchanged ? `, ${unchanged} skipped` : ""}. Rebuilding.`,
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/* ------------------------------------------------------------- preview ---- */

/** Renders through the same pipeline the published page uses. */
export async function previewMarkdown(body: string): Promise<{ html: string }> {
  await requireAdmin();
  const { contentHtml } = await renderMarkdown(body);
  return { html: contentHtml };
}

/* -------------------------------------------------------------- images ---- */

export async function uploadImage(
  _: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image first." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image is larger than 4 MB." };
    }

    // Posts reference /blog/<name>, so keep the filename predictable and safe.
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!/\.(png|jpe?g|gif|webp|avif|svg)$/.test(safeName)) {
      return { ok: false, error: "Only png, jpg, gif, webp, avif or svg." };
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const imagePath = `${IMAGES_PATH}/${safeName}`;
    // Re-uploading the same filename replaces it, so the existing blob sha is needed.
    const existingSha = await getFileSha(imagePath);

    await writeFile({
      path: imagePath,
      content: base64,
      base64: true,
      message: `${existingSha ? "Replace" : "Add"} image: ${safeName}`,
      sha: existingSha ?? undefined,
    });

    return { ok: true, message: `![](/blog/${safeName})` };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
