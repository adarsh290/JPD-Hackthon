import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analyticsService.js';
import { detectContext } from '../utils/contextDetector.js';
import { Request } from 'express';

export class AnalyticsController {
  async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    const hubId = req.params.hubId as string;
    const analytics = await analyticsService.getHubAnalytics(req.user!.id, hubId);
    res.json({
      success: true,
      data: analytics,
    });
  }

  async exportAnalytics(req: AuthRequest, res: Response): Promise<void> {
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

  async trackClick(req: Request, res: Response): Promise<void> {
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

  async trackSimpleClick(req: Request, res: Response): Promise<void> {
    try {
      const { linkId, hubId } = req.body;
      
      if (!linkId || !hubId) {
        res.status(400).json({
          success: false,
          error: { message: 'linkId and hubId are required' }
        });
        return;
      }

      const context = await detectContext(req);
      
      console.log('📊 Tracking click:', { linkId, hubId, context: context.deviceType, country: context.country });
      
      await analyticsService.trackClick(linkId.toString(), hubId.toString(), {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceType: context.deviceType,
        country: context.country,
      });

      res.json({
        success: true,
        message: 'Click tracked',
      });
    } catch (error) {
      console.error('❌ Click tracking error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to track click' }
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
