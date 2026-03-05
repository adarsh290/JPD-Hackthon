import prisma from '../config/database';
import { RequestContext } from '../utils/contextDetector';
import { sortLinksByRules, LinkWithRules } from './rulesEngine';
import { AppError } from '../middleware/errorHandler';
import { emitAnalyticsEvent } from '../config/socket';

export interface ResolvedLink {
  id: number;
  title: string;
  url: string;
  position: number;
  gateType: string;
}

export interface ResolverResponse {
  hub: { id: number; title: string; slug: string };
  links: ResolvedLink[];
}

export class ResolverService {
  /**
   * Resolves a public hub by slug (case-insensitive), evaluates rules,
   * logs the hub visit in Analytics, and returns filtered/sorted links.
   */
  async resolve(slug: string, context: RequestContext): Promise<ResolverResponse> {
    console.log('🔍 Resolver Service - Incoming Request:', {
      slug,
      context: {
        deviceType: context.deviceType,
        country: context.country,
        ipAddress: context.ipAddress,
        timestamp: context.timestamp.toISOString(),
      }
    });

    const normalizedSlug = slug.toLowerCase().trim();

    const hub = await prisma.hub.findFirst({
      where: { 
        slug: normalizedSlug,
        isActive: true // Ensure hub is active
      },
      select: { id: true, title: true, slug: true },
    });

    if (!hub) {
      console.log('❌ Hub not found or inactive:', normalizedSlug);
      throw new AppError(404, 'Hub not found');
    }

    console.log('✅ Hub found:', hub);

    await this.trackVisit(hub.id, context);

    const links = await prisma.link.findMany({
      where: { hubId: hub.id, isActive: true },
      include: {
        rules: true,
        _count: { select: { analytics: true } },
      },
    });

    console.log('📊 Raw links from database:', {
      totalLinks: links.length,
      links: links.map(link => ({
        id: link.id,
        title: link.title,
        isActive: link.isActive,
        rulesCount: link.rules.length,
        analyticsCount: link._count.analytics,
      }))
    });

    // Handle case where no rules exist - show all active links
    if (links.length === 0) {
      console.log('⚠️ No active links found for hub');
      return {
        hub: { id: hub.id, title: hub.title, slug: hub.slug },
        links: [],
      };
    }

    const sorted = sortLinksByRules(links as any, context);

    console.log('🎯 Filtered and sorted links:', {
      filteredCount: sorted.length,
      links: sorted.map(link => ({
        id: link.id,
        title: link.title,
        priorityScore: link.priorityScore,
      }))
    });

    // Check if no links pass the filtering
    if (sorted.length === 0) {
      console.log('⚠️ No links available after rule filtering');
      // Return empty links array instead of throwing error
      // This allows the frontend to show a proper message
      return {
        hub: { id: hub.id, title: hub.title, slug: hub.slug },
        links: [],
      };
    }

    return {
      hub: { id: hub.id, title: hub.title, slug: hub.slug },
      links: sorted.map((link: any) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        position: link.priorityScore,
        gateType: link.gateType || 'none',
      })),
    };
  }

  async unlock(linkId: number, gateValue: string): Promise<string> {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { url: true, gateType: true, gateValue: true },
    });

    if (!link) {
      throw new AppError(404, 'Link not found');
    }

    if (link.gateType === 'none') {
      return link.url;
    }

    if (link.gateType === 'password') {
      if (link.gateValue === gateValue) {
        return link.url;
      }
      throw new AppError(403, 'INCORRECT_PASSWORD');
    }

    throw new AppError(400, 'UNSUPPORTED_GATE_TYPE');
  }

  /**
   * Logs every hub visit in Analytics (hubId set, linkId null).
   */
  private async trackVisit(hubId: number, context: RequestContext): Promise<void> {
    try {
      const analytics = await prisma.analytics.create({
        data: {
          hubId,
          linkId: null,
          device: context.deviceType ?? 'unknown',
          country: context.country ?? 'unknown',
        },
      });

      // Emit real-time event
      emitAnalyticsEvent(hubId, 'new-visit', {
        id: analytics.id,
        hubId,
        device_type: analytics.device,
        visited_at: analytics.timestamp,
      });

      console.log('📈 Analytics visit tracked:', { hubId, device: context.deviceType, country: context.country });
    } catch (err) {
      console.error('❌ Analytics trackVisit error:', err);
    }
  }
}

export const resolverService = new ResolverService();
