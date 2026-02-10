import request from 'supertest';
import app from '../../src/server';
import { authService } from '../../src/services/authService';

jest.mock('../../src/services/authService', () => ({
  __esModule: true,
  authService: {
    register: jest.fn(),
    login: jest.fn(),
  },
}));

// Mock middleware to bypass rate limiter and validation
jest.mock('../../src/middleware/rateLimiter', () => ({
  __esModule: true,
  authLimiter: (req, res, next) => next(),
}));

jest.mock('../../src/utils/validation', () => ({
  __esModule: true,
  validate: () => (req, res, next) => next(),
  registerSchema: {},
  loginSchema: {},
}));

describe('Auth API endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/register returns 201 and data', async () => {
    const mockResult = { user: { id: '1', email: 'test@example.com' }, token: 'abc' };
    // @ts-ignore
    authService.register.mockResolvedValue(mockResult);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Pass123' })
      .expect(201);

    expect(res.body).toMatchObject({ success: true, data: mockResult });
    expect(authService.register).toHaveBeenCalled();
  });

  it('POST /api/auth/login returns 200 and data', async () => {
    const mockResult = { user: { id: '1', email: 'test@example.com' }, token: 'def' };
    // @ts-ignore
    authService.login.mockResolvedValue(mockResult);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Pass123' })
      .expect(200);

    expect(res.body).toMatchObject({ success: true, data: mockResult });
    expect(authService.login).toHaveBeenCalled();
  });
});
