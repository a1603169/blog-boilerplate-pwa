import type { Metadata } from "next";

import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/ui/Reveal";
import { EDUCATION, EXPERIENCES } from "@/data/experiences";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${site.name} — ${site.role}. Background, experience and education.`,
};

/**
 * Section labels are plain sans, not mono uppercase.
 *
 * Every label on this page used to be a tracked-out mono eyebrow — role, born,
 * nationality, languages. Applied without exception it stopped
 * reading as emphasis and started reading as a template, so mono is now reserved
 * for dates and tags, where tabular figures actually earn it.
 */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border py-8 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <h2 className="text-sm text-fg-subtle sm:pt-0.5">{label}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-12">
      <PageHeader title={site.name} />

      <Reveal>
        {/* One-line facts share a single block. They previously occupied three
            separate bordered sections, which gave a date of birth the same
            visual weight as ten years of work history. */}
        <dl className="grid gap-x-8 gap-y-2 py-7 text-base sm:grid-cols-[9rem_1fr]">
          <dt className="text-sm text-fg-subtle">Role</dt>
          <dd className="text-fg">{site.role}</dd>

          <dt className="text-sm text-fg-subtle">Born</dt>
          <dd className="text-fg">1997.05.01</dd>

          <dt className="text-sm text-fg-subtle">Nationality</dt>
          <dd className="text-fg">Republic of Korea</dd>

          <dt className="text-sm text-fg-subtle">Languages</dt>
          <dd className="text-fg">{site.languages.join(", ")}</dd>
        </dl>


        <Section label="Experience">
          <ul className="space-y-6">
            {EXPERIENCES.map((experience) => (
              <li key={experience.company}>
                <h3 className="text-base text-fg">{experience.company}</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {experience.roles.map((role) => (
                    /* Mono earns its place here: the dates form a column and
                       tabular figures keep it aligned across every role. */
                    <li key={role.date} className="grid gap-x-4 sm:grid-cols-[11rem_1fr]">
                      <span className="label-mono text-fg-subtle sm:pt-px">{role.date}</span>
                      <span className="text-sm text-fg-muted">{role.title}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>
        <Section label="Education">
          <ul className="space-y-4">
            {EDUCATION.map((entry) => (
              <li key={entry.school}>
                <h3 className="text-base text-fg">{entry.school}</h3>
                <div className="mt-1.5 grid gap-x-4 sm:grid-cols-[11rem_1fr]">
                  <span className="label-mono text-fg-subtle sm:pt-px">{entry.date}</span>
                  <span className="text-sm text-fg-muted">{entry.degree}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </Reveal>
    </Container>
  );
}
