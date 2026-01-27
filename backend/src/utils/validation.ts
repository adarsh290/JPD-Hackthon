import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createHubSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
});

export const updateHubSchema = z.object({
  title: z.string().min(1).max(100).optional(),
});

const ruleItemSchema = z.object({
  type: z.enum(['time', 'device', 'geo', 'performance']),
  value: z.record(z.unknown()),
});

export const createLinkSchema = z.object({
  hubId: z.coerce.number().int().positive('Invalid hub ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  url: z.string().url('Invalid URL'),
  isActive: z.boolean().optional(),
  priorityScore: z.number().int().min(0).optional(),
  rules: z.array(ruleItemSchema).optional(),
});

export const updateLinkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  isActive: z.boolean().optional(),
  priorityScore: z.number().int().min(0).optional(),
});

export const ruleSchema = z.object({
  timeRules: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
      timezone: z.string().optional(),
      days: z.array(z.number().int().min(0).max(6)).optional(),
    })
    .optional(),
  deviceRules: z
    .object({
      allowed: z.array(z.enum(['mobile', 'desktop', 'tablet'])).optional(),
      priority: z.enum(['mobile', 'desktop', 'tablet']).optional(),
    })
    .optional(),
  geoRules: z
    .object({
      allowed: z.array(z.string()).optional(),
      blocked: z.array(z.string()).optional(),
      priority: z.string().optional(),
    })
    .optional(),
  performanceRules: z
    .object({
      minClicks: z.number().int().min(0).optional(),
      maxClicks: z.number().int().min(0).optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      autoSort: z.boolean().optional(),
    })
    .optional(),
});

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
