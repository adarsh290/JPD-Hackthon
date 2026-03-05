import { Response, Request } from 'express';
import { resolverService } from '../services/resolverService';
import { detectContext } from '../utils/contextDetector';
import { AppError } from '../middleware/errorHandler';

export class ResolverController {
  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      console.log('🎯 Resolver Controller - Processing request for slug:', slug);
      
      const context = await detectContext(req);
      const result = await resolverService.resolve(slug, context);
      
      console.log('✅ Resolver Controller - Success:', {
        hubTitle: result.hub.title,
        linksCount: result.links.length
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // ... same error handling
    }
  }

  async unlock(req: Request, res: Response): Promise<void> {
    try {
      const { linkId, gateValue } = req.body;
      if (!linkId) throw new AppError(400, 'Link ID required');

      const url = await resolverService.unlock(Number(linkId), gateValue);
      
      res.json({
        success: true,
        data: { url }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
  }
}

export const resolverController = new ResolverController();
