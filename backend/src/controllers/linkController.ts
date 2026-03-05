import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

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
    const { hubId, title, url, isActive, priorityScore, rules, gateType, gateValue } = req.body as {
      hubId: number;
      title: string;
      url: string;
      isActive?: boolean;
      priorityScore?: number;
      rules?: Array<{ type: string; value: Record<string, unknown> }>;
      gateType?: string;
      gateValue?: string;
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
          gateType: gateType ?? 'none',
          gateValue: gateValue || null,
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

    const { title, url, isActive, priorityScore, gateType, gateValue } = req.body as {
      title?: string;
      url?: string;
      isActive?: boolean;
      priorityScore?: number;
      gateType?: string;
      gateValue?: string;
    };
    const data: { 
      title?: string; 
      url?: string; 
      isActive?: boolean; 
      priorityScore?: number;
      gateType?: string;
      gateValue?: string | null;
    } = {};
    if (title !== undefined) data.title = title;
    if (url !== undefined) data.url = url;
    if (isActive !== undefined) data.isActive = isActive;
    if (priorityScore !== undefined) data.priorityScore = priorityScore;
    if (gateType !== undefined) data.gateType = gateType;
    if (gateValue !== undefined) data.gateValue = gateValue || null;

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

  async fetchMetadata(req: AuthRequest, res: Response): Promise<void> {
    const { url } = req.query as { url: string };
    if (!url) {
      throw new AppError(400, 'URL is required');
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();

      // Basic Title Extraction
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Basic Favicon Extraction
      const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i);
      
      let favicon = iconMatch ? iconMatch[1] : '';

      if (favicon && !favicon.startsWith('http')) {
        const urlObj = new URL(url);
        if (favicon.startsWith('//')) {
          favicon = `https:${favicon}`;
        } else if (favicon.startsWith('/')) {
          favicon = `${urlObj.origin}${favicon}`;
        } else {
          favicon = `${urlObj.origin}/${favicon}`;
        }
      } else if (!favicon) {
        const urlObj = new URL(url);
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      }

      res.json({
        success: true,
        data: {
          title,
          favicon,
        },
      });
    } catch (error: any) {
      console.error('Metadata fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Could not fetch metadata from URL',
          details: error.message,
        },
      });
    }
  }
}

export const linkController = new LinkController();
