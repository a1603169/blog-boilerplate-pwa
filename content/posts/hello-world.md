---
title: "Hello world"
subtitle: "What this file demonstrates"
date: "2025-01-01"
tags: ["meta"]
---

The filename becomes the URL: this file is `content/posts/hello-world.md`, so it is
served at `/blog/hello-world`.

## Headings become the table of contents

`h2` and `h3` get ids automatically and show up in the sidebar on wide screens, and in a
collapsed `Contents` block on narrow ones.

### Code is highlighted at build time

Dual light/dark themes come from shiki, so blocks follow the site theme:

```ts
export function greet(name: string): string {
  return `Hello, ${name}`;
}
```

### Tables scroll instead of overflowing

| Field | Required | Notes |
|---|---|---|
| `title` | yes | shown in lists and as the page `h1` |
| `date` | yes | must be `YYYY-MM-DD` |
| `tags` | no | folded to lowercase |
| `subtitle` | no | leave empty if it would just repeat the tags |
| `draft` | no | `true` keeps the post off the site entirely |

GitHub-flavoured markdown and raw HTML both work.
