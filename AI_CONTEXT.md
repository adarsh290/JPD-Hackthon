# Smart Link Hub - AI Context & Architecture

Welcome to the Smart Link Hub workspace. **Please read this document carefully before making any structural changes or adding new features.**

## 🏗️ Architecture & Monorepo Structure

This project is structured as an **npm Monorepo Workspaces**.
- `packages/shared/` - Contains the shared TS types and Zod schemas (`index.ts`). **This is the single source of truth for validation.**
- `backend/` - Contains the Express.js + Prisma + PostgreSQL backend API.
- `src/` - Contains the React + Vite + Tailwind CSS frontend application (running from the root `package.json`).

*Note: Originally this project used Supabase Client locally in the React app, but it was fully ripped out and replaced with standard REST APIs that point to our custom Express backend. DO NOT use `@supabase/supabase-js`.*

## 💻 Tech Stack
-   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, React Query (`@tanstack/react-query`).
-   **Backend**: Node.js, Express.js, TypeScript, Prisma (ORM), PostgreSQL.
-   **Validation**: Zod (End-to-End type safety via `packages/shared`).
-   **Auth**: Custom JWT Auth stored in Frontend `localStorage`. **No 3rd-party auth providers**.

## 🔌 Data Flow & Conventions
-   **API Requests**: The frontend uses `fetch` to communicate with the backend. See `src/hooks/useAuth.tsx` and `src/hooks/useHubs.tsx` for examples. 
-   **Headers**: Bearer tokens for authenticated users must be passed in `Authorization` headers manually.
-   **Routing**: The backend APIs currently live entirely under `/api/...` (e.g. `/api/auth/login`, `/api/hubs`).

## 🗄️ Database Models (Prisma)
The database focuses on tracking Hubs (profiles) and Links, along with robust Analytics tracking.

-   **User**: `id`, `email`, `password_hash`, `displayName`.
-   **Hub**: A collection of links associated with a user. Has a `slug` for public routing.
-   **Link**: An individual URL. Contains a `hub_id`, `url`, `title`, and `priorityScore`. 
-   **Rule**: Used for advanced link rendering (e.g., Geo-blocking, Time schedules).
-   **Analytics & DailyAnalytics**: Records click-through rates and visits sliced by device, country, and time.

## 🚀 Running the App Locally
1. Ensure your Postgres Database is running and the connection string is valid in `backend/.env`.
2. Ensure you have run `npm run prisma:migrate --workspace=backend`.
3. In the root directory, run `npm install`.
4. Run `npm run build --workspace=@smart-link-hub/shared` to compile types.
5. Boot the backend server via `npm run dev` inside `backend/`.
6. Boot the frontend server via `npm run dev` at the root.
