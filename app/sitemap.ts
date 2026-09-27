import type { MetadataRoute } from "next";

import { getPostSummaries } from "@/lib/posts";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPostSummaries();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/projects`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
