import { Response, Request } from 'express';
import { resolverService } from '../services/resolverService.js';
import { detectContext } from '../utils/contextDetector.js';

export class ResolverController {
  async resolve(req: Request, res: Response) {
    const { slug } = req.params;
    const context = await detectContext(req);
    const result = await resolverService.resolve(slug, context);
    
    res.json({
      success: true,
      data: result,
    });
  }
}

export const resolverController = new ResolverController();
