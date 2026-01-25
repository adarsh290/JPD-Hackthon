# Quick Start Guide

Get the Smart Link Hub backend running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- npm or yarn

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A strong secret key (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

## Step 3: Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Step 4: (Optional) Seed Database

```bash
npm run prisma:seed
```

This creates a test user:
- Email: `test@example.com`
- Password: `password123`
- Demo hub: `demo-hub`

## Step 5: Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Step 6: Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Resolve Hub (Public):**
```bash
curl http://localhost:3000/api/resolve/demo-hub
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Read [API.md](./API.md) for API reference
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Troubleshooting

**Database connection error:**
- Verify PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Test connection: `psql $DATABASE_URL`

**Port already in use:**
- Change PORT in `.env`
- Or kill the process using port 3000

**Prisma errors:**
- Run `npm run prisma:generate` again
- Check database permissions
- Verify schema.prisma syntax

## Support

For issues, check the main [README.md](./README.md) or open an issue.
