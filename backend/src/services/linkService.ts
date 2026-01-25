import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateLinkData {
  hubId: number;
  title: string;
  url: string;
  isActive?: boolean;
  priorityScore?: number;
}

export interface CreateRuleData {
  type: string;
  value: Record<string, unknown>;
}

export class LinkService {
  async verifyOwnership(userId: string, linkId: number): Promise<void> {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { hub: { select: { userId: true } } },
    });

    if (!link || link.hub.userId !== userId) {
      throw new AppError(404, 'Link not found or access denied');
    }
  }

  async createLink(userId: string, data: CreateLinkData) {
    // Verify hub ownership
    const hub = await prisma.hub.findFirst({
      where: { id: data.hubId, userId },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    return await prisma.link.create({
      data: {
        hubId: data.hubId,
        title: data.title,
        url: data.url,
        isActive: data.isActive ?? true,
        priorityScore: data.priorityScore ?? 0,
      },
      include: {
        rules: true,
        _count: { select: { analytics: true } },
      },
    });
  }

  async updateLink(userId: string, linkId: number, data: Partial<CreateLinkData>) {
    await this.verifyOwnership(userId, linkId);

    return await prisma.link.update({
      where: { id: linkId },
      data,
      include: {
        rules: true,
        _count: { select: { analytics: true } },
      },
    });
  }

  async deleteLink(userId: string, linkId: number): Promise<void> {
    await this.verifyOwnership(userId, linkId);
    await prisma.link.delete({ where: { id: linkId } });
  }

  async createRule(userId: string, linkId: number, ruleData: CreateRuleData) {
    await this.verifyOwnership(userId, linkId);

    return await prisma.rule.create({
      data: {
        linkId,
        type: ruleData.type,
        value: ruleData.value as object,
      },
    });
  }

  async updateRule(userId: string, linkId: number, ruleId: number, ruleData: CreateRuleData) {
    await this.verifyOwnership(userId, linkId);

    return await prisma.rule.update({
      where: { id: ruleId },
      data: {
        type: ruleData.type,
        value: ruleData.value as object,
      },
    });
  }

  async deleteRule(userId: string, linkId: number, ruleId: number): Promise<void> {
    await this.verifyOwnership(userId, linkId);
    await prisma.rule.delete({ where: { id: ruleId } });
  }
}

export const linkService = new LinkService();