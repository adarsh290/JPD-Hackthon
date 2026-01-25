import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { Parser } from 'json2csv';

export interface AnalyticsSummary {
  totalVisits: number;
  totalClicks: number;
  topPerformingLinks: Array<{
    id: number;
    title: string;
    url: string;
    clickCount: number;
  }>;
  clicksByDevice: Record<string, number>;
  clicksByCountry: Record<string, number>;
  recentClicks: Array<{
    id: number;
    linkId: number | null;
    linkTitle: string | null;
    clickedAt: Date;
    device: string;
    country: string;
  }>;
}

export interface ClickData {
  ipAddress?: string;
  userAgent?: string;
  deviceType: string;
  country?: string;
}

export class AnalyticsService {
  async getHubAnalytics(userId: string, hubId: string): Promise<AnalyticsSummary> {
    const hubIdNum = Number(hubId);
    if (Number.isNaN(hubIdNum)) {
      throw new AppError(400, 'Invalid hub ID');
    }

    // Verify hub ownership
    const hub = await prisma.hub.findFirst({
      where: {
        id: hubIdNum,
        userId,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    // Get total visits (hub visits)
    const totalVisits = await prisma.analytics.count({
      where: { hubId: hubIdNum, linkId: null },
    });

    // Get total clicks (link clicks)
    const totalClicks = await prisma.analytics.count({
      where: { hubId: hubIdNum, linkId: { not: null } },
    });

    // Get links with click counts
    const links = await prisma.link.findMany({
      where: { hubId: hubIdNum },
      include: {
        _count: { select: { analytics: true } },
      },
      orderBy: { priorityScore: 'desc' },
    });

    const topPerformingLinks = links
      .sort((a, b) => b._count.analytics - a._count.analytics)
      .slice(0, 5)
      .map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        clickCount: link._count.analytics,
      }));

    // Get clicks by device
    const clicksByDeviceRaw = await prisma.analytics.groupBy({
      by: ['device'],
      where: { hubId: hubIdNum },
      _count: { device: true },
    });

    const clicksByDevice: Record<string, number> = {};
    clicksByDeviceRaw.forEach((item: any) => {
      clicksByDevice[item.device] = item._count.device;
    });

    // Get clicks by country
    const clicksByCountryRaw = await prisma.analytics.groupBy({
      by: ['country'],
      where: { hubId: hubIdNum },
      _count: { country: true },
    });

    const clicksByCountry: Record<string, number> = {};
    clicksByCountryRaw.forEach((item: any) => {
      clicksByCountry[item.country] = item._count.country;
    });

    // Get recent clicks
    const recentClicks = await prisma.analytics.findMany({
      where: { hubId: hubIdNum },
      include: {
        link: { select: { title: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return {
      totalVisits,
      totalClicks,
      topPerformingLinks,
      clicksByDevice,
      clicksByCountry,
      recentClicks: recentClicks.map((click: any) => ({
        id: click.id,
        linkId: click.linkId,
        linkTitle: click.link?.title || null,
        clickedAt: click.timestamp,
        device: click.device,
        country: click.country,
      })),
    };
  }

  async trackClick(linkId: string, hubId: string, data: ClickData): Promise<void> {
    const linkIdNum = Number(linkId);
    const hubIdNum = Number(hubId);
    
    if (Number.isNaN(linkIdNum) || Number.isNaN(hubIdNum)) {
      throw new AppError(400, 'Invalid link or hub ID');
    }

    await prisma.analytics.create({
      data: {
        linkId: linkIdNum,
        hubId: hubIdNum,
        device: data.deviceType,
        country: data.country || 'unknown',
      },
    });
  }

  async exportAnalytics(userId: string, hubId: string): Promise<string> {
    const hubIdNum = Number(hubId);
    if (Number.isNaN(hubIdNum)) {
      throw new AppError(400, 'Invalid hub ID');
    }

    // Verify hub ownership
    const hub = await prisma.hub.findFirst({
      where: {
        id: hubIdNum,
        userId,
      },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found or access denied');
    }

    // Get all analytics data for the hub
    const analyticsData = await prisma.analytics.findMany({
      where: { hubId: hubIdNum },
      include: {
        link: {
          select: {
            title: true,
            url: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Transform data for CSV export
    const csvData = analyticsData.map(record => ({
      'Timestamp': record.timestamp.toISOString(),
      'Type': record.linkId ? 'Link Click' : 'Hub Visit',
      'Link Title': record.link?.title || 'N/A',
      'Link URL': record.link?.url || 'N/A',
      'Device': record.device,
      'Country': record.country,
    }));

    // Define CSV fields
    const fields = [
      'Timestamp',
      'Type',
      'Link Title', 
      'Link URL',
      'Device',
      'Country',
    ];

    try {
      const parser = new Parser({ fields });
      return parser.parse(csvData);
    } catch (error) {
      console.error('CSV export error:', error);
      throw new AppError(500, 'Failed to generate CSV export');
    }
  }
}

export const analyticsService = new AnalyticsService();