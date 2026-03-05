# Smart Link Hub — Development Guide & Context

This document serves as the foundational mandate for Gemini CLI within this project. It outlines the architecture, core features, and specialized conventions.

---

## 🚀 "Hackathon-Winning" Features

The project has been upgraded with high-impact, intelligent infrastructure:

1.  **AI-Powered Metadata Fetcher:** 
    *   **Logic:** Backend `LinkController.fetchMetadata` uses native fetch to scrape title and favicon from any URL.
    *   **Frontend:** `LinkEditor` features a Sparkles (✨) button for automatic form filling.

2.  **Real-Time "Pulse" Analytics:**
    *   **Infrastructure:** Socket.io integration (`backend/src/config/socket.ts`).
    *   **Behavior:** Dashboard updates instantly on `new-visit` or `new-click` events without page refresh.
    *   **Hook:** `useRealtimeAnalytics.tsx` manages client connections.

3.  **Gated "Action" Links:**
    *   **Database:** `Link` model includes `gate_type` and `gate_value`.
    *   **Security:** `ResolverService.unlock` verifies decryption keys (passwords) before revealing URLs.
    *   **UX:** Interactive password modals in `PublicHub.tsx` using AnimatePresence.

4.  **Adaptive "Extreme Context" Detection:**
    *   **Power Saver:** Detects <15% battery via Battery Status API; disables Matrix animations and switches to high-contrast mode.
    *   **Data Saver:** Detects slow/2G connections via Network Information API; hides external icons and optimizes UI.

5.  **Branded QR Codes:**
    *   **Customization:** Supports `darkColor` and `lightColor` query params.
    *   **Default:** Cyberpunk "Hacker Green" (#00FF00) on Black.

---

## 🏗️ Architecture Reference

### Tech Stack
- **Frontend:** React (TS), Vite, Framer Motion, Tailwind CSS, TanStack Query.
- **Backend:** Node.js, Express, Socket.io, Prisma (PostgreSQL).
- **Monorepo:** Standard root for frontend, `/backend` folder for API.

### Key Files
| Path | Description |
| :--- | :--- |
| `backend/src/config/socket.ts` | Socket.io server initialization and event helpers. |
| `backend/src/services/rulesEngine.ts` | Context-aware link routing logic. |
| `backend/src/controllers/statsController.ts` | Public `/api/stats` endpoint for live landing page data. |
| `src/pages/PublicHub.tsx` | Main public-facing adaptive entry point. |
| `src/pages/LandingPage.tsx` | Marketing page with live stats from `/api/stats`. |
| `src/hooks/useAuth.tsx` | Auth Context provider + `useAuth()` hook (shared state). |
| `src/hooks/useRealtimeAnalytics.tsx` | Real-time dashboard synchronization hook. |
| `backend/prisma/schema.prisma` | Source of truth for Link Gates and Analytics models. |

---

## 🛠️ Development Mandates

### 1. Database Migrations
Always use `npm run prisma:migrate --name <name>` inside the `backend` directory when changing the schema.

### 2. Real-Time Events
When adding new tracking logic, always call `emitAnalyticsEvent` from `backend/src/config/socket.ts` to ensure the dashboard stays in sync.

### 3. Auth is Context-Based
`useAuth()` is backed by `AuthProvider` in `App.tsx`. All components share the same user state via React Context. Do NOT create separate `useState` hooks for auth.

### 4. Hub Fields are camelCase
Backend returns Prisma fields: `title`, `isActive`, `createdAt`. Frontend `Hub` interface matches exactly. Do NOT use snake_case (`is_active`, `total_visits`).

### 5. Public Routes Before qrRoutes
In `backend/src/server.ts`, public routes (like `/api/stats`) must be registered BEFORE `app.use('/api', qrRoutes)` because qrRoutes applies `authenticate` middleware to all `/api/*`.

### 6. "Hacker" Aesthetic
Maintain the cyberpunk aesthetic. Use the `.glitch` and `.scanline` CSS classes found in `index.css` for new UI elements. Always prefer `framer-motion` for transitions.

---

## 📜 Commands
- **Root Dev:** `npm run dev` (Starts frontend)
- **Backend Dev:** `cd backend && npm run dev`
- **Prisma Studio:** `cd backend && npx prisma studio`
