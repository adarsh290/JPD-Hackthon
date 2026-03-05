import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer } from 'http';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './config/socket';

// Routes
import authRoutes from './routes/authRoutes';
import resolverRoutes from './routes/resolverRoutes';
import linkRoutes from './routes/linkRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import hubRoutes from './routes/hubRoutes';
import qrRoutes from './routes/qrRoutes';
import shortUrlRoutes from './routes/shortUrlRoutes';
import { getPublicStats } from './controllers/statsController';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Security middleware
app.use(helmet());

// CORS - Unrestricted for debugging (Sledgehammer mode)
app.use(cors());

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
app.get('/api/stats', getPublicStats); // Public — must be before qrRoutes (which uses auth middleware on all /api/*)
app.use('/api', qrRoutes);

// Short URL routes (no /api prefix)
app.use('/s', shortUrlRoutes);

// Serve static files from frontend build (production only)
if (config.nodeEnv === 'production') {
  const frontendPath = path.resolve(__dirname, '../../dist');

  console.log('📁 Serving static files from root dist:', frontendPath);
  app.use(express.static(frontendPath));

  // SPA fallback - serve index.html for ALL remaining routes
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
const PORT = config.port || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
