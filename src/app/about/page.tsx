import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { aboutPage } from "@/src/lib/about-content";
import { displayFontClass, ui } from "@/src/lib/ui";

export const metadata: Metadata = {
  title: "About — MintMovies",
  description: "Team credits, upstream partner, and shared services.",
};

function ExternalLinkIcon() {
  return (
    <span aria-hidden="true" className="text-xs text-muted transition-colors group-hover:text-brand">
      ↗
    </span>
  );
}

function AboutExternalLink({
  href,
  children,
  block = false,
}: {
  href: string;
  children: ReactNode;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group ${block ? ui.aboutLinkBlock : ui.aboutLink}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{children}</span>
      <ExternalLinkIcon />
    </Link>
  );
}

function TeamSection() {
  return (
    <section className={`mb-8 ${ui.card}`}>
      <h2 className={`mb-4 ${ui.sectionTitle}`}>Our team</h2>
      <p className="mb-3 text-sm font-medium leading-relaxed text-prose">{aboutPage.teamIntro}</p>
      <p className="mb-3 text-sm font-medium leading-relaxed text-prose">{aboutPage.teamLeadNote}</p>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        {aboutPage.frontendDeliveryNote}
      </p>
      <ul className="divide-y divide-border">
        {aboutPage.teamMembers.map((member) => (
          <li
            key={member.name}
            className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className={`${displayFontClass} font-semibold text-brand`}>{member.name}</span>
            <span className="text-sm font-medium text-muted">{member.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PartnerSection() {
  return (
    <section className={`mb-8 ${ui.card}`}>
      <h2 className={`mb-4 ${ui.sectionTitle}`}>Upstream partner</h2>
      <p className="mb-4 text-sm font-medium leading-relaxed text-prose">
        <span className={`${displayFontClass} font-semibold text-brand`}>{aboutPage.partner.name}</span>
        {" — "}
        {aboutPage.partner.description}
      </p>
      <ul className="flex flex-col gap-3">
        {aboutPage.partner.links.map((link) => (
          <li key={link.href}>
            <AboutExternalLink href={link.href} block>
              {link.label}
            </AboutExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SharedServicesSection() {
  return (
    <section className={`mb-8 ${ui.card}`}>
      <h2 className={`mb-4 ${ui.sectionTitle}`}>Shared services</h2>
      <dl className="space-y-5">
        {aboutPage.sharedServices.map((service) => (
          <div key={service.name}>
            <dt className={ui.label}>{service.name}</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium leading-relaxed text-prose">{service.description}</span>
              <AboutExternalLink href={service.href}>Learn more</AboutExternalLink>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-muted">
        {aboutPage.deploymentNote}{" "}
        <AboutExternalLink href={aboutPage.deploymentHref}>
          {aboutPage.deploymentLabel}
        </AboutExternalLink>
      </p>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>About</p>
          <h1 className={ui.title}>{aboutPage.title}</h1>
          <p className={ui.subtitle}>{aboutPage.subtitle}</p>
        </header>

        <TeamSection />
        <PartnerSection />
        <SharedServicesSection />

        <p className={`text-center ${displayFontClass} text-xs font-semibold uppercase tracking-[0.15em] text-brand/60`}>
          {aboutPage.footerLine}
        </p>
      </div>
    </div>
  );
}
