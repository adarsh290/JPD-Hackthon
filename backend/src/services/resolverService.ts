import prisma from '../config/database.js';
import { RequestContext } from '../utils/contextDetector.js';
import { sortLinksByRules, LinkWithRules } from './rulesEngine.js';
import { AppError } from '../middleware/errorHandler.js';

export interface ResolvedLink {
  id: number;
  title: string;
  url: string;
  position: number;
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
    const normalizedSlug = slug.toLowerCase().trim();

    const hub = await prisma.hub.findFirst({
      where: { slug: normalizedSlug },
      select: { id: true, title: true, slug: true },
    });

    if (!hub) {
      throw new AppError(404, 'Hub not found');
    }

    await this.trackVisit(hub.id, context);

    const links = await prisma.link.findMany({
      where: { hubId: hub.id, isActive: true },
      include: {
        rules: true,
        _count: { select: { analytics: true } },
      },
    });

    const sorted = sortLinksByRules(links as LinkWithRules[], context);

    return {
      hub: { id: hub.id, title: hub.title, slug: hub.slug },
      links: sorted.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        position: link.priorityScore,
      })),
    };
  }

  /**
   * Logs every hub visit in Analytics (hubId set, linkId null).
   */
  private async trackVisit(hubId: number, context: RequestContext): Promise<void> {
    try {
      await prisma.analytics.create({
        data: {
          hubId,
          linkId: null,
          device: context.deviceType ?? 'unknown',
          country: context.country ?? 'unknown',
        },
      });
    } catch (err) {
      console.error('Analytics trackVisit error:', err);
    }
  }
}

export const resolverService = new ResolverService();
