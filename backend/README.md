# Smart Link Hub - Backend API

Production-ready Node.js/Express backend with PostgreSQL for the Smart Link Hub application.

## Features

- ✅ **JWT Authentication** - Secure user registration and login
- ✅ **Link Hub Management** - Create and manage link hubs with unique slugs
- ✅ **Smart Link Resolver** - Context-aware link filtering and sorting
- ✅ **Rule Engine** - Time-based, device-based, geo-based, and performance-based rules
- ✅ **Analytics** - Comprehensive click tracking and analytics
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Input Validation** - Zod-based validation
- ✅ **Modular Architecture** - Clean separation of concerns

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/smartlinkhub?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:5173"
   ```

4. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "displayName": "John Doe"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Link Hubs

- `GET /api/hubs` - Get all user's hubs (Auth required)
- `GET /api/hubs/:id` - Get single hub (Auth required)
- `POST /api/hubs` - Create hub (Auth required)
- `PATCH /api/hubs/:id` - Update hub (Auth required)
- `DELETE /api/hubs/:id` - Delete hub (Auth required)

### Links

- `GET /api/links/hub/:hubId` - Get all links for a hub (Auth required)
- `POST /api/links` - Create link (Auth required)
- `PATCH /api/links/:id` - Update link (Auth required)
- `DELETE /api/links/:id` - Delete link (Auth required)
- `POST /api/links/hub/:hubId/reorder` - Reorder links (Auth required)
- `PUT /api/links/:linkId/rule` - Update link rules (Auth required)

### Resolver (Public)

- `GET /api/resolve/:slug` - Resolve hub and get optimized links
  - Automatically detects device type, IP, user agent
  - Applies rules and returns sorted links

### Analytics

- `GET /api/analytics/hub/:hubId` - Get hub analytics (Auth required)
  - Returns: total visits, total clicks, top/least performing links, clicks by device/country, recent clicks

- `POST /api/analytics/click/:hubId/:linkId` - Track link click (Public, rate limited)

## Rules Engine

The resolver uses a sophisticated rules engine to filter and sort links:

### Time-based Rules
```json
{
  "timeRules": {
    "start": "09:00",
    "end": "17:00",
    "timezone": "UTC",
    "days": [1, 2, 3, 4, 5] // Monday-Friday
  }
}
```

### Device-based Rules
```json
{
  "deviceRules": {
    "allowed": ["mobile", "desktop"],
    "priority": "mobile"
  }
}
```

### Geo-based Rules
```json
{
  "geoRules": {
    "allowed": ["US", "CA"],
    "blocked": ["XX"],
    "priority": "US"
  }
}
```

### Performance-based Rules
```json
{
  "performanceRules": {
    "minClicks": 10,
    "maxClicks": 1000,
    "priority": "high",
    "autoSort": true
  }
}
```

## Database Schema

- **users** - User accounts with JWT authentication
- **link_hubs** - Link hubs with unique slugs
- **links** - Links associated with hubs
- **rules** - JSON-based rules for links (time, device, geo, performance)
- **link_clicks** - Analytics for link clicks
- **hub_visits** - Analytics for hub visits

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (database, env)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, error handling, rate limiting)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions (validation, context detection)
│   └── server.ts         # Express app entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env.example         # Environment variables template
└── package.json
```

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret key (use crypto.randomBytes)
- `NODE_ENV=production`
- `CORS_ORIGIN` - Your frontend URL

### Build and Deploy

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run database migrations**
   ```bash
   npm run prisma:migrate deploy
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Recommended Production Setup

- Use a process manager (PM2, systemd)
- Set up reverse proxy (Nginx)
- Enable HTTPS
- Configure database connection pooling
- Set up monitoring and logging
- Use environment-specific configuration

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Zod
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ SQL injection protection (Prisma)
- ✅ Error handling without exposing internals

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Resolver endpoint**: 60 requests per minute

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```

## Testing

```bash
# Run tests (when implemented)
npm test
```

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
