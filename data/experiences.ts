/** Grouped by employer, newest first — the about page renders them in array order. */
export interface Role {
  /** Display range, e.g. `2024.01.01 - CURRENT`. */
  date: string;
  title: string;
}

export interface Experience {
  company: string;
  roles: Role[];
}

export const EXPERIENCES: Experience[] = [
  {
    company: "Current Employer",
    roles: [
      { date: "2025.01.01 - CURRENT", title: "Your Current Title" },
      { date: "2024.01.01 - 2024.12.31", title: "Your Previous Title" },
    ],
  },
  {
    company: "Earlier Employer",
    roles: [{ date: "2022.01.01 - 2023.12.31", title: "Your Title" }],
  },
];

/** A degree is not a job — keep education in its own section. */
export const EDUCATION = [
  {
    school: "Your University",
    date: "2018.09.01 - 2022.06.30",
    degree: "Bachelor, Your Subject",
  },
];
