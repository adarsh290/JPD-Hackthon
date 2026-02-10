import { LinkService, CreateLinkData, CreateRuleData } from './linkService';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Mock external dependencies
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    link: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    hub: {
      findFirst: jest.fn(),
    },
    rule: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../middleware/errorHandler', () => {
  class MockAppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      Object.setPrototypeOf(this, MockAppError.prototype);
    }
  }
  return {
    AppError: MockAppError,
  };
});

describe('LinkService', () => {
  let linkService: LinkService;
  const userId = 'user-id-123';
  const linkId = 1;
  const hubId = 10;
  const ruleId = 100;

  beforeEach(() => {
    linkService = new LinkService();
    jest.clearAllMocks();
  });

  describe('verifyOwnership', () => {
    it('should not throw if user owns the link', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });

      await expect(linkService.verifyOwnership(userId, linkId)).resolves.toBeUndefined();
      expect(prisma.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
        include: { hub: { select: { userId: true } } },
      });
    });

    it('should throw AppError if link not found', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(linkService.verifyOwnership(userId, linkId)).rejects.toThrow(
        new AppError(404, 'Link not found or access denied')
      );
    });

    it('should throw AppError if user does not own the link', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId: 'another-user-id' },
      });

      await expect(linkService.verifyOwnership(userId, linkId)).rejects.toThrow(
        new AppError(404, 'Link not found or access denied')
      );
    });
  });

  describe('createLink', () => {
    const createLinkData: CreateLinkData = {
      hubId,
      title: 'Test Link',
      url: 'https://test.com',
    };
    const createdLink = { ...createLinkData, id: linkId, rules: [], _count: { analytics: 0 } };

    it('should successfully create a link if user owns the hub', async () => {
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue({ id: hubId, userId });
      (prisma.link.create as jest.Mock).mockResolvedValue(createdLink);

      const result = await linkService.createLink(userId, createLinkData);

      expect(prisma.hub.findFirst).toHaveBeenCalledWith({
        where: { id: hubId, userId },
      });
      expect(prisma.link.create).toHaveBeenCalledWith({
        data: {
          hubId: createLinkData.hubId,
          title: createLinkData.title,
          url: createLinkData.url,
          isActive: true,
          priorityScore: 0,
        },
        include: {
          rules: true,
          _count: { select: { analytics: true } },
        },
      });
      expect(result).toEqual(createdLink);
    });

    it('should throw AppError if hub not found or access denied', async () => {
      (prisma.hub.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(linkService.createLink(userId, createLinkData)).rejects.toThrow(
        new AppError(404, 'Hub not found or access denied')
      );
      expect(prisma.link.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLink', () => {
    const updateData = { title: 'Updated Title' };
    const updatedLink = { id: linkId, title: 'Updated Title', url: 'https://test.com', rules: [], _count: { analytics: 0 } };

    beforeEach(() => {
      // Mock verifyOwnership to pass for update/delete tests
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });
    });

    it('should successfully update a link', async () => {
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);

      const result = await linkService.updateLink(userId, linkId, updateData);

      expect(prisma.link.update).toHaveBeenCalledWith({
        where: { id: linkId },
        data: updateData,
        include: {
          rules: true,
          _count: { select: { analytics: true } },
        },
      });
      expect(result).toEqual(updatedLink);
    });

    it('should throw AppError if ownership verification fails', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null); // Simulate verifyOwnership failure

      await expect(linkService.updateLink(userId, linkId, updateData)).rejects.toThrow(AppError);
      expect(prisma.link.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteLink', () => {
    beforeEach(() => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });
    });

    it('should successfully delete a link', async () => {
      (prisma.link.delete as jest.Mock).mockResolvedValue({});

      await expect(linkService.deleteLink(userId, linkId)).resolves.toBeUndefined();

      expect(prisma.link.delete).toHaveBeenCalledWith({ where: { id: linkId } });
    });

    it('should throw AppError if ownership verification fails', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null); // Simulate verifyOwnership failure

      await expect(linkService.deleteLink(userId, linkId)).rejects.toThrow(AppError);
      expect(prisma.link.delete).not.toHaveBeenCalled();
    });
  });

  describe('createRule', () => {
    const createRuleData: CreateRuleData = { type: 'device', value: { allowed: ['mobile'] } };
    const createdRule = { id: ruleId, linkId, ...createRuleData, value: createRuleData.value as object };

    beforeEach(() => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });
    });

    it('should successfully create a rule', async () => {
      (prisma.rule.create as jest.Mock).mockResolvedValue(createdRule);

      const result = await linkService.createRule(userId, linkId, createRuleData);

      expect(prisma.rule.create).toHaveBeenCalledWith({
        data: {
          linkId,
          type: createRuleData.type,
          value: createRuleData.value as object,
        },
      });
      expect(result).toEqual(createdRule);
    });

    it('should throw AppError if ownership verification fails', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(linkService.createRule(userId, linkId, createRuleData)).rejects.toThrow(AppError);
      expect(prisma.rule.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRule', () => {
    const updateRuleData: CreateRuleData = { type: 'geo', value: { allowed: ['US'] } };
    const updatedRule = { id: ruleId, linkId, ...updateRuleData, value: updateRuleData.value as object };

    beforeEach(() => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });
    });

    it('should successfully update a rule', async () => {
      (prisma.rule.update as jest.Mock).mockResolvedValue(updatedRule);

      const result = await linkService.updateRule(userId, linkId, ruleId, updateRuleData);

      expect(prisma.rule.update).toHaveBeenCalledWith({
        where: { id: ruleId },
        data: {
          type: updateRuleData.type,
          value: updateRuleData.value as object,
        },
      });
      expect(result).toEqual(updatedRule);
    });

    it('should throw AppError if ownership verification fails', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(linkService.updateRule(userId, linkId, ruleId, updateRuleData)).rejects.toThrow(AppError);
      expect(prisma.rule.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    beforeEach(() => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue({
        id: linkId,
        hub: { userId },
      });
    });

    it('should successfully delete a rule', async () => {
      (prisma.rule.delete as jest.Mock).mockResolvedValue({});

      await expect(linkService.deleteRule(userId, linkId, ruleId)).resolves.toBeUndefined();

      expect(prisma.rule.delete).toHaveBeenCalledWith({ where: { id: ruleId } });
    });

    it('should throw AppError if ownership verification fails', async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(linkService.deleteRule(userId, linkId, ruleId)).rejects.toThrow(AppError);
      expect(prisma.rule.delete).not.toHaveBeenCalled();
    });
  });
});
