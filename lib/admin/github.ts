import "server-only";

/**
 * Thin wrapper over the GitHub Contents API.
 *
 * Posts stay as markdown files in the repository — /admin commits to it rather
 * than replacing it with a database. A commit triggers the Vercel build, so
 * saving is what publishes.
 *
 * Reads go to the API rather than the local filesystem on purpose: the deployed
 * filesystem is a snapshot of the last build, so editing from it could clobber a
 * newer commit.
 */

const API = "https://api.github.com";

export const POSTS_PATH = "content/posts";
export const IMAGES_PATH = "public/blog";

function config() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  // Read from the environment so no branch name is hardcoded here.
  const branch = process.env.GITHUB_BRANCH;

  if (!token || !repo || !branch) {
    throw new Error(
      "GITHUB_TOKEN, GITHUB_REPO (owner/name) and GITHUB_BRANCH must all be set.",
    );
  }
  return { token, repo, branch };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = config();

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    // Always the current repository state, never a cached copy.
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub ${response.status} on ${path}: ${body.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}

interface ContentEntry {
  name: string;
  path: string;
  sha: string;
  type: string;
}

export interface PostFile {
  slug: string;
  sha: string;
}

export async function listPostFiles(): Promise<PostFile[]> {
  const { repo, branch } = config();
  const entries = await request<ContentEntry[]>(
    `/repos/${repo}/contents/${POSTS_PATH}?ref=${encodeURIComponent(branch)}`,
  );

  return entries
    .filter((entry) => entry.type === "file" && entry.name.endsWith(".md"))
    .map((entry) => ({ slug: entry.name.replace(/\.md$/, ""), sha: entry.sha }));
}

export async function getPostFile(
  slug: string,
): Promise<{ markdown: string; sha: string } | null> {
  const { repo, branch } = config();

  try {
    const file = await request<{ content: string; encoding: string; sha: string }>(
      `/repos/${repo}/contents/${POSTS_PATH}/${slug}.md?ref=${encodeURIComponent(branch)}`,
    );
    return {
      markdown: Buffer.from(file.content, file.encoding as BufferEncoding).toString("utf8"),
      sha: file.sha,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("GitHub 404")) return null;
    throw error;
  }
}

/** Blob sha for any path, or null when it does not exist. Needed to overwrite. */
export async function getFileSha(filePath: string): Promise<string | null> {
  const { repo, branch } = config();

  try {
    const file = await request<{ sha: string }>(
      `/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
    );
    return file.sha;
  } catch (error) {
    if (error instanceof Error && error.message.includes("GitHub 404")) return null;
    throw error;
  }
}

/** Creates when `sha` is omitted, updates when it is supplied. */
export async function writeFile(options: {
  path: string;
  /** UTF-8 text, or a base64 string when `base64` is true. */
  content: string;
  base64?: boolean;
  message: string;
  sha?: string;
}): Promise<{ sha: string }> {
  const { repo, branch } = config();
  const { path: filePath, content, base64 = false, message, sha } = options;

  const result = await request<{ content: { sha: string } }>(
    `/repos/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        branch,
        content: base64 ? content : Buffer.from(content, "utf8").toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    },
  );

  return { sha: result.content.sha };
}

export async function deleteFile(options: {
  path: string;
  sha: string;
  message: string;
}): Promise<void> {
  const { repo, branch } = config();

  await request(`/repos/${repo}/contents/${options.path}`, {
    method: "DELETE",
    body: JSON.stringify({ message: options.message, branch, sha: options.sha }),
  });
}
