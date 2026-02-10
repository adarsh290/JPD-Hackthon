import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Parser } from 'json2csv';

// Minimal analytics metrics type to avoid casting issues
type AnalyticsMetrics = {
  impressions: number;
  clicks: number;
  ctr: number;
  recentImpressions: number;
  recentClicks: number;
};

export interface AnalyticsSummary {
  totalVisits: number;
  totalClicks: number;
  topPerformingLinks: Array<{
    id: number;
    title: string;
    url: string;
    clickCount: number;
    impressions: number;
    ctr: number;
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

/**
 * Analytics service with dual data sources:
 * - Dashboard queries use aggregated daily_analytics table for performance
 * - Raw analytics table kept for debugging and real-time tracking
 * - Background aggregation job runs daily to populate aggregates
 */
export class AnalyticsService {
  /**
   * Get hub analytics using aggregated data for performance
   * Falls back to raw data if aggregates not available
   */
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

    // Try to use aggregated data first (performance optimization)
    const hasAggregatedData = await this.hasRecentAggregatedData(hubIdNum);
    
    if (hasAggregatedData) {
      return this.getAnalyticsFromAggregates(hubIdNum);
    } else {
      // Fallback to raw data (backward compatibility)
      console.log(`⚠️ Using raw analytics for hub ${hubIdNum} - aggregates not available`);
      return this.getAnalyticsFromRawData(hubIdNum);
    }
  }

  /**
   * Check if we have recent aggregated data (within last 2 days)
   */
  private async hasRecentAggregatedData(hubId: number): Promise<boolean> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentAggregate = await prisma.dailyAnalytics.findFirst({
      where: {
        hubId,
        date: { gte: twoDaysAgo },
      },
    });

    return !!recentAggregate;
  }

  /**
   * Get analytics from aggregated daily_analytics table (fast)
   */
  private async getAnalyticsFromAggregates(hubId: number): Promise<AnalyticsSummary> {
    // Get aggregated totals
    const aggregates = await prisma.dailyAnalytics.aggregate({
      where: { hubId },
      _sum: {
        impressions: true,
        clicks: true,
      },
    });

    const totalVisits = aggregates._sum.impressions || 0;
    const totalClicks = aggregates._sum.clicks || 0;

    // Get top performing links from aggregates
    const linkAggregates = await prisma.dailyAnalytics.groupBy({
      by: ['linkId'],
      where: {
        hubId,
        linkId: { not: null },
      },
      _sum: {
        impressions: true,
        clicks: true,
      },
      orderBy: {
        _sum: {
          clicks: 'desc',
        },
      },
      take: 5,
    });

    // Get link details for top performers
    const linkIds = linkAggregates.map(agg => agg.linkId).filter(Boolean) as number[];
    const links = await prisma.link.findMany({
      where: { id: { in: linkIds } },
      select: { id: true, title: true, url: true },
    });

    const topPerformingLinks = linkAggregates.map(agg => {
      const link = links.find(l => l.id === agg.linkId);
      const impressions = agg._sum.impressions || 0;
      const clicks = agg._sum.clicks || 0;
      const ctr = impressions > 0 ? clicks / impressions : 0;

      return {
        id: agg.linkId!,
        title: link?.title || 'Unknown',
        url: link?.url || '',
        clickCount: clicks,
        impressions,
        ctr,
      };
    });

    // Aggregate device and country breakdowns
    const dailyRecords = await prisma.dailyAnalytics.findMany({
      where: { hubId },
      select: {
        deviceBreakdown: true,
        countryBreakdown: true,
      },
    });

    const clicksByDevice: Record<string, number> = {};
    const clicksByCountry: Record<string, number> = {};

    for (const record of dailyRecords) {
      const deviceData = record.deviceBreakdown as Record<string, number>;
      const countryData = record.countryBreakdown as Record<string, number>;

      for (const [device, count] of Object.entries(deviceData)) {
        clicksByDevice[device] = (clicksByDevice[device] || 0) + count;
      }

      for (const [country, count] of Object.entries(countryData)) {
        clicksByCountry[country] = (clicksByCountry[country] || 0) + count;
      }
    }

    // Get recent clicks from raw data (small dataset, acceptable performance)
    const recentClicks = await this.getRecentClicksFromRawData(hubId);

    return {
      totalVisits,
      totalClicks,
      topPerformingLinks,
      clicksByDevice,
      clicksByCountry,
      recentClicks,
    };
  }

  /**
   * Get analytics from raw analytics table (slower, but complete data)
   * Used as fallback when aggregates not available
   */
  private async getAnalyticsFromRawData(hubId: number): Promise<AnalyticsSummary> {
    // Get total visits (hub visits)
    const totalVisits = await prisma.analytics.count({
      where: { hubId, linkId: null },
    });

    // Get total clicks (link clicks)
    const totalClicks = await prisma.analytics.count({
      where: { hubId, linkId: { not: null } },
    });

    // Get links with click counts
    const links = await prisma.link.findMany({
      where: { hubId },
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
        impressions: totalVisits, // Approximation: assume all links shown on all visits
        ctr: totalVisits > 0 ? link._count.analytics / totalVisits : 0,
      }));

    // Get clicks by device
    const clicksByDeviceRaw = await prisma.analytics.groupBy({
      by: ['device'],
      where: { hubId },
      _count: { device: true },
    });

    const clicksByDevice: Record<string, number> = {};
    clicksByDeviceRaw.forEach((item: any) => {
      clicksByDevice[item.device] = item._count.device;
    });

    // Get clicks by country
    const clicksByCountryRaw = await prisma.analytics.groupBy({
      by: ['country'],
      where: { hubId },
      _count: { country: true },
    });

    const clicksByCountry: Record<string, number> = {};
    clicksByCountryRaw.forEach((item: any) => {
      clicksByCountry[item.country] = item._count.country;
    });

    // Get recent clicks
    const recentClicks = await this.getRecentClicksFromRawData(hubId);

    return {
      totalVisits,
      totalClicks,
      topPerformingLinks,
      clicksByDevice,
      clicksByCountry,
      recentClicks,
    };
  }

  /**
   * Get recent clicks from raw analytics (used by both aggregated and raw data paths)
   */
  private async getRecentClicksFromRawData(hubId: number) {
    const recentClicks = await prisma.analytics.findMany({
      where: { hubId },
      include: {
        link: { select: { title: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return recentClicks.map((click: any) => ({
      id: click.id,
      linkId: click.linkId,
      linkTitle: click.link?.title || null,
      clickedAt: click.timestamp,
      device: click.device,
      country: click.country,
    }));
  }

  /**
   * Get link analytics with CTR data for rules engine
   * Uses aggregated data when available for performance
   */
  async getLinkAnalyticsForRules(hubId: number): Promise<Map<number, AnalyticsMetrics>> {
    const analyticsMap = new Map<number, AnalyticsMetrics>();

    // Try aggregated data first
    const hasAggregatedData = await this.hasRecentAggregatedData(hubId);

    if (hasAggregatedData) {
      // Use aggregated data (fast)
      const aggregates = await prisma.dailyAnalytics.groupBy({
        by: ['linkId'],
        where: {
          hubId,
          linkId: { not: null },
        },
        _sum: {
          impressions: true,
          clicks: true,
        },
      });

      // Get recent data (last 30 days) for time decay
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAggregates = await prisma.dailyAnalytics.groupBy({
        by: ['linkId'],
        where: {
          hubId,
          linkId: { not: null },
          date: { gte: thirtyDaysAgo },
        },
        _sum: {
          impressions: true,
          clicks: true,
        },
      });

      // Build analytics map
      for (const agg of aggregates) {
        if (!agg.linkId) continue;

        const recentAgg = recentAggregates.find(r => r.linkId === agg.linkId);
        const impressions = agg._sum.impressions || 0;
        const clicks = agg._sum.clicks || 0;
        const recentImpressions = recentAgg?._sum.impressions || 0;
        const recentClicks = recentAgg?._sum.clicks || 0;

        analyticsMap.set(agg.linkId, {
          impressions,
          clicks,
          ctr: impressions > 0 ? clicks / impressions : 0,
          recentImpressions,
          recentClicks,
        });
      }
    } else {
      // Fallback to raw data approximation
      console.log(`⚠️ Using raw analytics approximation for rules engine - aggregates not available`);
      
      const totalVisits = await prisma.analytics.count({
        where: { hubId, linkId: null },
      });

      const links = await prisma.link.findMany({
        where: { hubId },
        include: {
          _count: { select: { analytics: true } },
        },
      });

      for (const link of links) {
        const clicks = link._count.analytics;
        const impressions = totalVisits; // Approximation: assume link shown on all hub visits
        
        analyticsMap.set(link.id, {
          impressions,
          clicks,
          ctr: impressions > 0 ? clicks / impressions : 0,
          recentImpressions: impressions, // No time decay in fallback mode
          recentClicks: clicks,
        });
      }
    }

    return analyticsMap;
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