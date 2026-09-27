"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { LuArrowLeft, LuImage, LuTrash2 } from "react-icons/lu";

import {
  type ActionResult,
  deletePost,
  previewMarkdown,
  savePost,
  uploadImage,
} from "@/app/admin/actions";
import { type PostDraft, suggestSlug } from "@/lib/admin/frontmatter";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle";
const label = "mb-1.5 block text-xs text-fg-subtle";

export default function PostEditor({
  initial,
  sha,
  mode,
}: {
  initial: PostDraft;
  /** Blob sha of the file being edited; absent when creating. */
  sha?: string;
  mode: "create" | "edit";
}) {
  const [draft, setDraft] = useState<PostDraft>(initial);
  const [tagText, setTagText] = useState(initial.tags.join(", "));
  // Only auto-fill the slug from the title while creating and untouched.
  const [slugLocked, setSlugLocked] = useState(mode === "edit");

  const [saveState, saveAction, saving] = useActionState<ActionResult | null, FormData>(
    savePost,
    null,
  );
  const [deleteState, deleteAction, deleting] = useActionState<ActionResult | null, FormData>(
    deletePost,
    null,
  );
  const [uploadState, uploadAction, uploading] = useActionState<ActionResult | null, FormData>(
    uploadImage,
    null,
  );

  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, startPreview] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function set<K extends keyof PostDraft>(key: K, value: PostDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function onTitleChange(value: string) {
    set("title", value);
    if (!slugLocked) set("slug", suggestSlug(value));
  }

  // A successful upload returns the markdown to paste; drop it at the caret.
  useEffect(() => {
    if (!uploadState?.ok) return;
    const snippet = uploadState.message;
    const textarea = bodyRef.current;

    setDraft((current) => {
      const caret = textarea?.selectionStart ?? current.body.length;
      const next = `${current.body.slice(0, caret)}\n${snippet}\n${current.body.slice(caret)}`;
      return { ...current, body: next };
    });
  }, [uploadState]);

  function refreshPreview() {
    startPreview(async () => {
      const { html } = await previewMarkdown(draft.body);
      setPreviewHtml(html);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <Link
          href="/admin"
          className="group inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg"
        >
          <LuArrowLeft
            className="size-3 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          All posts
        </Link>

        {mode === "edit" && (
          <form action={deleteAction}>
            <input type="hidden" name="slug" value={initial.slug} />
            <button
              type="submit"
              disabled={deleting}
              onClick={(event) => {
                if (!confirm(`Delete "${initial.slug}"? This removes the file from the repo.`)) {
                  event.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            >
              <LuTrash2 className="size-3.5" aria-hidden />
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </form>
        )}
      </div>

      {deleteState && !deleteState.ok && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {deleteState.error}
        </p>
      )}

      <form action={saveAction} className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* ------------------------------------------------------ fields ---- */}
        <div className="space-y-4">
          {sha && <input type="hidden" name="sha" value={sha} />}
          {mode === "edit" && (
            <input type="hidden" name="originalSlug" value={initial.slug} />
          )}

          <div>
            <label className={label} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              value={draft.title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="subtitle">
              Subtitle
            </label>
            <input
              id="subtitle"
              name="subtitle"
              value={draft.subtitle}
              onChange={(event) => set("subtitle", event.target.value)}
              placeholder="One line of context — leave empty if it would just repeat the tags"
              className={field}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="date">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={draft.date}
                onChange={(event) => set("date", event.target.value)}
                required
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="slug">
                Slug — becomes /blog/{draft.slug || "…"}
              </label>
              <input
                id="slug"
                name="slug"
                value={draft.slug}
                onChange={(event) => {
                  setSlugLocked(true);
                  set("slug", event.target.value);
                }}
                required
                className={cn(field, "font-mono text-xs")}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="tags">
              Tags — comma separated, stored lowercase
            </label>
            <input
              id="tags"
              name="tags"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="kubernetes, cloud"
              className={field}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                name="draft"
                checked={draft.draft}
                onChange={(event) => set("draft", event.target.checked)}
              />
              Draft — no page at all, and no listing
            </label>
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                name="archived"
                checked={draft.archived}
                onChange={(event) => set("archived", event.target.checked)}
              />
              Archived — URL still works, but hidden from the index and sitemap
            </label>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs text-fg-subtle" htmlFor="body">
                Body — markdown
              </label>
              <button
                type="button"
                onClick={refreshPreview}
                disabled={previewing}
                className="text-xs text-accent hover:text-accent-hover disabled:opacity-60"
              >
                {previewing ? "Rendering…" : "Refresh preview"}
              </button>
            </div>
            <textarea
              id="body"
              name="body"
              ref={bodyRef}
              value={draft.body}
              onChange={(event) => set("body", event.target.value)}
              rows={22}
              required
              className={cn(field, "resize-y font-mono text-xs leading-relaxed")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Committing…" : mode === "create" ? "Publish" : "Save"}
            </button>
            {draft.slug && !draft.draft && mode === "edit" && (
              <Link
                href={`/blog/${draft.slug}`}
                target="_blank"
                className="text-xs text-fg-subtle hover:text-fg"
              >
                View live ↗
              </Link>
            )}
          </div>

          {saveState && (
            <p
              role="status"
              className={cn("text-sm", saveState.ok ? "text-accent" : "text-red-500")}
            >
              {saveState.ok ? saveState.message : saveState.error}
            </p>
          )}
        </div>

        {/* ----------------------------------------------------- preview ---- */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-fg-subtle">Preview</p>
            <span className="text-xs text-fg-subtle">same pipeline as the live page</span>
          </div>

          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-5">
            {previewHtml ? (
              <div
                className="prose prose-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-fg-subtle">
                Press “Refresh preview” to render the markdown.
              </p>
            )}
          </div>
        </div>
      </form>

      {/* -------------------------------------------------------- images ---- */}
      <form action={uploadAction} className="mt-8 border-t border-border pt-6">
        <p className="mb-2 text-xs text-fg-subtle">
          Upload an image — commits to <code className="font-mono">public/blog/</code> and inserts
          the markdown at the caret
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
            className="text-xs text-fg-muted"
          />
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-60"
          >
            <LuImage className="size-3.5" aria-hidden />
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {uploadState && !uploadState.ok && (
            <span role="alert" className="text-xs text-red-500">
              {uploadState.error}
            </span>
          )}
          {uploadState?.ok && (
            <span className="text-xs text-accent">Inserted into the body.</span>
          )}
        </div>
      </form>
    </div>
  );
}
