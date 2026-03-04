import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

export * from '@smart-link-hub/shared';

export function validate(schema: z.ZodSchema) {
  return (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const message = error.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        return next(new AppError(400, `Validation error: ${message}`, true));
      }
      return next(error);

    }
  };
}
