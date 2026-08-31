# Wallet Tracker — Project Details & Engineering Notes

A deep, end-to-end walkthrough of the Wallet Tracker project: what it does, how it
is wired together, the full tech stack, the design decisions, and the real problems
we hit while building it (including everything from this session).

---

## 1. What This Project Is

Wallet Tracker (originally code-named FinTrack) is a **full-stack personal finance
tracker**. It lets a signed-in user record and manage their money in one place:

- Log income and expense **transactions**
- Set per-category **budgets** and watch live progress
- Track long-term savings **goals**
- Automate **recurring** payments / subscriptions
- See **dashboard**, **analytics**, and AI-style **insights** from their real data
- Receive **password-reset OTPs** by email

The whole experience is a premium, responsive web app with light/dark mode,
interactive charts, toast notifications, and a polished landing page.

---

## 2. Architecture Overview

The project is a **monorepo** with two independent apps plus a root orchestrator:

```
wallet-tracker/
├── backend/          # Node + Express REST API (port 6991)
├── frontend/         # React + Vite SPA (port 5173, dev)
├── package.json      # root scripts that coordinate both
└── README.md
```

- The **frontend** never talks to MongoDB directly. It talks only to the backend
  REST API over `/api/*`.
- The **backend** owns all data, auth, business logic, background jobs, caching,
  and email.
- During development, Vite proxies `/api` requests to the backend so there is no
  CORS friction.

### Request flow (example: viewing your dashboard)

```
Browser (React)  →  POST /api/auth/login  →  JWT stored in localStorage
Browser (React)  →  GET /api/dashboard (Bearer token)  →  Express route
                                                      →  auth middleware
                                                      →  controller
                                                      →  MongoDB (Mongoose)
                                                      →  Redis cache (optional)
                                                      →  JSON response → UI charts
```

---

## 3. Tech Stack

### Frontend

| Layer | Technology | Purpose |
| ----- | ---------- | ------- |
| Framework | **React 19** | UI library |
| Build tool | **Vite 8** | Dev server + production bundling |
| Routing | **React Router v7** | Client-side navigation & protected routes |
| Styling | **Tailwind CSS v4** | Utility-first CSS (via `@tailwindcss/vite`) |
| Class helpers | **clsx** + **tailwind-merge** | Conditional, deduped class names (`cn()`) |
| Charts | **Recharts 3** | Area, pie, and bar charts |
| Icons | **lucide-react** | Lightweight SVG icons |
| HTTP | **axios** | API calls with auth interceptor |
| Linting | **oxlint** | Fast Rust-based linter |

### Backend

| Layer | Technology | Purpose |
| ----- | ---------- | ------- |
| Runtime | **Node.js** (CommonJS) | JS runtime |
| Framework | **Express 5** | HTTP server & routing |
| Database | **MongoDB** + **Mongoose 9** | Document storage + ODM |
| Auth | **jsonwebtoken** + **bcryptjs** | JWT sessions, password hashing |
| Validation | **express-validator** | Request body/param validation |
| Scheduler | **node-cron** | Recurring payments + budget alerts |
| Cache | **Redis 6** client | Dashboard/insights response caching |
| Email | **Resend** SDK | Password-reset OTP delivery |
| Env config | **dotenv** | `.env` variable loading |
| CORS | **cors** | Cross-origin handling |
| Dev | **nodemon** | Auto-restart on file change |
| Tests | **node:test** | Built-in test runner + supertest-style requests |

---

## 4. Backend Details

### Models (`backend/models/`)
- **User** — name, email, password hash, currency, and password-reset fields
  (`resetPasswordToken`, `resetPasswordExpires`).
- **Transaction** — type (income/expense), amount, category, payment method, date.
- **Category** — user-scoped spending categories seeded on registration.
- **Budget** — a monthly limit per category, with spent + status derived on read.
- **Goal** — a savings target with a current amount.
- **Recurring** — repeating payments with a `nextDueDate` that auto-advances.

### Auth flow
- `POST /api/auth/register` — creates user + seeds default categories.
- `POST /api/auth/login` — verifies bcrypt hash → returns a 7-day JWT.
- `GET/PUT /api/auth/profile` — read/update the signed-in user.
- `POST /api/auth/forgot-password` — generates a 6-digit OTP, emails it, stores only
  a SHA-256 hash + 10-minute expiry.
- `POST /api/auth/reset-password` — verifies the OTP with `crypto.timingSafeEqual`
  against the stored hash, then sets a new password.

### Auth & security (important problem we solved)
- Passwords are hashed with **bcrypt (10 rounds)** — never stored plaintext.
- JWT is required on every protected route via an auth middleware that checks
  `Authorization: Bearer <token>` and scopes every query by `req.user.id`.
- Every model carries `user: ObjectId`, so **no user can ever read another user's data**.
- The reset **code is never stored in plaintext** — only its hash — and verification
  uses a timing-safe comparison to avoid timing attacks.
- `forgot-password` always returns HTTP 200 whether or not the email exists, to
  prevent account enumeration.

### Background jobs (`node-cron`)
- **Recurring transactions** — runs every 10 minutes; creates a transaction for each
  due payment and advances its `nextDueDate`.
- **Budget alerts** — runs every 6 hours; creates notifications when a budget crosses
  its threshold.

### Caching (Redis with graceful fallback)
- Dashboard and insights are cached per-user for 2–10 minutes.
- Transaction/budget writes invalidate the dashboard cache.
- If Redis is unavailable, the app logs once and continues **without caching**
  (no crash).

---

## 5. Frontend Details

### Routing (`App.jsx`)
Public pages (`/, /login, /register, /forgot-password, /reset-password`) and
protected pages (dashboard, transactions, budgets, goals, etc.) wrapped in a
`ProtectedRoute` that redirects to `/login` when not authenticated.

### Contexts
- **AuthContext** — holds JWT + user, persists to localStorage, wires the axios
  interceptor.
- **ThemeContext** — light/dark toggle, persisted to localStorage.
- **ToastContext** — success/error notifications.

### Landing page
A polished marketing page with:
- A **narrative animated statement card** — rows post in sequence, the closing balance
  eases between figures.
- The hero tagline cycles the currency word **dollar ↔ rupee**, fading out/in.
- Full light/dark support and `prefers-reduced-motion` awareness.

---

## 6. Problems We Faced & How We Solved Them

### 6.1 OTP was sent from the developer's personal Gmail
**Problem:** The mailer used a personal Gmail address (and its Google App Password) hardcoded
in `.env` as the SMTP sender. Not only did it leak personal credentials, but the user
wanted OTPs to come from a proper sender, not their personal inbox.

**Solution:** Replaced the SMTP/Gmail setup with the **Resend email API**:
- Installed `resend`, removed `nodemailer`.
- Rewrote `backend/services/mailer.js` to send via `Resend().emails.send()`.
- Replaced `SMTP_*` env vars with a single `RESEND_API_KEY`.
- Preserved a dev-mode fallback: if no key is set, the reset code is returned in the
  API response as `devCode` instead of emailed (great for local testing).

### 6.2 Resend sandbox restriction (only sends to your own address)
**Problem:** With a fresh Resend account and no verified domain, Resend refuses to deliver
to arbitrary recipients — the sandbox sender `onboarding@resend.dev` only works for the
email verified in your Resend account.

**Solution:** For local testing we pointed `MAIL_FROM` at the sandbox sender and confirmed
delivery to the account's own verified email. To send OTPs to real users you must **verify a custom
domain** at resend.com/domains, then set `MAIL_FROM` to an address on that domain.

### 6.3 Branding inconsistency ("FinTrack" vs "Wallet Tracker")
**Problem:** The OTP email subject read *"Your FinTrack password reset code"* and the
project contained scattered `fintrack`/`FinTrack` identifiers, while the product was
branded **Wallet Tracker** everywhere else.

**Solution:** Standardized everything on **Wallet Tracker**:
- Email subject, body, and sign-off in `mailer.js` → "Wallet Tracker".
- localStorage keys `fintrack_user/token/theme` → `wallet_tracker_user/token/theme`.
- CSV export filename, README title/paths/db-name, `.env.example` domain,
  test email domain `@fintrack.test` → `@wallettracker.test`.
- Rebuilt the frontend to clear a stale `dist` bundle that still contained the old name.

### 6.4 Animated dollar → rupee on the landing page
**Problem:** The hero said *"Every dollar,"* but the rest of the app (and the statement
card) used the Indian Rupee (₹).

**Solution:** Added a small `FadingCurrencyWord` component that cycles the word
**dollar ↔ rupee**, fading it out, swapping the text, and fading it back in. It fully
respects `prefers-reduced-motion` (shows a static word when the user prefers reduced motion).

### 6.5 Renaming localStorage keys logs everyone out (by design)
**Problem:** After renaming the auth keys from `fintrack_*` to `wallet_tracker_*`, any
existing sessions in the browser became invalid.

**Solution:** This is expected and unavoidable when changing storage keys — users simply
sign in again. Worth noting whenever a key rename ships.

### 6.6 Vercel serverless: the "dual Mongoose instance" bug
**Problem:** Converting the Express server to a Vercel serverless function, requests
failed with `Operation users.findOne() buffering timed out`. Root cause: `api/index.js`
was `require("mongoose")` from the **root** `node_modules`, while the backend models
`require("mongoose")` from **`backend/node_modules`** — two separate Mongoose instances,
so the connection the handler opened was invisible to the models.

**Solution:** `api/index.js` now delegates connection to the backend's own
`backend/config/db.js`, guaranteeing the same Mongoose instance the models use. The
connection is cached/persisted across warm serverless invocations.

### 6.7 Vercel serverless: no background cron jobs
**Problem:** Vercel doesn't run persistent processes, so `node-cron` jobs (recurring
payments, budget alerts) can't auto-run there.

**Solution:** `startScheduler()` lives only in `backend/server.js`, which the serverless
path never calls, so it safely no-ops on Vercel. To get background behavior, run the
backend on a persistent host (e.g. Railway) or trigger the job functions externally.

---

## 7. How to Run It

### Prerequisites
- Node.js 18+
- MongoDB running (`mongod`), or `MONGO_URI` pointing at Atlas
- Redis (optional — caching degrades gracefully)

### Backend
```bash
cd backend
cp .env.example .env      # then set the values (see below)
npm install
npm run dev               # http://localhost:6991
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api → :6991)
```

### Production build
```bash
cd frontend && npm run build
```

### Tests
```bash
cd backend && npm test    # node:test integration suite (MongoDB required)
```

### Useful `.env` (backend)
```
PORT=6991
MONGO_URI=mongodb://127.0.0.1:27017/wallet_tracker
JWT_SECRET=replace-with-a-long-random-secret

RESEND_API_KEY=           # leave empty = dev mode (OTP returned as devCode)
MAIL_FROM="Wallet Tracker <no-reply@your-domain>"

REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
SCHEDULER_DISABLED=false
```

---

## 8. Deployment (Vercel — serverless)

The project is wired to deploy on **Vercel** as one serverless app that serves both the
React SPA and the Express API.

### How it works
- `vercel.json` — rewrites all traffic to the serverless function, and the build command
  installs + builds the frontend into `frontend/dist`.
- `api/index.js` — the serverless entry:
  - Connects to MongoDB once and **caches the connection** across warm invocations
    (`global.mongo`), delegating to the backend's own `connectDB` so the models and the
    handler share the same Mongoose instance.
  - Routes every `/api/*` request to the Express app.
  - Serves the built SPA (static assets + `index.html` fallback) for everything else.
- Root `package.json` carries the backend runtime deps so Vercel installs them for the
  function.

### Deploy steps
1. Create a **MongoDB Atlas** cluster (Vercel cannot reach your local `mongod`).
2. In Vercel, import the repo and set environment variables:
   - `MONGO_URI` — Atlas connection string
   - `JWT_SECRET` — long random secret
   - `RESEND_API_KEY` — optional (OTP falls back to dev mode if unset)
3. Deploy.

### Serverless limitations to know
- **No background jobs** — `node-cron` (recurring payments, budget alerts) lives in
  `backend/server.js`, which is not used on Vercel, so it doesn't auto-run there.
- **Redis** — optional; disable with `REDIS_ENABLED=false` or use serverless Redis
  (e.g. Upstash).
- **Email** — verify a Resend domain before emails reach real users.

---

## 9. Roadmap / Ideas

- CSV import (export already exists)
- Email digest of weekly spending
- Multi-currency conversion (the landing page already hints at ₹/USD)
- PWA + offline support
- Verify a real sending domain so OTPs reach any user
- Add CI (GitHub Actions) to run lint + tests on every push

---

## 10. Security Notes

- Never commit real secrets. `.env` is gitignored — but double-check before pushing.
- The Google App Password that was once in `.env` should be considered exposed; you may
  want to revoke it.
- Keep `JWT_SECRET` and `RESEND_API_KEY` out of version control and rotate them if leaked.
