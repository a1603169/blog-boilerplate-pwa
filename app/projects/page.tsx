import type { Metadata } from "next";

import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import ProjectCard from "@/components/ui/ProjectCard";
import Reveal from "@/components/ui/Reveal";
import { PROJECTS, type ProjectStatus } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work",
  description: "Shipped products, side projects and archived client work.",
};

const GROUPS: { status: ProjectStatus; label: string }[] = [
  { status: "live", label: "Live" },
  { status: "wip", label: "In progress" },
  { status: "archived", label: "Archived" },
];

export default function ProjectsPage() {
  return (
    <Container width="wide" className="py-10 sm:py-12">
      <PageHeader title="Work" />

      <div>
        {GROUPS.map(({ status, label }, groupIndex) => {
          const projects = PROJECTS.filter((project) => project.status === status);
          if (projects.length === 0) return null;

          // The very first project leads with a wide panel; everything after it
          // sits in the grid. Two columns rather than three so the screenshots
          // are large enough to actually read.
          const [lead, ...rest] = groupIndex === 0 ? projects : [];
          const grid = groupIndex === 0 ? rest : projects;

          return (
            <Reveal
              as="section"
              key={status}
              delay={groupIndex * 60}
              // `first:border-t-0` — PageHeader already draws the rule above.
              className="border-t border-border py-8 first:border-t-0"
            >
              <h2 className="mb-6 text-sm text-fg-subtle">{label}</h2>

              {lead && (
                <div className="mb-6">
                  <ProjectCard project={lead} featured />
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {grid.map((project) => (
                  <ProjectCard key={project.title} project={project} />
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}
