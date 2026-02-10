import { resolverService } from '../../services/resolverService';
import prisma from '../../config/database';
import { sortLinksByRules } from '../../services/rulesEngine';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    hub: { findFirst: jest.fn() },
    link: { findMany: jest.fn() },
    analytics: { create: jest.fn() },
  },
}));

jest.mock('../../services/rulesEngine', () => ({
  __esModule: true,
  sortLinksByRules: jest.fn(),
}));

const mockContext = {
  deviceType: 'desktop' as const,
  userAgent: 'test-agent',
  ipAddress: '127.0.0.1',
  country: 'US',
  timestamp: new Date(),
};

describe('ResolverService.resolve', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns hub and sorted links when hub exists', async () => {
    // Mock hub lookup
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue({ id: 1, title: 'Test Hub', slug: 'test-hub' });
    // Mock link retrieval
    // @ts-ignore
    prisma.link.findMany.mockResolvedValue([
      { id: 10, title: 'Link A', url: 'https://a.com', isActive: true, rules: [], _count: { analytics: 0 } },
      { id: 20, title: 'Link B', url: 'https://b.com', isActive: true, rules: [], _count: { analytics: 0 } },
    ]);
    // Mock sorting to return links in specific order
    // @ts-ignore
    sortLinksByRules.mockImplementation((links) => links.reverse()); // reverse order

    const result = await resolverService.resolve('test-hub', mockContext);

    expect(prisma.hub.findFirst).toHaveBeenCalledWith({
      where: { slug: 'test-hub', isActive: true },
      select: { id: true, title: true, slug: true },
    });
    expect(prisma.link.findMany).toHaveBeenCalled();
    expect(prisma.analytics.create).toHaveBeenCalled(); // trackVisit
    expect(sortLinksByRules).toHaveBeenCalled();
    expect(result).toEqual({
      hub: { id: 1, title: 'Test Hub', slug: 'test-hub' },
      links: [
        { id: 20, title: 'Link B', url: 'https://b.com', position: undefined },
        { id: 10, title: 'Link A', url: 'https://a.com', position: undefined },
      ],
    });
  });

  it('throws AppError when hub not found', async () => {
    // @ts-ignore
    prisma.hub.findFirst.mockResolvedValue(null);

    await expect(resolverService.resolve('missing', mockContext)).rejects.toThrow(AppError);
  });
});
