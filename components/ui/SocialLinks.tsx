import type { IconType } from "react-icons";
import { LuGithub, LuInstagram, LuLinkedin } from "react-icons/lu";

import { socialLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons: Record<string, IconType> = {
  github: LuGithub,
  linkedin: LuLinkedin,
  instagram: LuInstagram,
};

export default function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {socialLinks.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        return (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="grid size-9 place-items-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              <Icon className="size-4" aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
