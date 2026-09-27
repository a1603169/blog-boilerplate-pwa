# Next.js Markdown Blog Boilerplate

A personal site and blog: markdown files in the repository, every post prerendered, an
in-browser admin that commits posts back to git, installable as a PWA.

**Posts stay plain markdown in `content/posts/`.** No database, no CMS service. At runtime
the site is static HTML on a CDN, so hosting is free and there is nothing to keep alive.

## Example

Please check the link

https://seunghun-website.vercel.app/ 

## Documentation

| | |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | why markdown-as-database, the rendering model, build-time data flow, the publish pipeline, and the traps |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel step by step, environment variables, tokens, custom domain, troubleshooting |

## Stack

| | |
|---|---|
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Markdown | unified / remark / rehype, GFM, raw HTML |
| Highlighting | shiki via `rehype-pretty-code`, dual light/dark theme |
| Comments | utterances, in a separate public repo |
| PWA | hand-written service worker in `public/sw.js` |

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill it in — see "Admin" below
npm run dev                    # http://localhost:3000
```

```bash
npm run build      # prerenders every post
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint
```

## First things to change

1. **`lib/site.ts`** — name, role, description, URL, nav, social links, comments repo,
   EmailJS ids. Every page reads from here.
2. **`data/experiences.ts`**, **`data/projects.ts`** — about and work pages.
3. **`app/page.tsx`** — the intro paragraph in the hero. Write it in your own voice;
   placeholder marketing copy is the fastest way to make a site feel generic.
4. **`app/globals.css`** — the accent colour is `--accent`, defined once for light and
   once for dark.
5. **`public/`** — replace `favicon.ico`, and add the two PWA icons referenced by
   `app/manifest.ts` (192×192 and 512×512).
6. **`content/posts/`** — delete `hello-world.md` once you have read it.

## Layout

```
app/
  admin/                admin UI and server actions
  blog/                 index and [slug] post pages
  globals.css           design tokens, base styles, prose, shiki themes
  layout.tsx            fonts, metadata, theme script, header/footer
  manifest.ts           PWA manifest (replaces public/manifest.json)
  robots.ts sitemap.ts
components/
  admin/                login form, post table, editor
  blog/                 post list, search + tag browser, TOC, comments, pagination
  layout/               header, footer, theme toggle, back-to-top, SW registration
  ui/                   container, tag, reveal, project card, social links
content/posts/          your markdown — the source of truth
data/                   projects, experience
lib/
  admin/                auth, GitHub API, frontmatter serialisation
  posts.ts              markdown pipeline: frontmatter, HTML, headings, search index
  site.ts               everything configurable
types/post.ts
```

## Writing a post

Add a file to `content/posts/`. The filename becomes the URL:
`content/posts/my-post.md` → `/blog/my-post`.

```markdown
---
title: "Post title"
subtitle: "One line of context"
date: "2025-01-01"
tags: [Kubernetes, Cloud]
---

## First section
```

- `date` must be `YYYY-MM-DD`. An invalid value logs a warning at build time and falls
  back to the epoch rather than failing the build.
- `tags` are folded to lowercase, so `Kubernetes` and `kubernetes` are one tag.
- `draft: true` keeps a post off the site entirely — no list entry, no generated page.
- `h2`/`h3` get ids automatically and appear in the table of contents.
- Tables are wrapped in a horizontal scroller; raw HTML passes through.

## Admin

`/admin` gives you create, edit, delete, drafts, archiving, bulk actions, image upload, and
a preview that renders through the *same* pipeline as the published page. Saving commits to
the repository, and the commit triggers your host's build — so **saving is what publishes**,
live in ~30s.

Two ways to take a post out of circulation, and they differ:

| | Page | Listings, sitemap | Search engines |
|---|---|---|---|
| `draft: true` | does not exist | absent | — |
| `archived: true` | still reachable | absent | `noindex` |

Bulk actions apply either flag to many posts in a **single commit** via the Git Trees API —
one commit and one build no matter how many you select. Doing it through the Contents API
would be one commit, and one build, per file.

Reads go to the GitHub API rather than the deployed filesystem, which is only a snapshot
of the last build; editing from that snapshot could clobber a newer commit.

**In production, GitHub is the only way in.** Admin access means proving you are the
account in `ADMIN_GITHUB_LOGIN` — not knowing a password, which is a shared secret that
can leak. Nothing configured means no way in at all: the login page fails closed.

OAuth is identity only. Commits still use the PAT, because an OAuth App token carries the
whole `repo` scope across every repository the account can reach, while a fine-grained PAT
is scoped to this repository's contents.

| Variable | Purpose |
|---|---|
| `ADMIN_SECRET` | signs the session cookie — `openssl rand -hex 32` |
| `GITHUB_TOKEN` | fine-grained PAT, this repo only, Contents: read and write |
| `GITHUB_REPO` | `owner/name` |
| `GITHUB_BRANCH` | branch to commit to |
| `GITHUB_OAUTH_CLIENT_ID` | OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | OAuth App |
| `ADMIN_GITHUB_LOGIN` | the only username allowed to sign in |

An OAuth App allows one callback URL, so register one app per environment, pointing at
`…/admin/auth/callback`.

`ADMIN_PASSWORD` enables password sign-in **in development only** — `checkPassword()`
refuses when `NODE_ENV=production`, and the server action re-checks independently of the
UI. It exists so you can work locally without registering a `localhost` OAuth App first.

Set the same variables in your host's dashboard, then redeploy — they are injected at
build time, so adding them without a rebuild has no effect. Full walkthrough, including how
to create the token and the OAuth App: [docs/DEPLOY.md](docs/DEPLOY.md).

## Comments, and keeping the source private

utterances stores each comment thread as a GitHub issue and can only do so in a **public**
repository. If you want the source private, point `comments.repo` in `lib/site.ts` at a
separate public repository that holds nothing but issues:

1. Create a public repo, e.g. `your-handle/your-blog-comments`
2. Keep Issues enabled
3. Install <https://github.com/apps/utterances> on it
4. Set `comments.repo` to `your-handle/your-blog-comments`
5. Now the source repo can be private

`issueTerm: "pathname"` means the URL is the lookup key, so **renaming a post file orphans
its comments**. Treat published slugs as permanent.

## Deploying

```bash
git init && git add -A && git commit -m "Initial commit"
git remote add origin git@github.com:your-handle/your-repo.git
git push -u origin main
```

Then import the repo at <https://vercel.com/new> and add the environment variables above.
The project must be **git-connected**: the publish flow is "commit triggers build", so
without it `/admin` commits but nothing rebuilds.

Step by step, with tokens, domains and a troubleshooting table:
[docs/DEPLOY.md](docs/DEPLOY.md).

## Design notes

Light and dark define the same token names in `app/globals.css`, so components carry no
`dark:` colour variants — only that one file knows there are two schemes. Serif is reserved
for page titles, post titles and `h1`/`h2` in prose; monospace for dates and pagination.
Keeping those narrow is what stops the design reading as a template.

More on the token setup and why nothing is done at runtime that can be done at build time:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## PWA

`public/sw.js` is hand-written: network-first for navigations, cache-first for
content-hashed build assets, stale-while-revalidate for images. `/admin` is excluded so
authenticated HTML never lands in the cache. Registered by
`components/layout/ServiceWorkerRegistrar.tsx` in production only.
