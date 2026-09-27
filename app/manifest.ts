import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Replaces the hand-maintained `public/manifest.json`, whose icon paths were
 * relative (`./sh-dev-log.png`) and so resolved differently depending on the
 * page the manifest was fetched from.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    short_name: "Dev Log",
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf9f4",
    theme_color: "#fbf9f4",
    icons: [
      { src: "/sh-dev-log.png", sizes: "192x192", type: "image/png" },
      { src: "/sh-dev-log-large.png", sizes: "512x512", type: "image/png" },
      {
        src: "/sh-dev-log-large.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
