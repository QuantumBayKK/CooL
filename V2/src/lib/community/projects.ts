/**
 * Community projects. CooL SDK is the one real project today; Phase 4 moves this list into the
 * database (projects created through The Commons and linked repositories).
 */
export type Project = {
  slug: string;
  name: string;
  summary: string;
  repo: string;
  license: string;
  language: string;
  status: "active";
  links: { label: string; href: string }[];
};

export const PROJECTS: Project[] = [
  {
    slug: "cool-sdk",
    name: "CooL SDK",
    summary: "The SDK, CLI and offline verifier that seal every AI change as a post-quantum signed, tamper-evident receipt.",
    repo: "Northwind-Cipher/cool-sdk",
    license: "BUSL-1.1",
    language: "TypeScript",
    status: "active",
    links: [
      { label: "Repository", href: "https://github.com/Northwind-Cipher/cool-sdk" },
      { label: "Contribution guide", href: "https://github.com/Northwind-Cipher/cool-sdk/blob/main/CONTRIBUTING.md" },
      { label: "Security policy", href: "https://github.com/Northwind-Cipher/cool-sdk/blob/main/SECURITY.md" },
      { label: "Documentation", href: "/docs" },
    ],
  },
];

export function projectBySlug(slug: string) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
