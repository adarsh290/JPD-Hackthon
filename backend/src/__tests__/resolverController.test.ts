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

jest.mock('../../services/resolverService', () => ({
  __esModule: true,
  resolverService: {
    resolve: jest.fn().mockResolvedValue({ hub: { id: 1, title: 'Test', slug: 'test' }, links: [] }),
  },
}));

const request = require('supertest');
const app = require('../../src/server').default;

describe('Resolver controller routes (placeholder)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns resolved hub data', async () => {
    const res = await request(app).get('/api/resolve/some-slug').expect(200);
    expect(res.body).toHaveProperty('hub');
    expect(res.body).toHaveProperty('links');
  });
});
