import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

// Validate required environment variables
if (!config.database.url) {
  throw new Error('DATABASE_URL is required');
}

if (config.jwt.secret === 'change-me-in-production' && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
