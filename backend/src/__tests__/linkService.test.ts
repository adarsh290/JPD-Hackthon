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


const mockUserId = 'user-123';

describe('LinkService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a link when hub exists', async () => {
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue({ id: 1 });
    // @ts-ignore
    prisma.link.create.mockResolvedValue({ id: 10, title: 'Link', url: 'https://example.com' });

    const data = { hubId: 1, title: 'Link', url: 'https://example.com' };
    const result = await linkService.createLink(mockUserId, data);

    expect(prisma.hub.findFirst).toHaveBeenCalledWith({ where: { id: data.hubId, userId: mockUserId } });
    expect(prisma.link.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 10);
  });

  it('throws AppError when hub not owned', async () => {
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue(null);
    const data = { hubId: 99, title: 'Bad', url: 'https://bad.com' };
    await expect(linkService.createLink(mockUserId, data)).rejects.toThrow();
  });
});
