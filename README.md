# Lumen Auth — Easygenerator Full-Stack Assessment

A production-minded **sign up / sign in** module.

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, React Hook Form + Zod |
| Backend  | NestJS 11, MongoDB (Mongoose), argon2id, JWT, Pino, Swagger |
| Quality  | Jest + Supertest (API unit & e2e), Vitest + Testing Library (web), ESLint, GitHub Actions |
| Deploy   | Single Docker image on Railway (Nest serves the built SPA → one origin) |

**Live demo:** https://app-production-fad8ef04.up.railway.app · **API docs:** https://app-production-fad8ef04.up.railway.app/api/docs

---

## Quick start

Requirements: Node 22 (`nvm use`), a MongoDB instance (local, Docker or Atlas).

```bash
npm install
cp api/.env.example api/.env       # set MONGODB_URI and a 32+ char JWT_ACCESS_SECRET
# optional local Mongo:  docker run -d -p 27017:27017 --name mongo mongo:7

npm run dev                          # API on :3000, web on :5173 (proxies /api → :3000)
```

Open http://localhost:5173. Swagger UI: http://localhost:3000/api/docs.

### Scripts (run from the repo root)

| Command | What it does |
|---|---|
| `npm run dev` | API (watch mode) + Vite dev server |
| `npm run build` | Builds the web app, then the API |
| `npm start` | Runs the production build (API serves `web/dist`) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc` in both workspaces |
| `npm test` | API unit tests (Jest) + web tests (Vitest) |
| `npm run test:e2e -w api` | API end-to-end tests against a real MongoDB (`MONGODB_URI` required) |

### Docker

```bash
docker build -t lumen-auth .
docker run -p 3000:3000 -e MONGODB_URI=... -e JWT_ACCESS_SECRET=... lumen-auth
```

---

## API

All routes are prefixed with `/api`. Errors share one shape:
`{ statusCode, error, message, path, timestamp, requestId }`.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | – | `{ email, name, password }` → 201, sets cookies. 400 on validation, 409 if email exists |
| `POST` | `/auth/signin` | – | `{ email, password }` → 200, sets cookies. 401 with a generic message |
| `POST` | `/auth/refresh` | refresh cookie | Rotates the refresh token, issues a new access token |
| `POST` | `/auth/signout` | refresh cookie | Revokes the session family, clears cookies → 204 |
| `GET`  | `/users/me` | **access token** | **Protected** — current user's profile |
| `GET`  | `/health` | – | Liveness + MongoDB ping (used by Railway health checks) |

### Validation rules (enforced server-side, mirrored client-side)

- **Email** — valid format, trimmed and lower-cased, unique (case-insensitive).
- **Name** — 3–50 characters after trimming.
- **Password** — 8–128 characters, at least one letter, one number and one special character.

Unknown body properties are rejected (`forbidNonWhitelisted`) to prevent mass assignment.

---

## Architecture & security decisions

```
api/src
├── auth/            signup · signin · refresh · signout, JWT guard, session schema
├── users/           user schema, service, protected GET /users/me
├── common/          password rules (single source of truth), global exception filter
├── config/          zod-validated environment (app refuses to boot when misconfigured)
├── health/          readiness endpoint
└── setup-app.ts     shared bootstrap (prefix, helmet, cookies, validation) — reused by e2e tests
web/src
├── components/ui/   Button, TextField, PasswordField, Alert…
├── features/auth/   AuthProvider, route guards, zod schemas, password meter, layout
├── lib/api.ts       fetch client with single-flight silent refresh
└── pages/           SignIn, SignUp, App (welcome), 404
```

- **Tokens in httpOnly cookies, not localStorage** — JavaScript can never read them, so an XSS bug can't exfiltrate a session. Cookies are `Secure` in production and `SameSite=Strict`; combined with the single-origin deployment and JSON-only endpoints this closes the CSRF hole that cookies would otherwise open.
- **Short-lived access token (15 min) + rotating refresh token (7 days)**. Refresh tokens are opaque random values; only their SHA-256 hash is stored. Every refresh rotates the token; replaying an already-rotated token revokes the whole session family (theft detection), with a 10 s grace window for legitimate concurrent tabs. Expired sessions are removed by a MongoDB TTL index. The refresh cookie is scoped to `/api/auth` so it isn't sent with ordinary API calls.
- **argon2id** password hashing with OWASP parameters. Unknown emails are verified against a dummy hash so response timing doesn't reveal which accounts exist; sign-in errors are generic.
  _Trade-off:_ sign-up returns 409 for an existing email — standard UX, accepted enumeration risk mitigated by rate limiting.
- **Rate limiting** — 120 req/min globally, 10 req/min on sign-up/sign-in (`@nestjs/throttler`, proxy-aware via `trust proxy`).
- **Helmet** with a strict CSP, `x-powered-by` disabled, request body validation via `class-validator`, `passwordHash` excluded from queries by default (`select: false`).
- **Observability** — structured JSON logs (Pino) with request IDs (`x-request-id` is honoured/echoed); cookies, auth headers and passwords are redacted.
- **Config** — validated with Zod at startup; e.g. a JWT secret shorter than 32 chars stops the boot.

### Frontend UX

- Live password checklist + strength meter, show/hide toggle, Caps Lock warning.
- Validation on blur then on change (`mode: 'onTouched'`), focus moves to the first invalid field, server errors mapped to fields (409 → email with a "Sign in instead" link).
- Accessible: real `<label>`s, `aria-invalid`/`aria-describedby`, `role="alert"` errors, visible focus rings, `prefers-reduced-motion` respected, correct `autocomplete` hints for password managers.
- Session restore on reload, protected routes that return you to where you were, silent token refresh.

## Deployment (Railway)

One service built from the `Dockerfile` plus the Railway MongoDB template.
Environment variables on the app service:

```
NODE_ENV=production
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_ACCESS_SECRET=<random 48 bytes>
```

Health check path: `/api/health`.

## What I'd add next

Email verification & password reset (needs a mail provider), account lockout/backoff per account (not just per IP), Redis-backed throttling for multi-instance deployments, OpenTelemetry tracing, and Playwright E2E tests in CI.
