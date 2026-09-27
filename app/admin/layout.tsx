import type { Metadata } from "next";

/* Every admin page reads cookies, so none of this can be statically rendered. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
