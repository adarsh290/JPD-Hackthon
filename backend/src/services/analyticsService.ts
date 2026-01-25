import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export interface AnalyticsSummary {
  totalVisits: number;
  totalClicks: number;
  topPerformingLinks: Array<{
    id: string;
    title: string;
    url: string;
    clickCount: number;
  }>;
  leastPerformingLinks: Array<{
    id: string;
    title: string;
    url: string;
    clickCount: number;
  }>;
  clicksByDevice: Record<string, number>;
  clicksByCountry: Record<string, number>;
  recentClicks: Array<{
    id: string;
    linkId: string;
    linkTitle: string;
    clickedAt: Date;
    deviceType: string | null;
    country: string | null;
  }>;
}

export class AnalyticsService {
  async getHubAnalytics(userId: string, hubId: string): Promise<AnalyticsSummary> {
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

    // Get total visits
    const totalVisits = hub.totalVisits;

    // Get total clicks
    const totalClicks = await prisma.linkClick.count({
      where: { hubId },
    });

    // Get top performing links
    const topLinks = await prisma.link.findMany({
      where: { hubId },
      orderBy: { clickCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        url: true,
        clickCount: true,
      },
    });

    // Get least performing links
    const leastLinks = await prisma.link.findMany({
      where: { hubId },
      orderBy: { clickCount: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        url: true,
        clickCount: true,
      },
    });

    // Get clicks by device
    const clicksByDeviceRaw = await prisma.linkClick.groupBy({
      by: ['deviceType'],
      where: { hubId },
      _count: true,
    });
    const clicksByDevice: Record<string, number> = {};
    clicksByDeviceRaw.forEach(item => {
      clicksByDevice[item.deviceType || 'unknown'] = item._count;
    });

    // Get clicks by country
    const clicksByCountryRaw = await prisma.linkClick.groupBy({
      by: ['country'],
      where: { hubId },
      _count: true,
    });
    const clicksByCountry: Record<string, number> = {};
    clicksByCountryRaw.forEach(item => {
      clicksByCountry[item.country || 'unknown'] = item._count;
    });

    // Get recent clicks
    const recentClicks = await prisma.linkClick.findMany({
      where: { hubId },
      include: {
        link: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { clickedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        linkId: true,
        clickedAt: true,
        deviceType: true,
        country: true,
      },
    });

    return {
      totalVisits,
      totalClicks,
      topPerformingLinks: topLinks,
      leastPerformingLinks: leastLinks,
      clicksByDevice,
      clicksByCountry,
      recentClicks: recentClicks.map(click => ({
        id: click.id,
        linkId: click.linkId,
        linkTitle: click.link.title,
        clickedAt: click.clickedAt,
        deviceType: click.deviceType,
        country: click.country,
      })),
    };
  }

  async trackClick(
    linkId: string,
    hubId: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
      deviceType?: string;
      country?: string;
    }
  ): Promise<void> {
    await prisma.linkClick.create({
      data: {
        linkId,
        hubId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceType: context.deviceType,
        country: context.country,
      },
    });

    // Increment click count (atomic update)
    await prisma.$executeRaw`
      UPDATE links 
      SET click_count = click_count + 1 
      WHERE id = ${linkId}
    `;
  }
}

export const analyticsService = new AnalyticsService();
