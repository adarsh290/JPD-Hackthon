import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class HubController {
  async createHub(req: AuthRequest, res: Response) {
    const { title } = req.body as { title: string };
    
    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await prisma.hub.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
      counter++;
    }

    const hub = await prisma.hub.create({
      data: {
        userId: req.user!.id,
        title: title,
        slug,
      },
    });

    res.status(201).json({
      success: true,
      data: hub,
    });
  }

  async getHubs(req: AuthRequest, res: Response) {
    const hubs = await prisma.hub.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: hubs,
    });
  }

  async getHub(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, 'Invalid hub ID');
    }
    
    const hub = await prisma.hub.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    res.json({
      success: true,
      data: hub,
    });
  }

  async updateHub(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, 'Invalid hub ID');
    }
    
    const hub = await prisma.hub.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    const updated = await prisma.hub.update({
      where: { id },
      data: req.body as { title?: string },
    });

    res.json({
      success: true,
      data: updated,
    });
  }

  async deleteHub(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError(400, 'Invalid hub ID');
    }
    
    const hub = await prisma.hub.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    await prisma.hub.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Hub deleted successfully',
    });
  }
}

export const hubController = new HubController();
