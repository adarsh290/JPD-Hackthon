import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import resolverRoutes from './routes/resolverRoutes';
import linkRoutes from './routes/linkRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import hubRoutes from './routes/hubRoutes';
import qrRoutes from './routes/qrRoutes';
import shortUrlRoutes from './routes/shortUrlRoutes';

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(helmet());

// CORS - Allow multiple origins for development and production
const allowedOrigins = [
  config.cors.origin,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:5173',
].filter(Boolean);

console.log('🔗 CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // Remove trailing slash for comparison
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
      
      if (normalizedAllowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resolve', resolverRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api', qrRoutes);

// Short URL routes (no /api prefix)
app.use('/s', shortUrlRoutes);

// Serve static files from frontend build (production only)
// Replace your existing static file block with this corrected version:

if (config.nodeEnv === 'production') {
  // Go up from backend/src to backend/, then up to root, then down to dist
  const frontendPath = path.resolve(__dirname, '../../dist');
  
  console.log('📁 Serving static files from root dist:', frontendPath);
  app.use(express.static(frontendPath));
  
  // SPA fallback - serve index.html for ALL remaining routes
  // This must be after all API routes and static files
  app.use((_req: any, res: any) => {
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err: any) => {
      if (err) {
        console.error('❌ ERROR: Could not find index.html at:', indexPath);
        res.status(500).send('Frontend build not found at: ' + indexPath);
      }
    });
  });
} else {
  // Development: 404 handler for all routes
  app.use((_req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
      },
    });
  });
}
// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
export default app;
