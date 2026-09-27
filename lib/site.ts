/**
 * Single source of truth for anything that would otherwise be hardcoded in JSX:
 * nav items, social links, external URLs, EmailJS ids, comment storage.
 *
 * Fill these in first — every page reads from here.
 */

export const site = {
  name: "Your Name",
  shortName: "Your Name",
  role: "What you do @ Where",
  title: "Your Dev Log",
  description:
    "One or two sentences describing the site. Used as the default meta description.",
  /** No trailing slash. Used for canonical URLs, sitemap and Open Graph. */
  url: "https://example.com",
  locale: "en",
  since: new Date().getFullYear(),
  languages: ["English"],
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Renders as a plain anchor with an external-link affordance. */
  external?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/blog", label: "Writing" },
  { href: "/projects", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const socialLinks = [
  { href: "https://github.com/your-handle", label: "GitHub", icon: "github" },
  { href: "https://www.linkedin.com/in/your-handle/", label: "LinkedIn", icon: "linkedin" },
  { href: "https://www.instagram.com/your-handle/", label: "Instagram", icon: "instagram" },
] as const;

/**
 * utterances stores each comment thread as an issue, keyed on `pathname`, and the
 * repository it writes to must be PUBLIC.
 *
 * Point this at a dedicated public repository — then this source repo can be
 * private while comments stay publicly readable. Install the app on that repo:
 * https://github.com/apps/utterances
 *
 * Because the key is the pathname, renaming a post file orphans its comments.
 */
export const comments = {
  repo: "your-handle/your-blog-comments",
  issueTerm: "pathname",
} as const;

/** https://www.emailjs.com — powers the contact form. */
export const emailjs = {
  serviceId: "",
  templateId: "",
  publicKey: "",
} as const;

export const POSTS_PER_PAGE = 12;
