# Smart Link Hub - Render Deployment Guide

This guide covers deploying the Smart Link Hub monorepo to Render using the Blueprint configuration.

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Prepare your production environment variables

## Deployment Methods

### Option 1: Blueprint Deployment (Recommended)

The `render.yaml` file in the root directory contains a complete Blueprint configuration that will automatically create:

- **Backend Web Service** (Node.js)
- **Frontend Static Site** (React/Vite)
- **PostgreSQL Database**

#### Steps:

1. **Connect Repository to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your Smart Link Hub code

2. **Configure Blueprint**:
   - Render will automatically detect the `render.yaml` file
   - Review the services that will be created:
     - `smart-link-hub-backend` (Web Service)
     - `smart-link-hub-frontend` (Static Site)
     - `smart-link-hub-db` (PostgreSQL Database)

3. **Deploy**:
   - Click "Apply" to start the deployment
   - Render will automatically:
     - Create the PostgreSQL database
     - Deploy the backend with database migrations
     - Build and deploy the frontend
     - Configure environment variables and service connections

4. **Post-Deployment**:
   - The backend will be available at: `https://smart-link-hub-backend.onrender.com`
   - The frontend will be available at: `https://smart-link-hub-frontend.onrender.com`
   - Database migrations will run automatically

### Option 2: Manual Deployment

If you prefer to deploy services individually:

#### 1. Deploy Database

1. Go to Render Dashboard → "New" → "PostgreSQL"
2. Configure:
   - **Name**: `smart-link-hub-db`
   - **Database**: `smart_link_hub`
   - **User**: `smart_link_hub_user`
   - **Plan**: Starter (or higher for production)
3. Note the connection string for the backend configuration

#### 2. Deploy Backend

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `smart-link-hub-backend`
   - **Runtime**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Plan**: Starter (or higher)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=[Your PostgreSQL connection string]
   JWT_SECRET=[Generate a secure 32+ character secret]
   FRONTEND_URL=[Will be set after frontend deployment]
   PORT=10000
   ```

#### 3. Deploy Frontend

1. Go to Render Dashboard → "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `smart-link-hub-frontend`
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=[Your backend service URL]
   ```

5. **Update Backend FRONTEND_URL**:
   - Go back to your backend service settings
   - Update `FRONTEND_URL` with your frontend service URL

## Environment Variables Reference

### Backend (.env)
```bash
# Required
DATABASE_URL="postgresql://username:password@hostname:port/database"
JWT_SECRET="your-production-jwt-secret-32-characters-minimum"
FRONTEND_URL="https://your-frontend-domain.onrender.com"
NODE_ENV="production"
PORT="10000"

# Optional
JWT_EXPIRES_IN="7d"
```

### Frontend (.env)
```bash
# Required
VITE_API_URL="https://your-backend-domain.onrender.com"

# If using Supabase
VITE_SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

## Post-Deployment Configuration

### 1. Database Setup

The backend automatically runs database migrations on deployment. If you need to seed the database:

1. Go to your backend service in Render
2. Open the "Shell" tab
3. Run: `npm run prisma:seed`

### 2. Custom Domain (Optional)

1. **Backend**: Go to service settings → "Custom Domains"
2. **Frontend**: Go to service settings → "Custom Domains"
3. Add your domain and configure DNS

### 3. SSL/HTTPS

Render automatically provides SSL certificates for all services.

## Monitoring & Logs

### Backend Logs
- Go to your backend service → "Logs" tab
- Monitor for startup errors, database connections, and API requests

### Frontend Logs
- Go to your frontend service → "Logs" tab
- Monitor build process and deployment status

### Database Monitoring
- Go to your PostgreSQL service → "Metrics" tab
- Monitor connections, queries, and performance

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify `DATABASE_URL` is correctly set
   - Ensure database service is running
   - Check database connection limits

2. **CORS Errors**:
   - Verify `FRONTEND_URL` matches your frontend domain
   - Check that both services are deployed and accessible

3. **Build Failures**:
   - Check build logs for specific error messages
   - Verify all dependencies are listed in `package.json`
   - Ensure Node.js version compatibility

4. **Environment Variable Issues**:
   - Verify all required environment variables are set
   - Check for typos in variable names
   - Ensure sensitive values are properly escaped

### Performance Optimization

1. **Database**:
   - Upgrade to higher plan for production workloads
   - Monitor query performance
   - Consider connection pooling for high traffic

2. **Backend**:
   - Upgrade to higher plan for better performance
   - Monitor memory and CPU usage
   - Consider caching for frequently accessed data

3. **Frontend**:
   - Optimize bundle size
   - Use CDN for static assets
   - Implement proper caching headers

## Security Considerations

1. **JWT Secret**: Use a cryptographically secure random string (32+ characters)
2. **Database**: Use strong passwords and restrict access
3. **CORS**: Configure specific origins instead of wildcards
4. **Environment Variables**: Never commit sensitive values to version control
5. **HTTPS**: Ensure all communication uses HTTPS (automatic on Render)

## Scaling

### Horizontal Scaling
- Render automatically handles load balancing
- Consider upgrading to higher plans for better performance

### Database Scaling
- Monitor database performance and connections
- Upgrade PostgreSQL plan as needed
- Consider read replicas for high-read workloads

## Backup & Recovery

### Database Backups
- Render automatically creates daily backups for PostgreSQL
- Manual backups can be created from the database dashboard
- Consider implementing application-level backup strategies

### Code Deployment
- Use Git tags for release management
- Implement proper CI/CD practices
- Test deployments in staging environment first

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Project Issues**: Create issues in your GitHub repository