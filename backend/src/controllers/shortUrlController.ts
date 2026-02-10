import { Request, Response } from 'express';
import { resolverService } from '../services/resolverService';
import { detectContext } from '../utils/contextDetector';
import { AppError } from '../middleware/errorHandler';

export class ShortUrlController {
  async redirectToHub(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;
    
    if (!slug) {
      throw new AppError(400, 'Slug is required');
    }

    try {
      const context = await detectContext(req);
      const result = await resolverService.resolve(slug, context);
      
      // Redirect to the public hub page
      const publicHubUrl = `/hub/${result.hub.slug}`;
      
      res.redirect(302, publicHubUrl);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        // Hub not found, redirect to 404 page
        res.redirect(302, '/404');
        return;
      } else {
        throw error;
      }
    }
  }
}

export const shortUrlController = new ShortUrlController();