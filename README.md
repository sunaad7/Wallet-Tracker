# Wallet Tracker — Personal Finance Tracker

A modern full-stack personal finance tracker with a premium responsive UI, dark mode, interactive charts, and AI-powered spending insights.

![Stack](https://img.shields.io/badge/React-18+-61DAFB) ![Stack](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4) ![Stack](https://img.shields.io/badge/Node.js-Express-339933) ![Stack](https://img.shields.io/badge/MongoDB-Mongoose-47A248) ![Stack](https://img.shields.io/badge/Redis-cache-DC382D)

## Features

**Core finance management**
- Full CRUD for **transactions**, **budgets**, **financial goals**, **categories**, and **recurring payments**
- User-specific data with JWT authentication and bcrypt password hashing
- Server-side validation and centralized error handling

**Dashboard**
- Balance, monthly income / expenses, and savings rate
- Recent transactions, category breakdown (pie), income-vs-expenses (area), budget progress, and goal progress

**Transactions**
- Search, filter (type, category, payment method, date range), sort, and pagination
- Inline page totals for income and expenses

**Analytics & AI insights**
- Monthly spending comparisons and category bar charts
- AI-style insights computed from your real transaction data (top category, overspending alerts, subscription review, savings recommendations, goal pacing)

**Advanced**
- Redis caching with graceful fallback when Redis is unavailable
- `node-cron` scheduler that auto-processes due recurring transactions and fires budget alerts
- Notification center with unread badge and mark-all-read

**UX**
- Premium dark/light mode, animations, loading & empty states, toast notifications, fully responsive (mobile sidebar)
- Recharts interactive charts, code-split bundles

**Landing page**
- Animated narrative statement card (rows post in sequence, running balance eases between figures)
- Hero tagline cycles the currency word — **dollar ↔ rupee** — fading out and back in with a subtle motion
- Respects `prefers-reduced-motion` (animation is disabled and content shown statically)

## Tech Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React, Vite, Tailwind CSS v4, Recharts, React Router, Axios, lucide-react |
| Backend  | Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, express-validator, node-cron, Redis |

## Project Structure

```
wallet-tracker/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # Route handlers
│   ├── middleware/             # auth, validation, error handling
│   ├── models/                 # Mongoose models
│   ├── routes/                 # REST API routes
│   ├── services/               # analytics, insights, cache, scheduler
│   ├── test/                   # node:test integration suite
│   ├── app.js                  # Express app (testable)
│   └── server.js               # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout, charts, UI primitives, modals
│   │   ├── context/            # Auth, Theme, Toast
│   │   ├── lib/api.js          # Axios instance + interceptors
│   │   ├── pages/              # Dashboard, Transactions, Budgets, ...
│   │   └── utils/format.js     # Currency/date helpers
│   └── vite.config.js          # Dev proxy to backend
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) — or set `MONGO_URI` to Atlas
- Redis (optional — caching disables gracefully if not running)

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit values
npm install
npm run dev                 # http://localhost:6991
```

`.env`:

```
PORT=6991
MONGO_URI=mongodb://127.0.0.1:27017/wallet_tracker
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development

REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true          # set false to skip Redis entirely

SCHEDULER_DISABLED=false
```

**Password reset emails** are sent via [Resend](https://resend.com). Set `RESEND_API_KEY` (and optionally `MAIL_FROM` with a verified domain) in `backend/.env` to enable emailed one-time reset codes. Leave `RESEND_API_KEY` unset for dev mode — the code is returned in the API response as `devCode` instead of emailed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api → :6991)
```

### 3. Build for production

```bash
cd frontend && npm run build
```

## Deployment (Vercel — serverless)

This app is configured to deploy to **Vercel** as a single serverless app that serves
both the React SPA and the Express API through `api/index.js`:

- `vercel.json` — rewrites all traffic to the serverless function and builds the frontend.
- `api/index.js` — connects to MongoDB (connection is cached across invocations), routes
  `/api/*` to the Express app, and serves the built SPA for everything else.

**Deploy steps:**
1. Create a **MongoDB Atlas** cluster (Vercel can't reach your local `mongod`).
2. In Vercel, import the repo and add these **Environment Variables**:
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random secret
   - `RESEND_API_KEY` — optional (leaves OTP in dev mode if unset)
3. Deploy.

**Important serverless limitations:**
- **Background jobs (`node-cron`)** — recurring payments and budget alerts are started
  only by `backend/server.js`, which is **not** used on Vercel, so they do not auto-run
  there. Keep a dedicated host (e.g. Railway) running `server.js`, or trigger the
  `processDueRecurring` / `checkBudgetAlerts` functions manually/externally.
- **Redis caching** — disable with `REDIS_ENABLED=false`, or point `REDIS_URL` at a
  serverless Redis (e.g. Upstash). Without it the app still works (caching is optional).
- **Email** — OTP resets need a verified Resend domain before they reach real users.

## API Overview

| Method | Endpoint                     | Description |
| ------ | ---------------------------- | ----------- |
| POST   | `/api/auth/register`         | Register (seeds default categories) |
| POST   | `/api/auth/login`            | Login → JWT |
| GET/PUT| `/api/auth/profile`          | Get / update profile |
| GET/POST/PUT/DELETE | `/api/transactions` | Transaction CRUD |
| GET    | `/api/transactions/filter`   | Search/filter/sort/paginate |
| GET/POST/PUT/DELETE | `/api/categories`     | Category CRUD |
| GET/POST/PUT/DELETE | `/api/budgets`        | Budget CRUD (includes spent + status) |
| GET/POST/PUT/DELETE | `/api/goals`          | Goal CRUD, add funds |
| GET/POST/PUT/DELETE | `/api/recurring`      | Recurring payments |
| GET/PUT  | `/api/notifications`    | List / mark read |
| GET    | `/api/dashboard`            | Dashboard aggregate |
| GET    | `/api/analytics`            | Monthly + category analytics |
| GET    | `/api/insights`             | AI spending insights |

All endpoints except auth require `Authorization: Bearer <token>`.

## Background Jobs

- **Recurring transactions** — runs every 10 minutes; creates a transaction for each due payment and advances its `nextDueDate`.
- **Budget alerts** — runs every 6 hours; creates notifications when a budget crosses its `alertThreshold` or is exceeded.

Trigger them manually for testing:

```bash
cd backend
node -e "require('./services/schedulerService').processDueRecurring().then(console.log)"
node -e "require('./services/schedulerService').checkBudgetAlerts().then(console.log)"
```

## Tests

```bash
cd backend
npm test    # 15 integration tests (node:test + real MongoDB, uses wallet_tracker_test db)
```

## Design Notes

- **Redis caching**: dashboard and insights responses are cached for 2–10 minutes. The cache key is per-user, and transaction/budget writes invalidate the dashboard cache. If Redis is unreachable, the app logs a single warning and runs without caching.
- **AI insights**: computed server-side with deterministic rules over your transactions (no external API key required). The endpoint is extendable — swap `services/insightsService.js` with any LLM call you like.
- **Data ownership**: every model carries `user: ObjectId`, and every query is scoped by `req.user.id`.

## Roadmap / Ideas

- CSV import/export
- Email digest of weekly spending
- Multi-currency conversion
- Password reset emails
- PWA + offline support
