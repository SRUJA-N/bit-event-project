# BIT Event Portal

A production-ready College Event Management System for Bangalore Institute of Technology (BIT), focused on the CSE-ICB department.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bit-events run dev` — run the frontend (port 23589)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Seed Credentials (password: `password` for all)

- **Admin:** admin@bit.edu / password
- **Faculty:** faculty@bit.edu / password
- **Student:** student@bit.edu / password

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Wouter routing, React Query
- API: Express 5, JWT authentication (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- File uploads: multer (local disk, served at `/api/uploads/files/:filename`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (users, events, registrations, feedback)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, events, registrations, feedback, uploads, reports)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware + role guards
- `artifacts/bit-events/src/` — React frontend
- `artifacts/bit-events/src/lib/auth.tsx` — AuthContext with JWT token management
- Uploads stored in `artifacts/api-server/uploads/`

## Architecture decisions

- JWT stored in localStorage, attached to all API calls via `setAuthTokenGetter` in `@workspace/api-client-react`
- File upload endpoints (payment screenshots, event banners) handled via multer outside of OpenAPI codegen to avoid `File`/`Blob` type conflicts in Node.js
- PDF reports served as plain-text downloads from `/api/reports/event/:id/pdf` — no heavy PDF library needed
- Role-based route protection enforced on both frontend (React guards) and backend (requireRole middleware)
- Events default to `pending` status until approved by faculty/admin

## Product

- **Students:** Browse approved events, register (with payment screenshot for paid events), track signup status with faculty comments, submit feedback
- **Faculty:** Create & manage events, review student registrations (approve/reject with remarks), view event reports
- **Admin:** Full access — approve/reject events platform-wide, view all stats, download reports
- **CSE-ICB quick filter** pinned on the event explorer for the primary department

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Deep imports from `@workspace/api-client-react/src/...` are not exported — use the main package entry only
- Upload files are stored locally; they will be lost on server restart in production unless mounted to persistent storage
- The `reports/event/:id/pdf` endpoint returns a text file, not a true PDF

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
