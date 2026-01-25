import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analyticsService.js';
import { detectContext } from '../utils/contextDetector.js';
import { Request } from 'express';

export class AnalyticsController {
  async getAnalytics(req: AuthRequest, res: Response) {
    const { hubId } = req.params;
    const analytics = await analyticsService.getHubAnalytics(req.user!.id, hubId);
    res.json({
      success: true,
      data: analytics,
    });
  }

  async trackClick(req: Request, res: Response) {
    const { linkId, hubId } = req.params;
    const context = await detectContext(req);
    
    await analyticsService.trackClick(linkId, hubId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceType: context.deviceType,
      country: context.country,
    });

    res.json({
      success: true,
      message: 'Click tracked',
    });
  }
}

export const analyticsController = new AnalyticsController();
