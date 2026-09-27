# Deploying

Written for Vercel, because the admin publish flow depends on a **push-triggered build** and
Vercel gives that for free with a git connection. Anything that rebuilds on push works the
same way — see [Other hosts](#other-hosts).

## 1. Push to GitHub

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main                       # or whatever you prefer
git remote add origin git@github.com:your-handle/your-repo.git
git push -u origin main
```

The repository may be **private**. Only the comments repository has to be public — see
[Comments](#4-comments).

## 2. Create the Vercel project

1. <https://vercel.com/new>
2. **Import** your repository. Grant access to it if prompted.
3. Framework Preset should auto-detect **Next.js**. Leave build command, output directory
   and install command at their defaults.
4. **Do not deploy yet** — add the environment variables first (next step). A deploy without
   them still succeeds, but `/admin` will show a configuration error until you redeploy.

> It must be a **git-connected** project, not a one-off `vercel deploy` from your machine.
> The whole publish flow is "commit triggers build"; without the git connection, saving in
> `/admin` commits but nothing rebuilds.

## 3. Environment variables

`Project → Settings → Environment Variables`. If you cannot find it, go straight to:

```
https://vercel.com/<team-or-account>/<project>/settings/environment-variables
```

Environment Variables exist **only under a project**. The account and team settings pages do
not have them — a common wrong turn is clicking Settings from the dashboard instead of
opening the project first.

Add each one for **Production, Preview and Development**:

| Key | Value | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | your password | password sign-in |
| `ADMIN_SECRET` | `openssl rand -hex 32` | signs the session cookie |
| `GITHUB_TOKEN` | `github_pat_…` | see below |
| `GITHUB_REPO` | `your-handle/your-repo` | where posts are committed |
| `GITHUB_BRANCH` | `main` | the branch your deploys build from |

Optional, to also offer GitHub sign-in:

| Key | Value |
|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | from the OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | from the OAuth App |
| `ADMIN_GITHUB_LOGIN` | your GitHub username |

`ADMIN_GITHUB_LOGIN` is **not optional if you enable OAuth.** The OAuth App is public;
without a username allowlist, any GitHub account on earth could sign in.

### Creating the commit token

<https://github.com/settings/personal-access-tokens/new>

1. **Repository access** → `Only select repositories` → **this repository only**
2. **Permissions** → Repository permissions → **Contents: Read and write**
3. Copy the `github_pat_…` value immediately — it is shown once

Nothing else needs granting. Scoping it to one repository means a leak affects that
repository's files and nothing else.

Note the **expiration**: when it lapses, saving in `/admin` starts failing. Pick a long
window or set a calendar reminder.

### Creating the OAuth App (optional)

<https://github.com/settings/developers> → **New OAuth App**

| Field | Production | Local |
|---|---|---|
| Homepage URL | `https://your-domain` | `http://localhost:3000` |
| Authorization callback URL | `https://your-domain/admin/auth/callback` | `http://localhost:3000/admin/auth/callback` |

An OAuth App allows **one** callback URL, so register **two apps** — one per environment —
or use GitHub in production and the password locally.

## 4. Comments

utterances stores each comment thread as a GitHub issue and can only do that in a **public**
repository.

1. Create a public repo, e.g. `your-handle/your-blog-comments` — it holds nothing but issues
2. Leave **Issues** enabled
3. Install <https://github.com/apps/utterances> on it
4. Set `comments.repo` in `lib/site.ts` to that repository
5. Your source repository can now be private

Because `issueTerm` is `pathname`, the post URL is the lookup key. **Renaming a post file
orphans its comments.**

## 5. Deploy

`Deployments → Redeploy`, or push a commit.

Check the build log for the route table. `○` static, `●` SSG, `ƒ` dynamic. Only `/admin/**`
should be `ƒ`.

## 6. Custom domain

`Project → Settings → Domains → Add`. Vercel prints the DNS records to create at your
registrar — an `A` record for the apex, a `CNAME` for `www`.

Then update `site.url` in `lib/site.ts` and redeploy. It is used for canonical URLs, the
sitemap and Open Graph tags, so a stale value quietly hurts SEO and link previews.

## 7. Verify

| Check | Expected |
|---|---|
| `https://your-domain/` | landing page |
| `/blog` | post list, search and tag filters work |
| `/sitemap.xml` | one `<loc>` per post plus the static routes |
| `/robots.txt` | `Disallow: /admin` |
| `/manifest.webmanifest` | your name and icons |
| `/admin` | redirects to `/admin/login` |
| `/admin` after signing in | your posts listed |
| a post page | comments widget renders (not an error) |

Then publish something from `/admin` with **Draft** ticked. It should commit without
appearing on the site.

## Other hosts

The site is a plain Next.js app, so Netlify, Cloudflare Pages, Render, or a container all
serve it. Two requirements for `/admin` to work:

1. **A build triggered by a push to the branch in `GITHUB_BRANCH`** — otherwise saving
   commits but never publishes
2. **Server-side rendering for `/admin/**`** — it reads cookies per request, so a
   fully-static export (`output: "export"`) cannot host it. The blog itself would still
   work as a static export; you would just lose the editor.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `npm error code E401` on install | a machine-wide registry override in `~/.npmrc`, e.g. a corporate mirror. The bundled `.npmrc` pins the public registry to prevent this. |
| `/admin` shows `GITHUB_TOKEN … must all be set` | env vars missing, or added without a redeploy |
| Saving in `/admin` returns `GitHub 401` | token expired, revoked, or missing Contents: write |
| Saving in `/admin` returns `GitHub 404` | `GITHUB_REPO` or `GITHUB_BRANCH` wrong, or the token is not scoped to that repository |
| Commit lands but the site does not change | the Vercel project is not git-connected, or it builds a different branch than `GITHUB_BRANCH` |
| Build fails in sitemap generation | a post has a malformed `date`. The pipeline now warns and falls back instead, so check the build log for `[posts]`. |
| Comments show an error box | comments repo is private, Issues disabled, or the utterances app is not installed on it |
| GitHub sign-in says the account is not allowed | `ADMIN_GITHUB_LOGIN` does not match your username |
| GitHub sign-in redirect mismatch | the OAuth App callback URL does not match the environment you are on |
| Dev server crashes with `Cannot find module './vendor-chunks/...'` | `npm run build` ran while `npm run dev` was live; both write `.next`. Stop dev, `rm -rf .next`, restart. |
