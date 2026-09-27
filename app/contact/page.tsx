import type { Metadata } from "next";

import ContactForm from "@/components/contact/ContactForm";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import SocialLinks from "@/components/ui/SocialLinks";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about work, collaboration or anything on the blog.",
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-12">
      <PageHeader title="Get in touch" />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-sm text-fg-subtle">Elsewhere</h2>
          <SocialLinks className="-ml-2 mt-2" />
        </div>
        <ContactForm />
      </div>
    </Container>
  );
}
