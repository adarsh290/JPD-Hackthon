# 🧠 SmartLinkHub v2.0 — Intelligent Link Management Platform

> Context-aware link hubs that adapt to users, devices, battery level, network speed, and performance data — all from one shareable URL.

![Tech Stack](https://img.shields.io/badge/React_18-TypeScript-blue?logo=react)
![Backend](https://img.shields.io/badge/Express-Prisma-green?logo=express)
![Database](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ What Makes This Different

SmartLinkHub turns static "link-in-bio" pages into **dynamic, context-aware infrastructure**. Every hub page adapts in real-time based on the visitor's:

- 📱 **Device** — mobile vs. desktop link priorities
- 🌍 **Location** — geo-fenced URL redirects
- 🔋 **Battery** — power-saver mode (<15%) disables animations
- 📶 **Network** — data-saver mode on slow/2G connections
- ⏰ **Time** — scheduled link visibility (business hours, weekdays)
- 📊 **Performance** — auto-sorts links by CTR

---

## 🚀 Platform Modules

| # | Module | Description |
|---|--------|-------------|
| **M1** | Smart Link Hubs | Context-aware link pages with dynamic rendering per visitor |
| **M2** | Rule Engine | Time-gated, device-type, and geo-fenced routing rules |
| **M3** | Pulse Analytics | Real-time Socket.io event stream with live dashboard |
| **M4** | Gated Links | Password-protected links with encrypted gate values |
| **M5** | Hub Health Scoring | Automated diagnostics with performance/engagement metrics |
| **M6** | Context Detection | Battery Status API + Network Information API for extreme environments |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Shadcn UI, TanStack Query |
| **Backend** | Node.js, Express, TypeScript, Socket.io (real-time), Prisma ORM |
| **Database** | PostgreSQL |
| **Validation** | Zod (shared schemas between frontend + backend) |
| **Auth** | Custom JWT (bcrypt + localStorage) |
| **Monorepo** | npm Workspaces (`packages/shared` for type safety) |

---

## 📐 Architecture

```
JPD-Hackthon/
├── src/                        ← React Frontend (Vite + TypeScript + Tailwind)
│   ├── pages/                  ← Index, LandingPage, PublicHub, NotFound
│   ├── components/             ← Dashboard, HubEditor, AuthForm, HubCard...
│   ├── hooks/                  ← useAuth, useHubs, useAnalytics, useQRCode...
│   └── contexts/               ← ThemeContext (dark/light)
├── backend/                    ← Express API
│   ├── src/
│   │   ├── config/             ← env.ts, database.ts, socket.ts
│   │   ├── controllers/        ← auth, hub, link, analytics, stats, resolver, qr
│   │   ├── services/           ← analyticsService, authService, resolverService
│   │   ├── routes/             ← All API route definitions
│   │   ├── middleware/         ← auth.ts, errorHandler.ts, rateLimiter.ts
│   │   └── server.ts          ← Express app entrypoint
│   └── prisma/schema.prisma   ← PostgreSQL data model
├── packages/shared/            ← Shared Zod schemas + TypeScript types
├── .env                        ← Frontend env (VITE_API_URL="/api")
├── vite.config.ts              ← Vite config + /api proxy → localhost:3000
└── package.json                ← Root workspace config
```

---

## 🏁 Getting Started

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** 14+
- **npm** (not pnpm/yarn)

### 1. Clone & Install
```bash
git clone https://github.com/adarsh290/JPD-Hackthon.git
cd JPD-Hackthon
npm install
```

### 2. Build Shared Package
```bash
cd packages/shared && npx tsc && cd ../..
```

### 3. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials

# Frontend (usually no changes needed)
cp .env.example .env
```

### 4. Setup Database
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

### 5. Start Development
```bash
# Terminal 1: Backend (port 3000)
cd backend && npm run dev

# Terminal 2: Frontend (port 8080/8081)
npm run dev
```

> 🌐 Open `http://localhost:8081` — the Vite proxy forwards `/api/*` to the Express backend.

---

## 📡 API Overview

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Create account |
| `POST` | `/api/auth/login` | ❌ | Login → JWT token |
| `GET` | `/api/hubs` | ✅ | List user's hubs (with link/click counts) |
| `POST` | `/api/hubs` | ✅ | Create hub |
| `PATCH` | `/api/hubs/:id` | ✅ | Update hub |
| `DELETE` | `/api/hubs/:id` | ✅ | Delete hub |
| `GET` | `/api/hubs/:id/links` | ✅ | Get links for hub |
| `POST` | `/api/links` | ✅ | Create link |
| `GET` | `/api/analytics/hub/:hubId` | ✅ | Hub analytics |
| `GET` | `/api/stats` | ❌ | Public platform stats |
| `GET` | `/api/resolve/:slug` | ❌ | Resolve hub → context-aware links |
| `POST` | `/api/analytics/click` | ❌ | Track click (rate-limited) |
| `GET` | `/api/hubs/:id/qr` | ✅ | Generate branded QR code |
| `GET` | `/s/:shortCode` | ❌ | Short URL redirect |

---

## 🗄️ Database Models

| Model | Key Fields |
|-------|-----------|
| **User** | `id (uuid)`, `email`, `passwordHash`, `displayName` |
| **Hub** | `id (int)`, `userId`, `slug (unique)`, `title`, `isActive` |
| **Link** | `id (int)`, `hubId`, `url`, `title`, `gateType`, `gateValue`, `priorityScore` |
| **Rule** | `id (int)`, `linkId`, `type` (time/device/geo/performance), `value (JSON)` |
| **Analytics** | Click/visit events: `device`, `country`, `timestamp` |
| **DailyAnalytics** | Pre-aggregated daily metrics for dashboard performance |

---

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test
```

---

## 🔒 Security

- JWT authentication with bcrypt password hashing
- Rate limiting on all endpoints (5 req/15min for auth, 100/15min for API)
- Input validation via Zod schemas
- Helmet.js security headers
- SQL injection protection (Prisma)
- Encrypted gate values for password-protected links

---

## 👤 Author

**Built by Adarsh Singh**
*Hackathon project pushing the boundaries of link management through context-aware computing.*

## 📄 License

MIT — Open for learning and demonstration purposes.
