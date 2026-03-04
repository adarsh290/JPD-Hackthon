import { z } from 'zod';

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
    value: z.record(z.string(), z.unknown()),
});

export const createLinkSchema = z.object({
    hubId: z.coerce.number().int().min(1, 'Invalid hub ID'),
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

// Infer types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateHubInput = z.infer<typeof createHubSchema>;
export type UpdateHubInput = z.infer<typeof updateHubSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
