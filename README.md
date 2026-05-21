# BIT Event Portal
**Bangalore Institute of Technology — CSE-ICB Department**

A full-stack College Event Management System for managing events, registrations, payments, and analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Recharts |
| Backend | Node.js + Express, TypeScript |
| Database | PostgreSQL (via Drizzle ORM) |
| Auth | JWT (jsonwebtoken) |
| PDF Reports | PDFKit |

---

## Prerequisites

Install the following before running the project:

- **Node.js** v18 or higher → https://nodejs.org
- **pnpm** v8 or higher → `npm install -g pnpm`
- **PostgreSQL** v14 or higher → https://www.postgresql.org/download/

> On **Windows 11**: Use the PostgreSQL installer from the link above. During setup note the port (default 5432), username (default `postgres`), and password you set.

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SRUJA-N/bit-event-project.git
cd bit-event-project
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up the Database

Create a new PostgreSQL database:

```sql
-- Run in psql or pgAdmin
CREATE DATABASE bit_events;
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bit_events
JWT_SECRET=your-secret-key-change-in-production
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

> On **Windows 11** use `localhost` or `127.0.0.1` as the host.

### 5. Push the Database Schema

```bash
pnpm --filter @workspace/db run push
```

This creates all required tables: `users`, `events`, `registrations`, `feedback`.

---

## Running the Project

Start **two terminals** — one for the API server, one for the frontend.

### Terminal 1 — API Server (Port 8080)

**Linux / macOS:**
```bash
PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev
```

**Windows 11 — Command Prompt:**
```cmd
set PORT=8080 && set NODE_ENV=development && pnpm --filter @workspace/api-server run dev
```

**Windows 11 — PowerShell:**
```powershell
$env:PORT="8080"; $env:NODE_ENV="development"; pnpm --filter @workspace/api-server run dev
```

### Terminal 2 — Frontend (Port 3000)

**Linux / macOS:**
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/bit-events run dev
```

**Windows 11 — Command Prompt:**
```cmd
set PORT=3000 && set BASE_PATH=/ && pnpm --filter @workspace/bit-events run dev
```

**Windows 11 — PowerShell:**
```powershell
$env:PORT="3000"; $env:BASE_PATH="/"; pnpm --filter @workspace/bit-events run dev
```

### Open in Browser

**http://localhost:3000**

---

## Demo Login Credentials

All demo accounts use the password: **`password123`**

| Role | Email | Access |
|---|---|---|
| Admin | `admin@bit.edu` | Dashboard, Analytics, Reports, Approval |
| Faculty | `faculty@bit.edu` | Create Events, Review Registrations |
| Student | `arjun@student.bit.edu` | Browse, Register, Feedback |

---

## Features

### Admin
- Dashboard with platform-wide stats
- **Analytics** — revenue bar charts, registration breakdown, department stats, feedback radar chart
- Approve or reject faculty-submitted events
- Download branded PDF reports per event

### Faculty
- Create and manage events (image upload, payment QR, rules)
- Review student registrations with payment screenshots
- Approve or reject with typed remarks saved to the student

### Student
- Browse and filter approved events (CSE-ICB quick filter)
- Register for free or paid events (upload payment screenshot)
- View registration status and see faculty comments
- Submit event feedback with star rating

---

## Project Structure

```
bit-event-project/
├── artifacts/
│   ├── api-server/          # Express + TypeScript backend
│   │   └── src/routes/      # auth, events, registrations, reports, analytics
│   └── bit-events/          # React + Vite frontend
│       └── src/
│           ├── pages/       # admin/, faculty/, student/, auth/
│           └── components/  # layout, reusable UI
├── lib/
│   ├── db/                  # Drizzle ORM schema & config
│   ├── api-zod/             # Zod validation schemas
│   └── api-client-react/    # React Query API hooks
└── scripts/
    └── seed.mjs             # Demo data seeder
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `PORT is required` error | Set the `PORT` env variable before running (see above) |
| `DATABASE_URL` error | Make sure PostgreSQL is running and the URL is correct |
| `relation "users" does not exist` | Run `pnpm --filter @workspace/db run push` |
| Frontend shows blank / white page | Make sure both servers are running |
| PDF won't open | Use a modern browser (Chrome, Edge, Firefox) |
| Login / register fails | Confirm the API server is running on port 8080 |
| `Cannot find module` on startup | Run `pnpm install` again |

---

## License

Internal academic project — Bangalore Institute of Technology, CSE-ICB Department.
