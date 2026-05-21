# BIT Event Portal

A production-ready **College Event Management System** for Bangalore Institute of Technology (BIT), CSE-ICB Department.

---

## Features

| Role | Capabilities |
|------|-------------|
| **Student** | Browse & filter events, register with payment screenshot, track status with faculty remarks, submit star-rated feedback |
| **Faculty** | Create & manage events (with banner + payment QR upload), review registrations with approve/reject + comment |
| **Admin** | Approve/reject events platform-wide, view stats dashboard, download event reports |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/bit-event-portal.git
cd bit-event-portal
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/bit_events
SESSION_SECRET=any-random-secret-string
```

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Seed the database

```bash
pnpm --filter @workspace/db run seed
```

This creates three accounts (password for all: **`password`**):

| Role | Email |
|------|-------|
| Admin | admin@bit.edu |
| Faculty | faculty@bit.edu |
| Student | student@bit.edu |

### 6. Run the app

Open two terminals:

**Terminal 1 — API server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/bit-events run dev
```

Then open **http://localhost:5173** in your browser.

---

## Project Structure

```
bit-event-portal/
├── artifacts/
│   ├── api-server/          # Express 5 backend (port 8080)
│   │   └── src/routes/      # auth, events, registrations, feedback, reports
│   └── bit-events/          # React + Vite frontend (port 5173)
│       └── src/pages/       # student/, faculty/, admin/ portals
├── lib/
│   ├── db/                  # Drizzle ORM schema + migrations
│   ├── api-spec/            # OpenAPI contract (source of truth)
│   ├── api-client-react/    # Auto-generated React Query hooks
│   └── api-zod/             # Auto-generated Zod validation schemas
└── scripts/                 # Utility scripts
```

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Query, Wouter
- **Backend:** Express 5, Node.js 24, TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **File uploads:** multer (banners, payment screenshots, QR codes)
- **Validation:** Zod v4, drizzle-zod
- **API codegen:** Orval (from OpenAPI spec → React Query hooks + Zod schemas)

---

## Development Commands

```bash
# Full typecheck
pnpm run typecheck

# Regenerate API hooks after changing openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push
```

---

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/events` | List events (filter by dept/status) |
| POST | `/api/events` | Create event (faculty) |
| PATCH | `/api/events/:id/status` | Approve/reject event (admin) |
| POST | `/api/registrations` | Register for event (student) |
| PATCH | `/api/registrations/:id/review` | Approve/reject registration (faculty) |
| POST | `/api/feedback` | Submit feedback (student) |
| GET | `/api/reports/event/:id` | Event report JSON (admin/faculty) |
| GET | `/api/reports/event/:id/pdf` | Download report as text file |

---

## Notes

- File uploads are stored locally in `artifacts/api-server/uploads/` — mount to persistent storage in production
- PDF reports are plain-text `.txt` files (no heavy PDF library dependency)
- The `reports/event/:id/pdf` endpoint returns a `text/plain` download, not a true PDF
