import { Response, Request } from 'express';
import { resolverService } from '../services/resolverService.js';
import { detectContext } from '../utils/contextDetector.js';
import { AppError } from '../middleware/errorHandler.js';

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
      console.error('❌ Resolver Controller - Error:', error);
      
      if (error instanceof AppError) {
        // Handle specific "no links" case with 200 status but empty links
        if (error.message === 'No links currently active for your context') {
          res.status(200).json({
            success: false,
            error: {
              message: error.message,
              code: 'NO_ACTIVE_LINKS'
            }
          });
          return;
        }
        
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }
      
      // Generic error
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
        },
      });
    }
  }
}

export const resolverController = new ResolverController();
