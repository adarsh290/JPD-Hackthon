process.env.DATABASE_URL = 'postgres://test';
process.env.JWT_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    hub: { findFirst: jest.fn() },
    link: { findMany: jest.fn() },
    analytics: { create: jest.fn() },
  },
}));

jest.mock('../../services/authService', () => ({
  __esModule: true,
  authService: {
    register: jest.fn().mockResolvedValue({ user: { id: '1', email: 'test@example.com' }, token: 'signed-token' }),
    login: jest.fn().mockResolvedValue({ user: { id: '1', email: 'test@example.com' }, token: 'signed-token' }),
  },
}));

jest.mock('../../middleware/rateLimiter', () => ({
  __esModule: true,
  authLimiter: (req, res, next) => next(),
}));

jest.mock('../../utils/validation', () => ({
  __esModule: true,
  validate: () => (req, res, next) => next(),
  registerSchema: {},
  loginSchema: {},
}));

const request = require('supertest');
const app = require('../../src/server').default;

describe('Auth controller routes (placeholder)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Pass123' })
      .expect(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('can login a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Pass123' })
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
