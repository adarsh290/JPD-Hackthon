import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class HubController {
  async createHub(req: AuthRequest, res: Response) {
    const { name, description } = req.body;
    
    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await prisma.linkHub.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
      counter++;
    }

    const hub = await prisma.linkHub.create({
      data: {
        userId: req.user!.id,
        name,
        slug,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: hub,
    });
  }

  async getHubs(req: AuthRequest, res: Response) {
    const hubs = await prisma.linkHub.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: hubs,
    });
  }

  async getHub(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const hub = await prisma.linkHub.findFirst({
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
    const { id } = req.params;
    
    const hub = await prisma.linkHub.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    const updated = await prisma.linkHub.update({
      where: { id },
      data: req.body,
    });

    res.json({
      success: true,
      data: updated,
    });
  }

  async deleteHub(req: AuthRequest, res: Response) {
    const { id } = req.params;
    
    const hub = await prisma.linkHub.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    await prisma.linkHub.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Hub deleted successfully',
    });
  }
}

export const hubController = new HubController();
