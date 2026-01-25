import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { Link, Rule } from '@prisma/client';

export interface CreateLinkData {
  hubId: string;
  title: string;
  url: string;
  icon?: string;
  position?: number;
  isActive?: boolean;
}

export interface UpdateLinkData {
  title?: string;
  url?: string;
  icon?: string;
  position?: number;
  isActive?: boolean;
}

export interface CreateRuleData {
  timeRules?: any;
  deviceRules?: any;
  geoRules?: any;
  performanceRules?: any;
}

export class LinkService {
  async createLink(userId: string, data: CreateLinkData): Promise<Link> {
    // Verify hub ownership
    const hub = await prisma.linkHub.findFirst({
      where: {
        id: data.hubId,
        userId,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    // Get max position if not provided
    let position = data.position;
    if (position === undefined) {
      const maxPosition = await prisma.link.findFirst({
        where: { hubId: data.hubId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = (maxPosition?.position ?? -1) + 1;
    }

    return prisma.link.create({
      data: {
        ...data,
        position,
      },
    });
  }

  async updateLink(
    userId: string,
    linkId: string,
    data: UpdateLinkData
  ): Promise<Link> {
    // Verify ownership
    const link = await this.verifyOwnership(userId, linkId);

    return prisma.link.update({
      where: { id: linkId },
      data,
    });
  }

  async deleteLink(userId: string, linkId: string): Promise<void> {
    // Verify ownership
    await this.verifyOwnership(userId, linkId);

    await prisma.link.delete({
      where: { id: linkId },
    });
  }

  async reorderLinks(
    userId: string,
    hubId: string,
    linkPositions: { id: string; position: number }[]
  ): Promise<void> {
    // Verify hub ownership
    const hub = await prisma.linkHub.findFirst({
      where: {
        id: hubId,
        userId,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    // Update positions in transaction
    await prisma.$transaction(
      linkPositions.map(({ id, position }) =>
        prisma.link.update({
          where: { id },
          data: { position },
        })
      )
    );
  }

  async getLinks(userId: string, hubId: string): Promise<Link[]> {
    // Verify hub ownership
    const hub = await prisma.linkHub.findFirst({
      where: {
        id: hubId,
        userId,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    return prisma.link.findMany({
      where: { hubId },
      include: { rules: true },
      orderBy: { position: 'asc' },
    });
  }

  async updateRule(
    userId: string,
    linkId: string,
    ruleData: CreateRuleData
  ): Promise<Rule> {
    // Verify ownership
    await this.verifyOwnership(userId, linkId);

    // Upsert rule
    return prisma.rule.upsert({
      where: { linkId },
      create: {
        linkId,
        ...ruleData,
      },
      update: ruleData,
    });
  }

  private async verifyOwnership(userId: string, linkId: string): Promise<Link> {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: {
        hub: {
          select: { userId: true },
        },
      },
    });

    if (!link) {
      throw new AppError(404, 'Link not found');
    }

    if (link.hub.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return link;
  }
}

export const linkService = new LinkService();
