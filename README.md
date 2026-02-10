# Smart Link Hub

Smart Link Hub is an intelligent link management platform that allows users to create dynamic, rule-based link pages with analytics, redirects, and context-aware behavior.

Unlike basic link-in-bio tools, Smart Link Hub can change which links are shown or prioritized based on time, device, location, and performance — all from a single shareable URL.

---

## Features

### Authentication
- Secure user registration and login
- JWT-based authentication
- Protected dashboard routes

### Smart Link Hubs
- Multiple hubs per user
- Public hub URLs at `/h/:slug`
- Enable or disable hubs anytime

### Rule-Based Link Display
Links can be shown or prioritized based on:
- Device (mobile, desktop, tablet)
- Time (hours, days)
- Geography (country-based)
- Performance (click-through rate, clicks)

### Analytics
- Hub impressions
- Link clicks
- Device and country breakdown
- Performance-based ranking

### URL Shortener
- Short redirect URLs at `/s/:slug`
- Click tracking before redirect

### Frontend
- React + TypeScript
- SPA routing with React Router
- Responsive, minimal UI

---

## Architecture Overview

Frontend (React SPA)
- Handles `/h/:slug` public pages
- User dashboard and UI
- Communicates with backend APIs

Backend (Express)
- `/api/*` REST APIs
- `/s/:slug` redirect service
- `/health` health check

Database (PostgreSQL via Prisma)
- Users
- Hubs
- Links
- Rules
- Analytics

---

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- React Router

Backend:
- Node.js
- Express (ESM)
- Prisma ORM
- PostgreSQL
- JWT Authentication

Deployment:
- Render (Frontend: Static Site, Backend: Web Service)
- Managed PostgreSQL

---

## Getting Started (Local Development)

1. Clone the repository:
    `git clone https://github.com/adarsh290/JPD-Hackthon.git`
    `cd JPD-Hackthon`
2. Backend setup:
    `cd backend`
    `npm install`

Create `.env`:
    `DATABASE_URL=postgresql://...`
    `JWT_SECRET=your_super_secret_key`
    `PORT=3000`
    `FRONTEND_URL=http://localhost:5173`
    `NODE_ENV=development`

Run Prisma:
    `npx prisma generate`
    `npx prisma migrate dev`

Start backend:
    `npm run dev`

3. Frontend setup:
    `cd frontend`
    `npm install`

Create `.env`:
    `VITE_API_URL=http://localhost:3000`


Start frontend:
    `npm run dev`

Frontend runs at:
    `http://localhost:5173`

---

## Production Notes

- `/h/:slug` routes are handled by React Router
- SPA fallback must be enabled on the frontend hosting service
- Backend only handles `/api/*`, `/s/*`, and `/health`

---

## Testing

This project utilizes a robust automated testing suite alongside manual verification steps.

### Automated Testing Status

**Backend:**
- **Frameworks:** Jest for unit and integration testing, and Supertest for API endpoint testing.
- **Coverage:**
    - Unit and integration tests are implemented for core services (`authService.ts`, `linkService.ts`, `resolverService.ts`).
    - API endpoint tests are implemented for key controllers (`authController.ts`, `resolverController.ts`, `hubRoutes.ts`).

**Frontend:**
- **Frameworks:** Vitest for component testing.
- **Coverage:**
    - Component tests are being explored and implemented (e.g., `Button.test.tsx`).
    - Exploration for End-to-End (E2E) tests is ongoing.

**Areas for Future Enhancement:**
- Comprehensive E2E testing.
- Detailed frontend error handling and UX feedback mechanism tests.
- Performance and security testing.

---

- Visit public hubs at `/h/<hub-slug>`
- View analytics in the dashboard
- Test short links via `/s/<short-slug>`

---

## Project Status

- Core features implemented
- Deployed on Render
- Production-ready architecture

---

## Author

Built by Adarsh Singh  
Hackathon project focused on clean architecture and real-world deployment.

---

## License

Open for learning and demonstration purposes.
