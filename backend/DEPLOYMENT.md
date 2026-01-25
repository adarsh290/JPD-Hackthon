# Deployment Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start server**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## Production Deployment

### 1. Environment Setup

Create a `.env` file with production values:

```env
DATABASE_URL="postgresql://user:password@host:5432/smartlinkhub?schema=public"
JWT_SECRET="<generate-strong-secret>"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://your-frontend-domain.com"
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Database Setup

**Using Prisma Migrations:**
```bash
npm run prisma:generate
npx prisma migrate deploy
```

**Or manually run SQL:**
```bash
psql -U postgres -d smartlinkhub -f prisma/migrations/migration.sql
```

### 3. Build Application

```bash
npm run build
```

### 4. Process Management

**Using PM2:**
```bash
npm install -g pm2
pm2 start dist/server.js --name smart-link-hub
pm2 save
pm2 startup
```

**Using systemd:**
Create `/etc/systemd/system/smart-link-hub.service`:
```ini
[Unit]
Description=Smart Link Hub API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable smart-link-hub
sudo systemctl start smart-link-hub
```

### 5. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL/HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 7. Database Connection Pooling

For high-traffic applications, consider using PgBouncer or connection pooling in your database configuration.

### 8. Monitoring

- Set up logging (Winston, Pino)
- Configure health checks
- Set up error tracking (Sentry)
- Monitor database performance

## Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Build and run:
```bash
docker build -t smart-link-hub .
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name smart-link-hub \
  smart-link-hub
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` |
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | No | `http://localhost:5173` |

## Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database credentials secured
- [ ] Environment variables not committed
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Database backups enabled

## Troubleshooting

**Database connection issues:**
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules
- Test connection: `psql $DATABASE_URL`

**JWT errors:**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure token format is correct

**CORS errors:**
- Verify CORS_ORIGIN matches frontend URL
- Check for trailing slashes
- Ensure credentials are handled correctly

## Performance Optimization

1. **Database Indexing**: Already configured in Prisma schema
2. **Connection Pooling**: Configure in DATABASE_URL or use PgBouncer
3. **Caching**: Consider Redis for frequently accessed data
4. **CDN**: Use CDN for static assets (if any)
5. **Load Balancing**: Use multiple instances behind a load balancer
