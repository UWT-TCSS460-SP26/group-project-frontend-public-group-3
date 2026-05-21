# Backend Integration Notes (group-2-3)

## Deployed API Base URL
- Production base URL: https://group-2-9289.onrender.com
- Health check: GET /health
- API docs UI: /api-docs
- OpenAPI JSON: /openapi.json
- Also supports compatibility alias: /api/v1/* (primary versioned routes are /v1/*)

## Authentication Requirements
- Auth uses OIDC bearer JWT (RS256) validated via JWKS.
- Required token checks include issuer and audience:
  - Issuer: https://tcss-460-iam.onrender.com
  - Audience: group-2-api
- Header format: Authorization: Bearer <token>
- For authenticated routes, user identity comes from token claims, then normalized to local user records.
- Admin access for issue queue routes is enforced by local DB role checks (not token role claim alone).

## Public Vs Protected Routes
- Public routes:
  - GET /health
  - GET /v1/discover/top-rated
  - GET /v1/movies/search
  - GET /v1/movies/popular
  - GET /v1/movies/{id}
  - GET /v1/tv-shows/search
  - GET /v1/tv-shows/popular
  - GET /v1/tv-shows/{id}
  - GET /v1/reviews
  - GET /v1/reviews/{id}
  - GET /v1/ratings
  - GET /v1/ratings/{id}
  - POST /v1/issues
- Auth required routes:
  - GET /v1/me/ratings
  - GET /v1/me/reviews
  - POST /v1/ratings
  - PUT /v1/ratings/{id}
  - DELETE /v1/ratings/{id}
  - POST /v1/reviews
  - PUT /v1/reviews/{id}
  - DELETE /v1/reviews/{id}
- Auth + local admin role required routes:
  - GET /v1/issues
  - GET /v1/issues/{id}
  - PATCH /v1/issues/{id}
  - DELETE /v1/issues/{id}

## Important Endpoints
- Discovery feed:
  - GET /v1/discover/top-rated?page=&pageSize=
- Media browsing:
  - GET /v1/movies/search?title=&page=
  - GET /v1/movies/popular?page=
  - GET /v1/movies/{id}
  - GET /v1/tv-shows/search?title=&page=
  - GET /v1/tv-shows/popular?page=
  - GET /v1/tv-shows/{id}
- Ratings:
  - GET /v1/ratings with optional filters
  - POST /v1/ratings
  - PUT /v1/ratings/{id}
  - DELETE /v1/ratings/{id}
  - GET /v1/me/ratings
- Reviews:
  - GET /v1/reviews with optional filters
  - POST /v1/reviews
  - PUT /v1/reviews/{id}
  - DELETE /v1/reviews/{id}
  - GET /v1/me/reviews
- Issues:
  - POST /v1/issues (public bug intake)
  - GET/PATCH/DELETE admin issue queue routes under /v1/issues

## Request/Response Patterns
- Validation failures return 400 with JSON shape: { "error": "...message..." }.
- Most list endpoints return paginated shape:
  - page, pageSize, totalPages, totalResults, results
- Create/update patterns:
  - POST rating/review returns created entity (201)
  - PUT rating/review returns updated entity (200)
  - DELETE rating/review returns 204 empty body
  - POST issue returns minimal payload: id, status, createdAt
- Identity-sensitive endpoints ignore caller-provided identity overrides and derive user from JWT.

## Enums And Status Values
- MediaType: movie, show
- IssueStatus: open, in_progress, resolved, closed
- Local user role enum (DB): user, admin
- Rating score constraints: integer 1..10

## Pagination And Query Parameter Behavior
- Shared pagination defaults:
  - page default = 1
  - pageSize default = 10
  - pageSize max = 50
- Common filters:
  - tmdbId must be positive integer when provided
  - mediaType must be movie or show
  - userId filter must be positive integer when provided
- Sort behavior:
  - /v1/me/reviews supports sort=createdAt:desc|createdAt:asc (default desc)
  - /v1/issues supports sort=createdAt:desc|createdAt:asc (default desc)
  - /v1/issues supports optional status filter (open|in_progress|resolved|closed)

## Notable Edge Cases
- Duplicate rating/review for same user + content returns 409 conflict.
- Invalid/missing bearer token returns 401 with stable messages:
  - Missing or malformed Authorization header
  - Invalid or expired token
- Ownership rules:
  - Ratings update/delete: owner only
  - Reviews update: owner only
  - Reviews delete: owner or admin
- Path id behavior differs by endpoint family:
  - Ratings/reviews invalid id format maps to 404 in controller flow
  - Issues invalid id format returns 400
- Discovery and me endpoints enrich data using TMDB; metadata failures may skip/omit TMDB details instead of hard-failing whole list in some flows.

## Inspected Backend Structure Notes
- Routes: src/routes/v1/*
- Controllers: src/controllers/v1/*
- Middleware: src/middleware/requireAuth.ts, src/middleware/requireLocalRole.ts
- Validation/parsing helpers are in utils (no dedicated validation folder):
  - src/utils/validation.ts
  - src/utils/request-parsing.ts
- Shared API/auth types:
  - src/types/api.ts
  - src/types/auth.ts
