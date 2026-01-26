import { Response } from 'express';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export class LinkController {
  async getLinks(req: AuthRequest, res: Response): Promise<void> {
    const hubId = Number(req.params.hubId);
    if (Number.isNaN(hubId)) {
      throw new AppError(400, 'Invalid hub ID');
    }

    const hub = await prisma.hub.findFirst({
      where: { id: hubId, userId: req.user!.id },
    });
    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    const links = await prisma.link.findMany({
      where: { hubId },
      include: {
        rules: true,
        _count: { select: { analytics: true } },
      },
      orderBy: { priorityScore: 'desc' },
    });

    res.json({ success: true, data: links });
  }

  async createLink(req: AuthRequest, res: Response): Promise<void> {
    const { hubId, title, url, isActive, priorityScore, rules } = req.body as {
      hubId: number;
      title: string;
      url: string;
      isActive?: boolean;
      priorityScore?: number;
      rules?: Array<{ type: string; value: Record<string, unknown> }>;
    };

    const hub = await prisma.hub.findFirst({
      where: { id: hubId, userId: req.user!.id },
    });
    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    const link = await prisma.$transaction(async (tx: any) => {
      const created = await tx.link.create({
        data: {
          hubId,
          title,
          url,
          isActive: isActive ?? true,
          priorityScore: priorityScore ?? 0,
          rules: {
            create: (rules ?? []).map((r) => ({
              type: r.type,
              value: (r.value ?? {}) as object,
            })),
          },
        },
        include: { rules: true, _count: { select: { analytics: true } } },
      });
      return created;
    });

    res.status(201).json({ success: true, data: link });
  }

  async updateLink(req: AuthRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, 'Invalid link ID');
    }

    const link = await prisma.link.findUnique({
      where: { id },
      include: { hub: { select: { userId: true } } },
    });
    if (!link || link.hub.userId !== req.user!.id) {
      throw new AppError(404, 'Link not found or access denied');
    }

    const { title, url, isActive, priorityScore } = req.body as {
      title?: string;
      url?: string;
      isActive?: boolean;
      priorityScore?: number;
    };
    const data: { title?: string; url?: string; isActive?: boolean; priorityScore?: number } = {};
    if (title !== undefined) data.title = title;
    if (url !== undefined) data.url = url;
    if (isActive !== undefined) data.isActive = isActive;
    if (priorityScore !== undefined) data.priorityScore = priorityScore;

    const updated = await prisma.link.update({
      where: { id },
      data,
      include: { rules: true, _count: { select: { analytics: true } } },
    });

    res.json({ success: true, data: updated });
  }

  async deleteLink(req: AuthRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, 'Invalid link ID');
    }

    const link = await prisma.link.findUnique({
      where: { id },
      include: { hub: { select: { userId: true } } },
    });
    if (!link || link.hub.userId !== req.user!.id) {
      throw new AppError(404, 'Link not found or access denied');
    }

    await prisma.link.delete({ where: { id } });
    res.status(204).send();
  }
}

export const linkController = new LinkController();
