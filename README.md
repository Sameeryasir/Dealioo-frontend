# Dealioo

Dealioo is a local-business growth platform: campaigns, funnels, payments, CRM, automations, ads integrations, and redemption scanning.

The product ships as **two repositories**:

| App | Stack | Default local URL |
| --- | --- | --- |
| [`Dealioo-backend`](https://github.com/Sameeryasir/Dealioo-backend) | NestJS 11, TypeORM, PostgreSQL, Redis/BullMQ | `http://localhost:4001/api` |
| [`Dealioo-frontend`](https://github.com/Sameeryasir/Dealioo-frontend) | Next.js 16 (App Router), React 19, Tailwind 4 | `http://localhost:3002` |

This guide covers a full local setup from clone → database → run → smoke test.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the repositories](#2-clone-the-repositories)
3. [Infrastructure (PostgreSQL + Redis)](#3-infrastructure-postgresql--redis)
4. [Backend setup](#4-backend-setup)
5. [Frontend setup](#5-frontend-setup)
6. [Environment variables](#6-environment-variables)
7. [Database migrations & seeds](#7-database-migrations--seeds)
8. [Third-party integrations](#8-third-party-integrations)
9. [Running the apps](#9-running-the-apps)
10. [Verify the setup](#10-verify-the-setup)
11. [Useful scripts](#11-useful-scripts)
12. [Docker (optional)](#12-docker-optional)
13. [Project layout](#13-project-layout)
14. [Troubleshooting](#14-troubleshooting)
15. [Missing / incomplete configuration](#15-missing--incomplete-configuration)

---

## 1. Prerequisites

Install these before cloning:

| Tool | Version / notes |
| --- | --- |
| **Node.js** | **≥ 20.9.0** (Next.js 16 requirement). Docker images use Node 20. |
| **npm** | Ships with Node (lockfiles are `package-lock.json`; use npm, not yarn/pnpm). |
| **Git** | Required to clone. Frontend `prepare` runs Husky. |
| **PostgreSQL** | 14+ recommended. App defaults to port **5433** (not 5432). |
| **Redis** | Required for automations (BullMQ) and several caches. Default `127.0.0.1:6379`. |
| **Docker** (optional) | For containerized frontend/backend builds. |

Check versions:

```bash
node -v    # v20.9.0 or newer
npm -v
psql --version
redis-cli ping   # should reply PONG when Redis is running
```

---

## 2. Clone the repositories

Create a workspace folder and clone **both** apps side by side:

```bash
mkdir dealiooproject && cd dealiooproject

git clone https://github.com/Sameeryasir/Dealioo-backend.git dealio-backend
git clone https://github.com/Sameeryasir/Dealioo-frontend.git dealio-frontend
```

If you already have this monorepo-style folder locally, you only need to pull each repo:

```bash
cd dealio-backend && git pull
cd ../dealio-frontend && git pull
```

---

## 3. Infrastructure (PostgreSQL + Redis)

### 3.1 PostgreSQL

Create a database matching `.env.example` (defaults shown):

| Variable | Local default |
| --- | --- |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5433` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `retention` |

Example (adjust user/port to your install):

```bash
# If Postgres listens on 5433:
createdb -h localhost -p 5433 -U postgres retention

# Or via psql:
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE retention;"
```

**Important:** The codebase defaults to port **5433**. If your local Postgres uses **5432**, set `DB_PORT=5432` in `dealio-backend/.env`.

Keep `DB_SYNCHRONIZE=false` and use migrations (see [§7](#7-database-migrations--seeds)).

### 3.2 Redis

Start Redis and confirm it responds:

```bash
# macOS (Homebrew) example
brew services start redis

redis-cli ping
# PONG
```

Backend defaults: `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`.

Without Redis, automation queues and Redis-backed caches will fail or degrade.

---

## 4. Backend setup

```bash
cd dealio-backend

cp .env.example .env
# Edit .env — at minimum set DB_*, JWT_SECRET, TOKEN_ENCRYPTION_KEY,
# STRIPE_SECRET_KEY, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME

npm install
```

### Required env for boot

These are enforced by Nest modules at startup:

| Variable | Why |
| --- | --- |
| `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | TypeORM `getOrThrow` |
| `JWT_SECRET` | Auth / JWT module |
| `STRIPE_SECRET_KEY` | `StripeService` constructor |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | `BrevoService.onModuleInit` |

Also set a strong `TOKEN_ENCRYPTION_KEY` (≥ 32 characters recommended) before connecting Meta/Google OAuth tokens.

Use **Brevo REST API keys** (`xkeysib-…`). SMTP keys (`xsmtpsib-…`) are rejected at boot.

Then run migrations and seeds ([§7](#7-database-migrations--seeds)) before `npm run start:dev`.

---

## 5. Frontend setup

```bash
cd dealio-frontend

cp .env.example .env
# For local work, keep:
#   NEXT_PUBLIC_API_URL=http://localhost:4001/api
#   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3002
#   BACKEND_URL=http://localhost:4001/api

npm install
```

`NEXT_PUBLIC_*` values are baked into the client bundle. After changing them, restart `npm run dev` (and rebuild for production).

Husky installs on `npm install` (`prepare`). If hooks fail outside a git checkout, set `HUSKY=0` temporarily (as the Docker build does).

---

## 6. Environment variables

Canonical templates (safe placeholders only):

- Frontend (this repo): [`.env.example`](./.env.example)
- Backend (sibling repo): `dealio-backend/.env.example`

Copy each to `.env` in the same directory. **Never commit `.env`** (both repos gitignore it).

### 6.1 Frontend (summary)

| Variable | Required locally? | Purpose |
| --- | --- | --- |
| `PORT` | No (script uses 3002) | Documented listen port |
| `NEXT_PUBLIC_API_URL` | Yes | API base used by the browser on localhost |
| `NEXT_PUBLIC_FRONTEND_URL` | Yes | Site origin, CORS-related links, `allowedDevOrigins` |
| `BACKEND_URL` | Recommended | Next rewrite target for `/api/*` → Nest |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments UI | Stripe.js |
| `NEXT_PUBLIC_PUSHER_KEY` / `CLUSTER` | For realtime UI | Must match backend Pusher |
| `NEXT_PUBLIC_DO_SPACES_CDN_URL` | Optional | Public image CDN |
| `NEXT_PUBLIC_RP_META_PIXEL_ID` | Optional | Product Meta Pixel |
| `NEXT_PUBLIC_MEETING_FORM_URL` | Optional | Landing “book meeting” form |
| `NEXT_PUBLIC_FUNNEL_PAYMENT_*` | Optional | Funnel payment preview helpers |
| `GOOGLE_WALLET_NEST_CALLBACK_URL` | Optional | Wallet callback proxy |

### 6.2 Backend (summary)

| Group | Required to boot? | Notes |
| --- | --- | --- |
| Database `DB_*` | **Yes** | Default port `5433`, DB name `retention` |
| `JWT_SECRET` | **Yes** | Auth cookies + JWT |
| `TOKEN_ENCRYPTION_KEY` | Strongly recommended | Required when storing OAuth/CAPI secrets |
| `STRIPE_SECRET_KEY` | **Yes** | Boot fails without it |
| Brevo `BREVO_*` | **Yes** | Boot fails without API key + sender |
| `REDIS_*` | Strongly recommended | Automations / stats caches |
| Pusher | Optional | Warns and disables if incomplete |
| Twilio | Optional | Warns and disables if incomplete |
| DO Spaces | Optional | Uploads disabled if incomplete |
| Meta / Google Ads / Calendar / Wallet / Gemini | Optional | Feature-specific |

`FRONTEND_URL` may be a comma-separated list of allowed origins. Default CORS fallback is `http://localhost:3002`.

`PUBLIC_BASE_URL` should be the public API origin including `/api` (used in health + some absolute links).

Full commented list: see `.env.example` in each app.

---

## 7. Database migrations & seeds

Migrations live under `dealio-backend/src/db/`.

| Folder | Purpose |
| --- | --- |
| `src/db/migrations-baseline/` | **Full schema for a new database** (~145 migrations) |
| `src/db/migrations/` | Incremental folder (may be empty locally) |

`src/data-source.ts` uses **baseline** migrations unless `MIGRATIONS_DIR=migrations`.

### Fresh local database (recommended)

```bash
cd dealio-backend

# Apply baseline schema → table "migrations_baseline"
npm run migration:run:baseline

# Or equivalently (default when MIGRATIONS_DIR is unset):
npm run migration:run

# Inspect applied baseline migrations
npm run migration:show:baseline
```

### Seed roles (required for auth/membership)

```bash
npx ts-node -r tsconfig-paths/register scripts/seed-roles.ts
```

Inserts: `Admin`, `Super Admin`, `Member`, `Manager`, `Staff`, `Scanner`.

### Seed subscription plans (recommended for billing UI)

```bash
npx ts-node -r tsconfig-paths/register scripts/seed-subscription-plans.ts
```

### Other npm scripts (optional / demo)

| Script | Purpose |
| --- | --- |
| `npm run seed-acca-expert-admin` | Seed a platform admin account (script-defined) |
| `npm run seed-random-conversion-rates` | Demo conversion-rate data |
| `npm run seed-random-top-campaign-earnings` | Demo top-campaign earnings |
| `npm run fill-funnel-pages` | Backfill funnel page copy from campaign names |
| `npm run backfill-funnel-event-ad-sources` | Backfill funnel event ad sources |

Prefer `:dry-run` variants first when available.

**Do not** set `DB_SYNCHRONIZE=true` for normal development — use migrations.

---

## 8. Third-party integrations

Local core features work without every vendor. Integrations below need dashboard setup + matching env vars.

| Integration | Env (high level) | Local notes |
| --- | --- | --- |
| **Stripe** | `STRIPE_SECRET_KEY`, webhook secret, Connect client IDs | Required at boot. Use test keys. Forward webhooks with Stripe CLI to `http://localhost:4001/api/...` (payment webhook path used by the Payment module). |
| **Brevo** | `BREVO_API_KEY`, sender name/email | Required at boot. REST key only (`xkeysib-`). |
| **Pusher** | `PUSHER_*` + frontend `NEXT_PUBLIC_PUSHER_*` | Optional; realtime disabled if missing. |
| **Twilio** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Optional. Inbound webhooks need a public URL (`TWILIO_WEBHOOK_PUBLIC_URL`). |
| **DigitalOcean Spaces** | `DO_SPACES_*` + frontend CDN URL | Optional; uploads disabled if unset. |
| **Meta / Facebook** | `FACEBOOK_APP_ID/SECRET`, redirect URIs, webhook verify token | OAuth redirect defaults to `http://localhost:3002/auth/facebook/callback`. |
| **Google Login** | `GOOGLE_LOGIN_*` | Callback: `http://localhost:4001/api/auth/google/callback`. |
| **Google Ads** | `GOOGLE_ADS_*` | Redirect defaults to frontend `/auth/google/callback`. |
| **Google Calendar** | `GOOGLE_CALENDAR_*` | Callback: `http://localhost:4001/api/google/callback`. |
| **Google Wallet** | `GOOGLE_WALLET_*` | Optional. |
| **Gemini AI** | `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional AI funnel editor / images. |
| **Product Meta CAPI** | `RP_META_*` | Optional server-side Meta events. |

Ask a teammate for shared **dev/test** credentials. Do not copy production secrets into local `.env` files that might be shared.

---

## 9. Running the apps

Use **two terminals**. Start backend first (DB + Redis must be up).

### Backend

```bash
cd dealio-backend
npm run start:dev
```

- Listens on `PORT` (default **4001**)
- Global prefix: `/api`
- Health: `GET http://localhost:4001/api/health`

Other backend commands:

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode (local default) |
| `npm run start:debug` | Debug + watch |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run `node dist/main.js` |
| `npm run lint` | ESLint |
| `npm run build:check` | `tsc --noEmit` (large heap) |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | E2E Jest config |

### Frontend

```bash
cd dealio-frontend
npm run dev
```

- Listens on **3002** (`next dev -p 3002 --webpack`)
- Proxies `/api/*` to `BACKEND_URL` / `NEXT_PUBLIC_API_URL` via `next.config.ts` rewrites

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local webpack dev server (port 3002) |
| `npm run dev:turbo` | Turbopack variant |
| `npm run dev:fresh` | Clear `.next` then `dev` |
| `npm run build` | Production build |
| `npm run start` | Serve production build on 3002 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -p tsconfig.typecheck.json --noEmit` |

Open: [http://localhost:3002](http://localhost:3002)

---

## 10. Verify the setup

1. **Backend health**

   ```bash
   curl -s http://localhost:4001/api/health
   ```

   Expect JSON with `"status":"ok"` and `"service":"dealio-backend"`.

2. **Frontend loads** — open `http://localhost:3002` with no proxy/API errors in the browser console.

3. **API rewrite** — from the frontend origin, `/api/health` should rewrite to the Nest health endpoint when `BACKEND_URL` points at the local API.

4. **Auth readiness** — after `seed-roles`, registration/login flows can resolve role rows. OTP/email needs valid Brevo credentials.

5. **Optional checks**

   ```bash
   cd dealio-backend && npm run lint
   cd dealio-frontend && npm run typecheck && npm run lint
   ```

---

## 11. Useful scripts

### Backend (`dealio-backend/package.json`)

```bash
# Migrations
npm run migration:run:baseline
npm run migration:show:baseline
npm run migration:run          # baseline unless MIGRATIONS_DIR=migrations
npm run migration:revert
npm run migration:generate -- src/db/migrations/NameOfMigration

# Demo / maintenance (see scripts/ for details)
npm run fill-funnel-pages:dry-run
npm run seed-random-conversion-rates:dry-run
npm run backfill-funnel-event-ad-sources:dry-run
```

Additional one-off scripts under `dealio-backend/scripts/` (run with `npx ts-node -r tsconfig-paths/register scripts/<name>.ts`).

### Frontend

```bash
npm run clean          # delete .next
npm run dev:fresh      # clean + dev
```

---

## 12. Docker (optional)

Each app has its own `Dockerfile` and `docker-compose.yml`. They expect a filled `.env` and do **not** start Postgres/Redis for you.

### Backend

```bash
cd dealio-backend
docker compose up --build
# Host port: ${PORT:-4001} → container 4001
```

### Frontend

```bash
cd dealio-frontend
# Ensure NEXT_PUBLIC_* and BACKEND_URL are set for the build args
docker compose up --build
# Host port: ${PORT:-3002} → container 3002
```

Frontend image uses Next `output: "standalone"`. Build-time `ARG`s bake `NEXT_PUBLIC_*` into the client bundle.

---

## 13. Project layout

```text
dealio-frontend/              # this repository
├── README.md
├── app/                      # Next.js App Router (routes, components, hooks, services)
├── public/
├── next.config.ts            # Rewrites /api → backend
├── .env.example
└── package.json

# Clone alongside:
dealio-backend/               # NestJS API (sibling repo)
```

Additional architecture notes may live in a sibling `docs/` folder in a local workspace checkout.

---

## 14. Troubleshooting

### Backend will not start

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `DB_HOST` / connection errors | Wrong host/port/DB | Match `DB_*` to Postgres; remember default port **5433** |
| `JWT_SECRET is not defined` | Missing secret | Set `JWT_SECRET` in `.env` |
| `Missing required Brevo env` | Empty Brevo vars | Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` |
| Brevo SMTP key error | Used `xsmtpsib-` key | Create a REST API key (`xkeysib-`) |
| Stripe `getOrThrow` / missing key | No `STRIPE_SECRET_KEY` | Set a Stripe **test** secret key |
| Redis / BullMQ connection errors | Redis down | Start Redis; check `REDIS_HOST` / `REDIS_PORT` |
| CORS `Blocked by CORS` | Frontend origin not allowed | Set `FRONTEND_URL=http://localhost:3002` (or include your ngrok origin) |

### Frontend issues

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| API calls hit production | `.env` still has production URLs | Use localhost values from `.env.example` and restart `npm run dev` |
| `/api` 404 / proxy fail | Bad `BACKEND_URL` | Point at `http://localhost:4001/api` |
| Payments UI disabled | Missing publishable key | Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Realtime / AI stream messages | Missing Pusher public key | Set `NEXT_PUBLIC_PUSHER_KEY` + `CLUSTER` to match backend |
| Stale UI after env change | Next cached env | Restart dev server; try `npm run dev:fresh` |

### Migrations

| Symptom | Fix |
| --- | --- |
| Empty schema after `migration:run` | Confirm you used baseline (`migration:run:baseline`). `src/db/migrations/` may be empty. |
| Wrong migrations table | Baseline uses table `migrations_baseline`; incremental uses `migrations`. |
| `DB_SYNCHRONIZE=true` surprises | Keep `false`; prefer migrations. |

### Ports already in use

```bash
# Find and stop the process, or change PORT in .env / scripts
lsof -i :3002
lsof -i :4001
lsof -i :5433
lsof -i :6379
```

---

## 15. Missing / incomplete configuration

Verified gaps and caveats from the current codebase:

1. **No root git repository** — frontend and backend are separate GitHub remotes. Clone both.
2. **`src/db/migrations/` may be empty** — new environments must use **baseline** migrations.
3. **No Docker Compose for Postgres/Redis** — install and run them yourself (or add your own compose).
4. **`COOKIE_DOMAIN`** — may appear in real deployments but is **not read** by current `auth-cookies.ts`. Documented as unused for local setup.
5. **`FACEBOOK_CONFIG_ID`** — listed in `.env.example` as optional commentary; **not referenced** by TypeScript sources today.
6. **Brevo + Stripe secrets are mandatory at boot** — there is no “skip integrations” flag; use test/dummy-format values only if your team provides a documented stub approach (otherwise real test credentials).
7. **Many seed scripts are environment-specific** (named accounts, demo businesses). Prefer `seed-roles` + `seed-subscription-plans` for a clean local DB; ask the team before running personal/demo seeders.
8. **Twilio inbound SMS** needs a publicly reachable URL (ngrok/tunnel) for webhooks.
9. **Subscription plan Stripe price IDs** in `seed-subscription-plans.ts` are environment-specific; update them for your Stripe account if checkout must work locally.
10. **Google / Meta OAuth** apps must allow the localhost redirect URIs listed in `.env.example`.

If something required for your task is missing from `.env.example`, check the module under `dealio-backend/src/modules/<feature>/` for `process.env` / `ConfigService` keys and add a placeholder to `.env.example` (never real secrets).

---

## Quick start checklist

```bash
# 0) Prerequisites: Node ≥ 20.9, Postgres, Redis
# 1) Clone both repos
# 2) Postgres DB `retention` + Redis running
# 3) Backend
cd dealio-backend
cp .env.example .env   # fill required secrets
npm install
npm run migration:run:baseline
npx ts-node -r tsconfig-paths/register scripts/seed-roles.ts
npx ts-node -r tsconfig-paths/register scripts/seed-subscription-plans.ts
npm run start:dev

# 4) Frontend (new terminal)
cd dealio-frontend
cp .env.example .env   # localhost API URLs
npm install
npm run dev

# 5) Open http://localhost:3002
#    Health: http://localhost:4001/api/health
```

---

## License

Private / unlicensed (`UNLICENSED` in backend `package.json`). Internal use only unless otherwise agreed by the owners.
