# Group 3 — Movies & TV

Frontend for the TCSS 460 Movie and TV Review Platform. Browse popular titles, search movies and TV shows, view details with community ratings, and sign in with the course OIDC provider to access your profile.

**Live site:** [https://group-project-frontend-public-group-3.vercel.app/](https://group-project-frontend-public-group-3.vercel.app/)

## Features

- **Home** — Popular Movies and Popular TV Shows tabs with paginated results (`/?type=movie|show&page=1`)
- **Search** — Global search bar in the header; filter by movie or TV show (`/search?type=movie|show&title=...`)
- **Details** — Title overview, poster, cast, genres, and community ratings/reviews (`/details?type=movie|show&id=...`)
- **Profile** — Signed-in view of account info and token role (`/profile`)
- **Auth** — Sign in / sign out via Auth.js (NextAuth v5) and the TCSS 460 OIDC issuer

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Auth.js / NextAuth v5](https://authjs.dev/) (OIDC)
- Partner API: [Group 2 backend](https://group-2-9289.onrender.com/api-docs) on Render

## Getting started

### Prerequisites

- Node.js 20+
- npm (or pnpm)
- OIDC client credentials from the TCSS 460 auth-squared admin portal (for sign-in locally)

### Install and run

```bash
git clone https://github.com/<your-org>/group-project-frontend-public-group-3.git
cd group-project-frontend-public-group-3
npm install
cp env.local.example .env.local
# Fill in .env.local (see Environment variables below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production build     |
| `npm run lint` | Run ESLint               |

## Environment variables

Copy `env.local.example` to `.env.local` and set:

| Variable | Description |
| -------- | ----------- |
| `AUTH_SECRET` | Session cookie signing secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Public origin of this app (e.g. `http://localhost:3000`). Callback: `{AUTH_URL}/api/auth/callback/tcss460` |
| `AUTH_TCSS460_ISSUER` | OIDC issuer (`https://tcss-460-iam.onrender.com`) |
| `AUTH_TCSS460_CLIENT_ID` | OIDC client ID from auth-squared |
| `AUTH_TCSS460_CLIENT_SECRET` | OIDC client secret |
| `AUTH_TCSS460_AUDIENCE` | Token audience for backend authorization |
| `API_BASE_URL` | *(Optional)* Group 2 API base URL. Defaults to `https://group-2-9289.onrender.com` |

**OAuth tip:** Use the same host in the browser as in `AUTH_URL` (e.g. always `localhost`, not mixing `localhost` and a LAN IP). Mismatched origins often cause `InvalidCheck: state value could not be parsed` during sign-in.

## Backend API

This app consumes the Group 2 REST API (TMDB-backed movie/TV data plus community ratings):

- **Base URL:** [https://group-2-9289.onrender.com](https://group-2-9289.onrender.com)
- **Docs:** [OpenAPI / Swagger UI](https://group-2-9289.onrender.com/api-docs)
- **Bug Tracker URL:** [https://bug-tracker-g2.vercel.app](https://bug-tracker-g2.vercel.app)
- **API Audience:** group-2-api
- **README link:** [https://github.com/UWT-TCSS460-SP26/group-project-backend-group-2-3/blob/main/README.md](https://github.com/UWT-TCSS460-SP26/group-project-backend-group-2-3/blob/main/README.md)

Public routes used by the frontend include search, popular lists, and title details. Authenticated routes (ratings, reviews, profile) require a valid bearer token from sign-in.

## Project structure

```
src/
  app/              # Routes (home, search, details, profile, auth API)
  components/       # Header, SearchBar, MediaResultCard, tabs, spinner
  lib/              # Auth, UI tokens, JWT helpers
lib/
  api.ts            # Server-side fetch helpers for Group 2 API
  types.ts          # Shared API response types
```

## Deployment

The production site is hosted on [Vercel](https://vercel.com/). Set the same environment variables in the Vercel project settings. Ensure the OAuth redirect URI for production is registered in auth-squared:

`https://group-project-frontend-public-group-3.vercel.app/api/auth/callback/tcss460`

## Course context

TCSS 460 — Group Project (Frontend, Group 3). Built to integrate with Group 2’s backend and the shared TCSS 460 identity provider.
