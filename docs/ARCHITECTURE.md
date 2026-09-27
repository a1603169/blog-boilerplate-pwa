# Architecture

## The one decision everything follows from

**Markdown files in the repository are the database.**

There is no Postgres, no headless CMS, no content API. `content/posts/*.md` is the source of
truth, it is versioned by git, and it is parsed at build time into static HTML.

What that buys:

| | |
|---|---|
| Runtime cost | zero — no queries, no server, no connection pool |
| Hosting cost | zero on a free tier |
| Response time | static HTML from a CDN edge |
| Backups | your git history |
| Portability | the content is plain text you own; the framework is replaceable |
| Offline editing | any text editor |

What it costs:

| | |
|---|---|
| Publishing latency | a build, roughly 30s for a few hundred posts |
| Search | client-side over an index shipped with the page, not a query engine |
| Concurrent authors | one; git is the conflict resolution |

Moving to a database would make the site **slower** (dynamic rendering instead of static),
**more expensive** (a service to pay for and keep alive), and **less portable**, while only
improving publish latency. For a personal blog that is the wrong trade. The in-browser
editor at `/admin` solves the real friction — writing without a local git clone — without
giving up any of the above.

## Rendering model

Next.js App Router. Every route is one of three kinds:

| Route | Mode | Why |
|---|---|---|
| `/`, `/blog`, `/about`, `/projects`, `/contact`, `/success` | Static | Content changes only when you rebuild |
| `/blog/[slug]` | SSG via `generateStaticParams` | One prerendered page per markdown file |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Static | Generated from `lib/site.ts` and the post list |
| `/admin/**` | Dynamic (`force-dynamic`) | Reads cookies and the GitHub API per request |

`npm run build` prints this table. `○` is static, `●` is SSG, `ƒ` is dynamic. If a page you
expect to be static shows as `ƒ`, something in its tree read cookies, headers or
`searchParams` — that is the usual cause and it silently costs you the CDN.

> This is why the Admin link in the header is revealed by a **client-side cookie check**
> rather than a server-side session read. Reading the session in the root layout would make
> every page dynamic and give up every prerendered post. See `components/layout/SiteHeader.tsx`.

## Build-time data flow

```
content/posts/*.md
      │
      ▼
 lib/posts.ts  ── gray-matter ──▶ frontmatter (title, subtitle, date, tags, draft)
      │
      ├─ remark-parse → remark-gfm
      ├─ remark-rehype (allowDangerousHtml) → rehype-raw     raw HTML in posts survives
      ├─ rehype-slug                                         heading ids
      ├─ rehypeWrapTables (local plugin)                     wide tables scroll
      ├─ rehype-pretty-code + shiki                          dual light/dark themes
      └─ rehype-stringify
      │
      ▼
 { contentHtml, headings, searchText }
      │
      ├──▶ /blog/[slug]   full HTML + table of contents
      ├──▶ /blog          summaries only (no contentHtml) + search index
      └──▶ /sitemap.xml   slugs and dates
```

Everything above runs **once per build**, never in a browser and never per request.

### Why a single choke point matters

`lib/posts.ts` is the only module that reads post files. Normalisation lives there:

- **Dates** are validated to `YYYY-MM-DD`. A malformed value logs a warning and falls back
  to the epoch. Before this existed, one typo (`date: "2024-04-01="`) failed the whole
  production build inside sitemap generation.
- **Tags** are folded to lowercase, so `Kubernetes` and `kubernetes` are one tag.
- **Drafts** are filtered out here, which means a draft has no page *and* no list entry —
  not merely an unlinked one.
- **Parsing is memoised** per Node process, because `generateStaticParams` and every page
  render want the same data.

Add a rule here and every consumer gets it. Add it in a component and you will add it
again in the next component.

### Nothing is done at runtime that can be done at build time

This is the load-bearing principle. An earlier version of this codebase assigned heading
ids and injected table styling from a `useEffect`. That meant anchors did not exist until
after hydration, and the injected Tailwind classes were never compiled — the class names
existed only at runtime, so the CSS for them was never generated. Both now happen in the
markdown pipeline.

## The client-side search index

`/blog` filters 200+ posts instantly, with no network round trip, by shipping a small index.

`SEARCH_TEXT_LIMIT` in `lib/posts.ts` caps the body excerpt per post. It is a **page-weight
budget, not a search-quality knob**: the index appears twice in the response — once in the
HTML and again in the RSC payload for hydration. Doubling the limit roughly doubles its
contribution.

For reference, on a 246-post site: 240 characters kept `/blog` at ~54 kB gzipped; 400
pushed it to ~77 kB for little extra recall.

Search therefore covers title, subtitle, tags and the opening of the body. If you want
whole-body search, move filtering to the server and accept a round trip per keystroke.

## Publishing from /admin

```
you in a browser (desktop or phone)
      │
      ▼
/admin  ── server action ──▶ GitHub Contents API ──▶ commit to content/posts/
      │                                                     │
      │                                                     ▼
      │                                            push webhook → Vercel build
      │                                                     │
      ▼                                                     ▼
 preview via lib/posts.ts                          new static HTML on the CDN
 (identical pipeline)                                    ~30 seconds
```

Three deliberate choices:

1. **Reads go to the GitHub API, not the local filesystem.** The deployed filesystem is a
   snapshot of the last build. Editing from that snapshot could clobber a newer commit.
2. **Preview uses the exported `renderMarkdown()` from `lib/posts.ts`** — the same function
   the published page uses. What the editor shows is what ships, down to the syntax
   highlighting.
3. **Frontmatter is serialised with `JSON.stringify` per field**, which is also valid YAML.
   A title containing a colon or an apostrophe cannot corrupt the file. Hand-typed
   frontmatter is exactly how the bad-date build failure happened.

### Auth

One session, reached two ways — but only one of them works in production:

- **GitHub OAuth** — the production path. `ADMIN_GITHUB_LOGIN` restricts it to a single
  username, so admin rights follow the account (and whatever 2FA protects it) rather than
  a secret anyone could pass along.
- **Password** — development only. `checkPassword()` returns false when
  `NODE_ENV=production`, and the `login` server action checks the same thing again, because
  a server action is its own HTTP entry point and hiding a form is not a control.

The password survives locally only because an OAuth App permits one callback URL, so a
production app cannot authorise `localhost`.

OAuth deliberately does **not** supply the commit credential. An OAuth App token carries
the whole `repo` scope across every repository the account can reach, while the
fine-grained PAT in `GITHUB_TOKEN` is scoped to one repository's contents. Signing in with
GitHub proves who you are; it does not widen what the app can write.

A second cookie, `admin_hint`, is readable by client JS. It grants nothing — it only tells
the header whether to draw the Admin link, so the nav can stay clean for visitors while
remaining reachable on a phone. Every admin page and every server action re-checks the real
signed cookie.

## Styling

Tailwind v4, configured in CSS rather than a JS config file.

`app/globals.css` defines tokens (`--bg`, `--fg`, `--accent`, …) twice: once in `:root` and
once in `.dark`. `@theme inline` maps them to Tailwind utilities, so `bg-bg` and
`text-fg-muted` resolve through a CSS variable rather than a baked value.

**Components therefore contain no `dark:` colour variants.** Only `globals.css` knows there
are two colour schemes. Changing the accent is two lines.

Dark mode is class-driven (`@custom-variant dark`) so a toggle can override the OS setting.
An inline script in `app/layout.tsx` applies the stored choice before first paint; without
it the page renders in the OS scheme and then visibly snaps.

## PWA

`public/sw.js` is hand-written, ~120 lines, no build step:

| Request | Strategy |
|---|---|
| Navigations | network-first, fall back to cache, then to the cached `/` |
| `/_next/static/*` | cache-first — content-hashed, so never stale |
| Images and fonts | stale-while-revalidate |
| `/admin/**`, `/api/*`, `/sw.js` | never handled |

`/admin` is excluded on purpose: caching it would serve a stale editor and leave
signed-in HTML in the cache.

This replaced `next-pwa`, which is unmaintained, does not support Next 15, and committed a
~250 kB generated Workbox bundle that had to be regenerated on every build.

## Bulk edits are one commit

`commitFiles()` in `lib/admin/github.ts` uses the Git **Trees** API: create a blob per file,
layer a tree on the parent's, commit, move the branch. Five requests regardless of how many
files change.

The Contents API that `writeFile()` uses is one commit per file, so a bulk action over
twenty posts would push twenty commits and trigger twenty builds.

## Comment counts

utterances names each issue after the post's pathname, so the issue list doubles as a count
index — see `lib/comments.ts`. It reads the comments repository **without a token** (that
repo is public, and the PAT is scoped elsewhere) and never throws: a failure omits the
counts rather than failing a build.

A new comment does not trigger a deploy, so the blog index and landing page set
`revalidate = 3600`. They stay prerendered and CDN-cached; the numbers just refresh hourly
instead of freezing at whatever they were when you last published.

## Things that will bite you

| | |
|---|---|
| **Renaming a post file** | utterances keys comment threads on the pathname. A rename orphans that post's comments. Treat published slugs as permanent. |
| **A page unexpectedly `ƒ` in the build table** | something read cookies, headers or `searchParams` in its tree. You just lost the CDN for that route. |
| **Env vars added but not applied** | they are injected at build time. Adding them without a redeploy does nothing. |
| **`npm run build` while `npm run dev` is running** | both write `.next`. The dev server then fails with `Cannot find module './vendor-chunks/...'`. Stop dev first. |
| **Raw HTML in a post** | passes through by design (`rehype-raw`), so a stray unclosed tag can break a page's layout. |
