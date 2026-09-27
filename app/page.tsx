import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

import PostListItem from "@/components/blog/PostListItem";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/ui/ProjectCard";
import Reveal from "@/components/ui/Reveal";
import SocialLinks from "@/components/ui/SocialLinks";
import { PROJECTS } from "@/data/projects";
import { getCommentCounts } from "@/lib/comments";
import { getPostSummaries } from "@/lib/posts";
import { site } from "@/lib/site";

const RECENT_COUNT = 5;

function SectionHeading({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
      <h2 className="text-sm text-fg-subtle">{label}</h2>
      <Link
        href={href}
        className="group flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
      >
        {cta}
        <LuArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}

/* Regenerated hourly so the comment counts stay roughly current. */
export const revalidate = 3600;

export default async function HomePage() {
  const [posts, commentCounts] = await Promise.all([getPostSummaries(), getCommentCounts()]);
  const recent = posts.slice(0, RECENT_COUNT);
  const featured = PROJECTS.filter((project) => project.status === "live").slice(0, 3);

  return (
    <>
      {/* Full-bleed warm band, borrowed from the panel-per-section rhythm of the
          Starbucks Korea layout. It gives the page an opening without needing
          hero photography we do not have. */}
      <section className="border-b border-border bg-bg-subtle">
        <Container className="py-12 sm:py-16">
          <Reveal>
            <p className="text-sm text-fg-muted">{site.role}</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl">
              {site.name}
            </h1>
            {/* The role sits directly above, so this adds the trajectory and
                says what the writing actually is. Edit the copy here. */}
            <p className="mt-4 max-w-prose text-base leading-relaxed text-fg-muted">
              Cloud delivery at AWS, after support engineering and a few years of product work in
              Japan and Finland. I study in public — {posts.length} posts, mostly Kubernetes and
              cloud certifications.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
              >
                Read the writing
                <LuArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center rounded-lg border border-border-strong px-4 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                See the work
              </Link>
              <SocialLinks className="ml-auto sm:ml-2" />
            </div>
          </Reveal>
        </Container>
      </section>

      <Container className="py-12 sm:py-14">
        <Reveal as="section">
          <SectionHeading label="Recent writing" href="/blog" cta="All posts" />
          <ul>
            {recent.map((post) => (
              <PostListItem
                key={post.slug}
                post={post}
                commentCount={commentCounts[post.slug] ?? 0}
              />
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" delay={80} className="mt-12">
          <SectionHeading label="Selected work" href="/projects" cta="All projects" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </Reveal>
      </Container>
    </>
  );
}
