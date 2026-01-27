import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import resolverRoutes from './routes/resolverRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import hubRoutes from './routes/hubRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import shortUrlRoutes from './routes/shortUrlRoutes.js';

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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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
  
  // Handle SPA routing - catch all non-API routes and serve index.html
  app.use((req: any, res: any, next: any) => {
    // Skip API routes, short URLs, and health check
    if (req.path.startsWith('/api') || req.path.startsWith('/s') || req.path === '/health') {
      return next(); // Let it fall through to 404 handler
    }
    
    const indexPath = path.join(frontendPath, 'index.html');
    
    // Use a callback to catch if index.html is actually missing
    return res.sendFile(indexPath, (err: any) => {
      if (err) {
        console.error('❌ ERROR: Could not find index.html at:', indexPath);
        // This helps you see the wrong path directly in the browser for debugging
        res.status(404).send('Frontend build not found at: ' + indexPath);
      }
    });
  });
  
  // 404 handler for API routes that weren't handled
  app.use((req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: { message: 'Route not found' },
    });
  });
} else {
  // Development: 404 handler for API routes only
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
