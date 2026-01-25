# Smart Link Hub - Production Setup Guide

## Environment Configuration

### Required Environment Variables

The application uses Zod validation to ensure all required environment variables are properly configured:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Configuration (Required)
JWT_SECRET="minimum-32-character-secret-for-production-security"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT="3000"
NODE_ENV="production"

# Frontend URL for CORS (Required - must be valid URL)
FRONTEND_URL="https://yourdomain.com"
```

### Environment Validation

The application will **fail to start** if:
- `DATABASE_URL` is missing or empty
- `JWT_SECRET` is less than 32 characters
- `FRONTEND_URL` is not a valid URL
- `NODE_ENV` is not one of: `development`, `production`, `test`

## GeoIP Integration

The application now includes production-ready GeoIP detection using the ipapi.co service:

### Features
- **Automatic country detection** for all hub visitors
- **Timeout protection** (3-second limit)
- **Graceful fallbacks** for API failures
- **Private network detection** (localhost, 192.168.x.x, 10.x.x.x)
- **Rate limiting awareness** (respects ipapi.co limits)

### Monitoring
- Failed GeoIP requests are logged as warnings
- Analytics entries use `'unknown'` for failed detections
- No blocking behavior - app continues if GeoIP fails

## Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP  
- **Public resolver**: 60 requests per minute per IP

### Input Validation
- All API endpoints use Zod schema validation
- Standardized error responses via `AppError` class
- SQL injection protection via Prisma ORM

### Authentication
- JWT tokens with configurable expiration
- Bcrypt password hashing (12 rounds)
- User verification on each authenticated request

## Database Setup

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE smartlinkhub;
   ```

2. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

3. **Generate Prisma client**:
   ```bash
   npm run prisma:generate
   ```

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Ensure JWT_SECRET is at least 32 characters
- [ ] Configure DATABASE_URL for production database
- [ ] Set FRONTEND_URL to production domain
- [ ] Run database migrations
- [ ] Test GeoIP functionality
- [ ] Verify rate limiting configuration
- [ ] Test authentication flow
- [ ] Monitor application logs for GeoIP warnings

## Performance Considerations

### GeoIP Service
- ipapi.co provides 1,000 free requests per month
- Consider upgrading for high-traffic applications
- Alternative services: MaxMind GeoIP2, ip-api.com

### Database Optimization
- Indexes are configured for hub slugs, user IDs, and analytics queries
- Consider connection pooling for high-traffic deployments
- Monitor query performance in production

### Caching Recommendations
- Consider Redis for session storage in multi-instance deployments
- Cache GeoIP results for repeat visitors (optional)
- Implement CDN for static assets

## Monitoring & Logging

The application logs important events:
- Environment validation errors (startup)
- GeoIP API failures (warnings)
- Authentication failures
- Database connection issues
- Unhandled errors (with stack traces in development)

Set up monitoring for:
- Response times on `/api/resolve/:slug` endpoint
- GeoIP API success rates
- Database query performance
- Authentication success/failure rates