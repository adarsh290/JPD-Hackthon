# Smart Link Hub — AI Context & Architecture Reference

> **READ THIS FIRST before touching any code, adding features, or debugging issues.**
> Last updated: 2026-03-05

---

## 🏗️ Project Structure (Monorepo)

**npm Workspaces Monorepo** — root `package.json` defines all workspaces.

```
JPD-Hackthon/
├── src/                        ← React Frontend (Vite + TypeScript + Tailwind)
│   ├── pages/                  ← Index, LandingPage, PublicHub, NotFound
│   ├── components/             ← Dashboard, HubEditor, AuthForm, HubCard, HackerBackground...
│   ├── hooks/                  ← useAuth, useHubs, useAnalytics, useQRCode, useRealtimeAnalytics
│   └── contexts/               ← ThemeContext (dark/light mode)
├── backend/                    ← Express API (Node.js + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── config/             ← env.ts, database.ts, socket.ts
│   │   ├── controllers/        ← auth, hub, link, analytics, stats, resolver, qr, shortUrl
│   │   ├── services/           ← analyticsService, authService, resolverService, linkService
│   │   ├── routes/             ← authRoutes, hubRoutes, linkRoutes, analyticsRoutes, resolverRoutes, qrRoutes, shortUrlRoutes
│   │   ├── middleware/         ← errorHandler.ts, rateLimiter.ts, auth.ts
│   │   └── server.ts          ← Express app entrypoint
│   ├── prisma/schema.prisma   ← PostgreSQL data model
│   └── .env                   ← Backend secrets (PORT, DATABASE_URL, JWT_SECRET...)
├── packages/shared/            ← Shared Zod schemas + TypeScript types
│   ├── src/index.ts           ← Source of truth for all data shapes
│   └── dist/                  ← ⚠️ MUST be built before backend starts (npx tsc)
├── .env                       ← Frontend env (VITE_API_URL="/api")
├── vite.config.ts             ← Vite config + /api proxy → localhost:3000
└── package.json               ← Root workspace config
```

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, TanStack Query |
| Backend | Node.js, Express, TypeScript, Socket.io, Prisma ORM |
| Database | PostgreSQL |
| Validation | Zod (shared between frontend + backend via `packages/shared`) |
| Auth | Custom JWT — stored in browser `localStorage`, passed as `Authorization: Bearer <token>` |
| Package Manager | **npm** (not bun, not pnpm) |

> ⚠️ **Supabase has been completely removed.** Do NOT reinstall `@supabase/supabase-js`.

---

## 🔌 How the Frontend Talks to the Backend

**Vite Proxy** (`vite.config.ts`) forwards `/api/*` and `/health` from the Vite dev server to Express (`localhost:3000`).

- Browser never makes cross-origin requests in development
- Frontend uses `VITE_API_URL="/api"` (relative, not absolute)
- In production, Express serves the built `dist/` as static files

### Auth Flow
1. User registers/logs in → backend returns `{ data: { user, token } }`
2. Frontend `AuthProvider` stores `token` and `user` in `localStorage` and React Context
3. All components share auth state via `useAuth()` hook (Context-based, not per-instance)
4. Subsequent requests include `Authorization: Bearer <token>` header

### API Routes

| Route | Auth | Description |
|---|---|---|
| `POST /api/auth/register` | ❌ | Create account |
| `POST /api/auth/login` | ❌ | Login → JWT |
| `GET /api/hubs` | ✅ | User's hubs (with `_count.links`, `_count.analytics`) |
| `POST /api/hubs` | ✅ | Create hub |
| `PATCH /api/hubs/:id` | ✅ | Update hub |
| `DELETE /api/hubs/:id` | ✅ | Delete hub |
| `GET /api/hubs/:id/links` | ✅ | Hub links |
| `POST /api/links` | ✅ | Create link |
| `GET /api/analytics/hub/:hubId` | ✅ | Analytics summary |
| `GET /api/analytics/export/:hubId` | ✅ | CSV export |
| `GET /api/stats` | ❌ | Public platform stats (landing page) |
| `GET /api/resolve/:slug` | ❌ | Resolve hub → context-sorted links |
| `POST /api/analytics/click` | ❌ | Track click (rate-limited) |
| `GET /api/hubs/:id/qr` | ✅ | QR code generation |
| `GET /s/:shortCode` | ❌ | Short URL redirect |
| `GET /health` | ❌ | Health check |

---

## 🗄️ Database Models (Prisma + PostgreSQL)

Schema: `backend/prisma/schema.prisma`

- **User**: `id (uuid)`, `email (unique)`, `passwordHash`, `displayName`
- **Hub**: `id (int)`, `userId`, `slug (unique)`, `title`, `isActive`
- **Link**: `id (int)`, `hubId`, `url`, `title`, `isActive`, `priorityScore`, `gateType`, `gateValue`
- **Rule**: `id (int)`, `linkId`, `type` (time/device/geo/performance), `value (Json)`
- **Analytics**: Raw events — `linkId?`, `hubId?`, `device`, `country`, `timestamp`
- **DailyAnalytics**: Pre-aggregated metrics — `impressions`, `clicks`, `deviceBreakdown`, `countryBreakdown`

---

## 🌍 Environment Variables

### `backend/.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_link_hub"
JWT_SECRET="your-secret-at-least-32-characters"
PORT=3000
FRONTEND_URL="http://localhost:8081"
NODE_ENV="development"
JWT_EXPIRES_IN="7d"
```

### `.env` (root — frontend)
```env
VITE_API_URL="/api"
```
> ⚠️ `VITE_API_URL` must be a **relative path**, NOT absolute.

---

## 🚀 How to Start Locally

```bash
# 1. Install all workspace dependencies
npm install

# 2. Build shared schemas (REQUIRED before backend starts)
cd packages/shared && npx tsc && cd ../..

# 3. Generate Prisma client (REQUIRED)
cd backend && npx prisma generate && cd ..

# 4. Run database migrations (first time)
cd backend && npx prisma migrate dev && cd ..

# 5. Start backend (Terminal 1)
cd backend && npm run dev
# ✅ Server running on port 3000

# 6. Start frontend (Terminal 2 from root)
npm run dev
# ✅ Vite running on http://localhost:8081
```

---

## ⚠️ Known Quirks

1. **Monorepo Prisma**: `backend/src/config/database.ts` imports from `../../node_modules/.prisma/client`. Run `npx prisma generate` inside `backend/` if you see "did not initialize" errors.

2. **Shared package must be built first**: Run `npx tsc` in `packages/shared/` before starting backend.

3. **Backend is CommonJS**: Uses `"module": "CommonJS"` in tsconfig. Never switch to ESM.

4. **Rate limiter skipped in dev**: All rate limiters use `skip: () => isDev`.

5. **`/api/stats` must be registered before `qrRoutes`**: The QR routes use `router.use(authenticate)` which catches all `/api/*` requests. Public routes must be registered first in `server.ts`.

6. **Hub fields are camelCase**: Backend returns Prisma fields (`title`, `isActive`, `createdAt`), NOT snake_case. Frontend `Hub` interface matches this.

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `backend/src/server.ts` | Express app: middleware, routes, error handler |
| `backend/src/config/socket.ts` | Socket.io initialization + event helpers |
| `backend/src/controllers/statsController.ts` | Public `/api/stats` endpoint |
| `backend/src/services/rulesEngine.ts` | Context-aware link routing logic |
| `backend/prisma/schema.prisma` | Full PostgreSQL data model |
| `packages/shared/src/index.ts` | All Zod schemas + TypeScript types |
| `src/hooks/useAuth.tsx` | Auth Context provider + useAuth hook |
| `src/hooks/useHubs.tsx` | Hub CRUD (TanStack Query) |
| `src/pages/PublicHub.tsx` | Public adaptive hub page |
| `src/pages/LandingPage.tsx` | Marketing page with live stats |
| `src/components/HackerBackground.tsx` | Matrix rain canvas animation |
| `src/contexts/ThemeContext.tsx` | Dark/light theme with CSS variables |
| `vite.config.ts` | Vite + /api proxy config |
