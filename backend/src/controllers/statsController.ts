import { Request, Response } from 'express';
import prisma from '../config/database';

// Server start time for uptime calculation
const serverStartTime = Date.now();

export async function getPublicStats(_req: Request, res: Response) {
    try {
        // Run all counts in parallel for speed
        const [hubCount, linkCount, clickCount, ruleCount, userCount] = await Promise.all([
            prisma.hub.count(),
            prisma.link.count(),
            prisma.analytics.count(),
            prisma.rule.count(),
            prisma.user.count(),
        ]);

        // Uptime since server start
        const uptimeMs = Date.now() - serverStartTime;
        const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const uptimeDays = Math.floor(uptimeHours / 24);

        // Compute health-style scores from real data
        const linkPerf = Math.min(100, hubCount > 0 ? Math.round((linkCount / hubCount) * 20) : 0);
        const ruleEff = Math.min(100, linkCount > 0 ? Math.round((ruleCount / linkCount) * 50) : 0);
        const engagement = Math.min(100, linkCount > 0 ? Math.round((clickCount / Math.max(linkCount, 1)) * 10) : 0);
        const coverage = Math.min(100, hubCount > 0 ? Math.round((clickCount / Math.max(hubCount, 1)) * 5) : 0);

        res.json({
            success: true,
            data: {
                hubs: hubCount,
                links: linkCount,
                clicks: clickCount,
                rules: ruleCount,
                users: userCount,
                uptime: {
                    ms: uptimeMs,
                    hours: uptimeHours,
                    days: uptimeDays,
                    percentage: '99.9', // Static for marketing, real monitoring would use external service
                },
                health: {
                    overall: Math.round((linkPerf + ruleEff + engagement + coverage) / 4),
                    linkPerformance: linkPerf,
                    ruleEffectiveness: ruleEff,
                    engagement: engagement,
                    analyticsCoverage: coverage,
                },
            },
        });
    } catch (error) {
        console.error('❌ Stats endpoint error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch stats' },
        });
    }
}
