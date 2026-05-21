# BIT Event Portal
**Bangalore Institute of Technology — CSE-ICB Department**

A full-stack College Event Management System for managing events, registrations, payments, and analytics.

---

## Quick Start (Windows — VS Code)

**Only two things to install. No PostgreSQL. No complex setup.**

### Prerequisites

| Tool | Download | Notes |
|---|---|---|
| Python 3.10+ | https://www.python.org/downloads/ | Tick "Add Python to PATH" during install |
| Node.js 18+ (LTS) | https://nodejs.org | Default installation is fine |

### Step 1 — Clone the project

Open VS Code, press **Ctrl + `** to open the terminal, then:

```
git clone https://github.com/SRUJA-N/bit-event-project.git
cd bit-event-project
```

### Step 2 — Run setup (one time only)

```powershell
.\setup.ps1
```

The script will automatically:
- Check Python and Node.js are installed
- Install all Python packages (FastAPI, SQLAlchemy, etc.)
- Install all Node packages
- Create the SQLite database file (no server needed)
- Load all demo data (users, events, registrations, feedback)
- Ask if you want to launch the app

### Step 3 — Start the app (every day after that)

```powershell
.\start.ps1
```

Opens the API server and frontend in two separate windows, then launches your browser automatically.

---

## Demo Login Credentials

All accounts use the password: **`password123`**

| Role | Email | What you can do |
|---|---|---|
| Admin | `admin@bit.edu` | Dashboard, Analytics, Reports, Approve Events |
| Faculty | `faculty@bit.edu` | Create Events, Review Registrations |
| Student | `arjun@student.bit.edu` | Browse, Register, Give Feedback |

---

## How It Works

The database is a single **SQLite file** (`artifacts/api-server/bit_events.db`) — no database server needed. It gets created automatically when you run `setup.ps1`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Recharts |
| Backend | Python + FastAPI |
| Database | SQLite (via SQLAlchemy) — no server required |
| Auth | JWT (python-jose) |
| PDF Reports | ReportLab |

---

## Features

### Admin
- Dashboard with platform-wide statistics
- Analytics — revenue charts, registration breakdowns, department stats, feedback radar
- Approve or reject faculty-submitted events
- Download branded PDF reports per event

### Faculty
- Create and manage events (image upload, payment QR, rules)
- Review student registrations with payment screenshots
- Approve or reject with typed remarks

### Student
- Browse and filter approved events
- Register for free or paid events
- View registration status and faculty comments
- Submit event feedback with star rating

---

## Project Structure

```
bit-event-project/
├── setup.ps1                    # One-command Windows setup (run once)
├── start.ps1                    # Daily launcher
├── artifacts/
│   ├── api-server/              # Python FastAPI backend (port 8080)
│   │   ├── main.py              # App entry point
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── auth_utils.py        # JWT + bcrypt helpers
│   │   ├── seed.py              # Demo data seeder
│   │   ├── requirements.txt     # Python packages
│   │   ├── bit_events.db        # SQLite database (auto-created)
│   │   └── routes/              # auth, events, registrations, feedback, reports, analytics
│   └── bit-events/              # React + Vite frontend (port 3000)
│       └── src/
│           ├── pages/           # admin/, faculty/, student/, auth/
│           └── components/      # layout, reusable UI
└── lib/
    └── db/                      # (legacy - no longer used by the backend)
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `cannot be loaded because running scripts is disabled` | Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `Python not found` | Reinstall Python and tick "Add to PATH", restart VS Code |
| `Module not found` errors | Run `pip install -r artifacts\api-server\requirements.txt` |
| Frontend shows blank page | Make sure both terminal windows (from `start.ps1`) are still running |
| Login fails | Check the API server window is running without red errors |
| Port already in use | Close any other terminals running the servers and run `.\start.ps1` again |

---

## License

Internal academic project — Bangalore Institute of Technology, CSE-ICB Department.
