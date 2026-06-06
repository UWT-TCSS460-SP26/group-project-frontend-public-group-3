export type TeamMember = {
  name: string;
  role: string;
};

export const aboutPage = {
  title: "MintMovies",
  subtitle:
    "Credits for Group 3, our upstream API partner, and the shared services this app builds on.",
  teamIntro:
    "Group 3 built MintMovies for TCSS 460. Everyone on the team contributed across frontend and backend integration work.",
  teamLeadNote:
    "Christian Dedios served as team lead, coordinating sprint work and partner handoffs.",
  frontendDeliveryNote:
    "Frontend delivery (Sprints 5–8): browse, search, title details, ratings, reviews, profile, and UI polish for this app.",
  teamMembers: [
    { name: "Christian Dedios", role: "Team lead; full-stack" },
    { name: "Khalid Mohamed", role: "Full-stack" },
    { name: "Kevin Lam", role: "Full-stack" },
    { name: "Jorge Reyes-Cruz", role: "Full-stack" },
    { name: "Sungmin Cha", role: "Full-stack" },
  ] satisfies TeamMember[],
  partner: {
    name: "Group 2",
    description:
      "Group 2’s REST API powers browse, search, title details, ratings, and reviews in MintMovies. Their backend was built in Sprints 1–4 with TMDB-backed metadata and community ratings/reviews.",
    links: [
      {
        label: "API base URL",
        href: "https://group-2-9289.onrender.com",
      },
      {
        label: "OpenAPI docs",
        href: "https://group-2-9289.onrender.com/api-docs",
      },
      {
        label: "Partner README",
        href: "https://github.com/UWT-TCSS460-SP26/group-project-backend-group-2-3/blob/main/README.md",
      },
    ],
  },
  sharedServices: [
    {
      name: "TMDB",
      description: "Movie and TV metadata, including posters and synopses.",
      href: "https://www.themoviedb.org/",
    },
    {
      name: "Auth²",
      description:
        "OAuth2 / OIDC sign-in for the course. Issuer: https://tcss-460-iam.onrender.com",
      href: "https://tcss-460-iam.onrender.com",
    },
    {
      name: "TCSS 460 Token Playground",
      description:
        "Used during development to mint test bearer tokens from the Auth² issuer.",
      href: "https://tcss-460-iam.onrender.com",
    },
  ],
  deploymentNote: "Hosted on Vercel.",
  deploymentHref: "https://group-project-frontend-public-group-3.vercel.app/",
  deploymentLabel: "group-project-frontend-public-group-3.vercel.app",
  footerLine: "TCSS 460 · University of Washington Tacoma · SP26",
} as const;
