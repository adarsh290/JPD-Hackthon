# SmartLinkHub — Backend API

Express + Prisma + PostgreSQL backend for the SmartLinkHub platform.

## Features

- ✅ **JWT Authentication** — bcrypt password hashing, token-based sessions
- ✅ **Link Hub CRUD** — Create, manage, and delete link hubs with unique slugs
- ✅ **Smart Resolver** — Context-aware link filtering and sorting per visitor
- ✅ **Rule Engine** — Time, device, geo, and performance-based rules
- ✅ **Pulse Analytics** — Click/visit tracking with daily aggregation
- ✅ **Public Stats** — Live platform metrics for the landing page
- ✅ **Branded QR Codes** — Customizable colors, downloadable PNGs
- ✅ **Short URLs** — `/s/:code` redirects
- ✅ **Gated Links** — Password-protected link access
- ✅ **Real-Time** — Socket.io event broadcasting for live dashboards
- ✅ **CSV Export** — Download analytics as CSV
- ✅ **Rate Limiting** — Per-endpoint protection
- ✅ **Input Validation** — Zod schemas (shared with frontend)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL 14+ with Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-Time | Socket.io |
| Validation | Zod (via `@smart-link-hub/shared`) |
| Security | Helmet, CORS, rate limiting |

## Setup

```bash
cd backend
npm install
cp .env.example .env   # Edit with your PostgreSQL credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev             # Starts on http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Secret key (32+ chars in production) |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `FRONTEND_URL` | `http://localhost:8081` | CORS origin |

## API Routes

### Authentication (Public)
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Register user `{ email, password, displayName? }` |
| `POST` | `/api/auth/login` | Login → `{ user, token }` |

### Hubs (Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/hubs` | List user's hubs (includes `_count` for links/analytics) |
| `GET` | `/api/hubs/:id` | Get single hub |
| `POST` | `/api/hubs` | Create hub `{ title }` |
| `PATCH` | `/api/hubs/:id` | Update hub `{ title? }` |
| `DELETE` | `/api/hubs/:id` | Delete hub and all links |

### Links (Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/hubs/:hubId/links` | Get links for a hub |
| `POST` | `/api/links` | Create link |
| `PATCH` | `/api/links/:id` | Update link |
| `DELETE` | `/api/links/:id` | Delete link |

### Analytics
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/analytics/hub/:hubId` | ✅ | Hub analytics summary |
| `GET` | `/api/analytics/export/:hubId` | ✅ | Export as CSV |
| `POST` | `/api/analytics/click/:hubId/:linkId` | ❌ | Track click (rate-limited) |
| `POST` | `/api/analytics/click` | ❌ | Simple click tracking |

### Public Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/resolve/:slug` | Resolve hub → context-sorted links |
| `GET` | `/api/stats` | Live platform stats (landing page) |
| `GET` | `/api/hubs/:id/qr` | Generate branded QR code |
| `GET` | `/s/:shortCode` | Short URL redirect |
| `GET` | `/health` | Health check |

## Database Schema

```
users        →  id(uuid), email, password_hash, display_name
hubs         →  id(int), user_id, slug, title, is_active
links        →  id(int), hub_id, url, title, gate_type, gate_value, priority_score
rules        →  id(int), link_id, type, value(json)
analytics    →  id(int), link_id?, hub_id?, device, country, timestamp
daily_analytics → id(int), date, hub_id, link_id?, impressions, clicks, device/country breakdowns
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # env.ts, database.ts, socket.ts
│   ├── controllers/     # auth, hub, link, analytics, stats, resolver, qr, shortUrl
│   ├── middleware/      # auth.ts, errorHandler.ts, rateLimiter.ts
│   ├── routes/          # Route definitions per resource
│   ├── services/        # Business logic (analytics, auth, link, resolver)
│   ├── utils/           # contextDetector.ts, validation
│   └── server.ts        # Express app entry point
├── prisma/
│   └── schema.prisma    # PostgreSQL Prisma schema
├── scripts/             # Utility scripts
├── .env.example         # Environment template
└── package.json
```

## Development Commands

```bash
npm run dev             # Start with hot reload (tsx)
npm run build           # Compile TypeScript
npm start               # Run compiled output
npm test                # Run Jest tests
npm run prisma:generate # Regenerate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio GUI
```

## Security

- JWT auth with bcrypt password hashing
- Rate limiting: 5 req/15min (auth), 100/15min (API), 60/min (resolver)
- Helmet.js security headers
- Zod input validation
- Prisma SQL injection protection
- Error responses never expose internals

## License

MIT
