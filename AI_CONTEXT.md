# Smart Link Hub — AI Context & Architecture Reference

> **READ THIS FIRST before touching any code, adding features, or debugging issues.**
> Last updated: 2026-03-05

---

## 🏗️ Project Structure (Monorepo)

This is an **npm Workspaces Monorepo**. The root `package.json` defines all workspaces.

```
JPD-Hackthon/
├── src/                        ← React Frontend (Vite + TypeScript + Tailwind)
├── backend/                    ← Express API (Node.js + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── config/             ← env.ts (Zod-validated), database.ts (PrismaClient)
│   │   ├── controllers/        ← authController, hubController, linkController...
│   │   ├── services/           ← Business logic (authService, hubService...)
│   │   ├── routes/             ← authRoutes, hubRoutes, linkRoutes, analyticsRoutes...
│   │   ├── middleware/         ← errorHandler.ts, rateLimiter.ts, auth.ts
│   │   └── server.ts           ← Express app entrypoint
│   ├── prisma/
│   │   └── schema.prisma       ← PostgreSQL Prisma schema
│   ├── .env                    ← Backend secrets (PORT, DATABASE_URL, JWT_SECRET...)
│   └── package.json
├── packages/
│   └── shared/                 ← Shared Zod schemas + TypeScript types
│       ├── src/index.ts        ← Source of truth for all data shapes
│       └── dist/               ← ⚠️ MUST be built before backend starts (run: npx tsc)
├── .env                        ← Frontend env (VITE_API_URL="/api")
├── vite.config.ts              ← Vite frontend config with /api proxy
└── package.json                ← Root workspace config
```

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, React Query |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Validation | Zod (shared between frontend + backend via `packages/shared`) |
| Auth | Custom JWT — stored in browser `localStorage`, passed as `Authorization: Bearer <token>` |
| Package Manager | **npm** (not bun, not pnpm) |

> ⚠️ **Supabase has been completely removed.** Do NOT reinstall `@supabase/supabase-js` or any Supabase client code. All auth flows use the custom Express JWT API.

---

## 🔌 How the Frontend Talks to the Backend

**Vite Proxy** (`vite.config.ts`) is configured to forward all `/api/*` and `/health` requests from the Vite dev server (`localhost:8080`) to the Express backend (`localhost:3000`). This means:

- The browser never makes a cross-origin request in development.
- CORS is effectively bypassed during local dev.
- The frontend uses `VITE_API_URL="/api"` (relative, not absolute).

**In production**, the Express server serves the built frontend `dist/` as static files, so it's one server.

```typescript
// Frontend fetch example:
const API_URL = import.meta.env.VITE_API_URL || '/api';
fetch(`${API_URL}/auth/login`, { method: 'POST', ... })
```

### API Routes
| Route | Description |
|---|---|
| `POST /api/auth/register` | Create a new user account |
| `POST /api/auth/login` | Login and receive a JWT token |
| `GET /api/hubs` | Get hubs for the authenticated user |
| `POST /api/hubs` | Create a hub |
| `GET /api/links` | Get links inside a hub |
| `POST /api/links` | Create a link |
| `GET /api/analytics/:hubId` | Get analytics for a hub |
| `GET /health` | Simple health check endpoint |

### Auth Flow
1. User registers/logs in → backend returns `{ data: { user, token } }`
2. Frontend stores `token` and `user` in `localStorage`
3. Subsequent requests include header: `Authorization: Bearer <token>`

---

## 🗄️ Database Models (Prisma + PostgreSQL)

Schema lives in `backend/prisma/schema.prisma`.

- **User**: `id (uuid)`, `email (unique)`, `password_hash`, `displayName`
- **Hub**: `id (int)`, `userId`, `slug (unique)`, `title`, `isActive`
- **Link**: `id (int)`, `hubId`, `url`, `title`, `isActive`, `priorityScore`
- **Rule**: `id (int)`, `linkId`, `type`, `value (Json)` — for geo/time/device routing rules
- **Analytics**: Raw click events (device, country, timestamp)
- **DailyAnalytics**: Pre-aggregated daily metrics per hub/link

---

## 🌍 Environment Variables

### `backend/.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_link_hub"
JWT_SECRET="your-secret-at-least-32-characters"
PORT=3000
FRONTEND_URL="http://localhost:8080"
NODE_ENV="development"
JWT_EXPIRES_IN="7d"
```

### `.env` (root — frontend)
```env
VITE_API_URL="/api"
```
> ⚠️ `VITE_API_URL` must be a **relative path** (`/api`), NOT an absolute URL, because the Vite proxy handles forwarding.

---

## 🚀 How to Start Locally (EXACT STEPS)

**Prerequisites:** PostgreSQL running locally, `backend/.env` configured.

```bash
# 1. Install all workspace dependencies from the root
npm install

# 2. Build the shared Zod schemas package (REQUIRED before backend starts)
cd packages/shared && npx tsc && cd ../..

# 3. Generate the Prisma database client (REQUIRED)
cd backend && npx prisma generate && cd ..

# 4. Run database migrations (first time only)
cd backend && npx prisma migrate dev && cd ..

# 5. Start the backend (in one terminal)
cd backend && npm run dev
# ✅ Should see: 🚀 Server running on port 3000

# 6. Start the frontend (in another terminal from project root)
npm run dev
# ✅ Should see: Vite running on http://localhost:8080
```

> 🌐 Open `http://localhost:8080` in your browser. The frontend is on port **8080**, not 5173.

---

## ⚠️ Critical Known Quirks & Gotchas

### 1. The Monorepo Prisma Problem
The npm workspace hoists `@prisma/client` to the root `node_modules`, but `prisma generate` writes the compiled client to `backend/node_modules/.prisma/client`. This causes a mismatch.

**The fix already applied:** `backend/src/config/database.ts` imports directly from the local generated path:
```typescript
import { PrismaClient } from '../../node_modules/.prisma/client';
```
If you ever see `"@prisma/client did not initialize yet"`, run `npx prisma generate` inside the `backend/` directory.

### 2. The Shared Package Must Be Built First
The backend imports `@smart-link-hub/shared`. The `tsconfig.json` paths alias resolves it to `packages/shared/dist/index.js`. If `dist/` doesn't exist, the backend will throw `Cannot find module`.

**Fix:** Always run `npx tsc` in `packages/shared/` before starting the backend.

### 3. Backend is CommonJS (NOT ES Modules)
The backend uses `"module": "CommonJS"` in `backend/tsconfig.json` and has NO `"type": "module"` in `backend/package.json`. This is intentional to support `ts-node`/`tsx` and workspace symlink resolution.

**Never switch it to ESM** — it breaks workspace imports and `__dirname`.

### 4. Rate Limiter is Disabled in Development
`backend/src/middleware/rateLimiter.ts` uses `skip: () => isDev` for all rate limiters. This is intentional. In production, auth is limited to 5 requests per 15 min.

### 5. CORS in Development
CORS is currently set to `app.use(cors())` (allow all). This is acceptable because the Vite proxy means the browser never makes cross-origin requests anyway. If you want to restore strict CORS for production, use `config.cors.origin` from `backend/src/config/env.ts`.

### 6. Windows + npx Quirk
On Windows, `npx` sometimes hangs with an interactive "install?" prompt in certain shells. If a command like `npx prisma generate` appears to hang with no output, Ctrl+C and use `npm run prisma:generate` instead (which runs the local `prisma` binary directly).

---

## 📁 Key Files Quick Reference

| File | Purpose |
|---|---|
| `backend/src/server.ts` | Express app: middleware, routes, error handler |
| `backend/src/config/env.ts` | Zod-validated environment variable config |
| `backend/src/config/database.ts` | PrismaClient singleton |
| `backend/src/middleware/rateLimiter.ts` | Rate limiting (dev-skipped) |
| `backend/src/middleware/errorHandler.ts` | Global error handler (`AppError` class) |
| `backend/prisma/schema.prisma` | Full PostgreSQL data model |
| `packages/shared/src/index.ts` | All Zod schemas + TypeScript types |
| `src/hooks/useAuth.tsx` | Frontend login/register/session logic |
| `src/hooks/useHubs.tsx` | Frontend hub CRUD operations |
| `vite.config.ts` | Vite + `/api` proxy config |
| `.env` | Frontend env (`VITE_API_URL="/api"`) |
| `backend/.env` | Backend secrets |
