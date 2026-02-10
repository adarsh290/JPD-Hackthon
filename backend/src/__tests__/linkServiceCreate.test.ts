process.env.DATABASE_URL = 'postgres://test';
process.env.JWT_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    link: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    hub: { findFirst: jest.fn() },
    rule: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  },
}));

const { linkService } = require('../../services/linkService');
const prisma = require('../../config/database');

describe('LinkService createLink', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a link when hub exists', async () => {
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue({ id: 1 });
    // @ts-ignore
    prisma.link.create.mockResolvedValue({ id: 10, title: 'Link', url: 'https://example.com' });

    const data = { hubId: 1, title: 'Link', url: 'https://example.com' };
    const result = await linkService.createLink('user-123', data);
    expect(prisma.hub.findFirst).toHaveBeenCalledWith({ where: { id: data.hubId, userId: 'user-123' } });
    expect(prisma.link.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 10);
  });

  it('throws error when hub not owned', async () => {
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue(null);
    const data = { hubId: 99, title: 'Bad', url: 'https://bad.com' };
    await expect(linkService.createLink('user-123', data)).rejects.toThrow();
  });
});
