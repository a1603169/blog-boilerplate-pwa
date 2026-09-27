import "server-only";

import { comments } from "@/lib/site";

/**
 * Comment counts per post, read from the utterances repository.
 *
 * utterances stores one issue per post, titled with the page pathname
 * (`blog/<slug>`), so the issue list doubles as a comment count index.
 *
 * Read without a token: that repository is public, and the fine-grained PAT in
 * GITHUB_TOKEN is scoped to the source repository only. Unauthenticated reads are
 * rate limited, so this runs at build time rather than per visitor — see the
 * `revalidate` on the blog index for how often counts refresh.
 *
 * Never throws. A failure here must not fail a build or hide the post list; the
 * counts simply do not render.
 */

interface Issue {
  title: string;
  comments: number;
}

const PER_PAGE = 100;
/** Guard against paging forever if the repository ever accumulates many issues. */
const MAX_PAGES = 10;

export type CommentCounts = Record<string, number>;

export async function getCommentCounts(): Promise<CommentCounts> {
  const counts: CommentCounts = {};

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetch(
        `https://api.github.com/repos/${comments.repo}/issues` +
          `?state=all&per_page=${PER_PAGE}&page=${page}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (!response.ok) {
        console.warn(`[comments] GitHub ${response.status}; comment counts omitted.`);
        return counts;
      }

      const issues = (await response.json()) as Issue[];
      if (!Array.isArray(issues) || issues.length === 0) break;

      for (const issue of issues) {
        // Only issues utterances created for a post; project issues are ignored.
        const match = /^blog\/(.+)$/.exec(issue.title.trim());
        if (!match) continue;
        // Strip a trailing slash if the pathname was stored with one.
        const slug = match[1].replace(/\/$/, "");
        if (slug) counts[slug] = issue.comments;
      }

      if (issues.length < PER_PAGE) break;
    }
  } catch (error) {
    console.warn("[comments] Could not read comment counts:", error);
  }

  return counts;
}
