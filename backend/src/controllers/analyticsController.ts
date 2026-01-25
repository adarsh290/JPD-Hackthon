import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analyticsService.js';
import { detectContext } from '../utils/contextDetector.js';
import { Request } from 'express';

export class AnalyticsController {
  async getAnalytics(req: AuthRequest, res: Response) {
    const hubId = req.params.hubId as string;
    const analytics = await analyticsService.getHubAnalytics(req.user!.id, hubId);
    res.json({
      success: true,
      data: analytics,
    });
  }

  async exportAnalytics(req: AuthRequest, res: Response) {
    const hubId = req.params.hubId as string;
    
    try {
      const csvData = await analyticsService.exportAnalytics(req.user!.id, hubId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="hub-${hubId}-analytics.csv"`);
      
      res.send(csvData);
    } catch (error) {
      throw error;
    }
  }

  async trackClick(req: Request, res: Response) {
    const linkId = req.params.linkId as string;
    const hubId = req.params.hubId as string;
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
