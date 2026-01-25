import { Link, Rule } from '@prisma/client';
import { RequestContext } from '../utils/contextDetector.js';

/** Rule value shapes for type/value model */
interface TimeValue {
  start?: string; // HH:mm
  end?: string;   // HH:mm
  days?: number[]; // 0–6 (Sunday–Saturday), optional
}

interface DeviceValue {
  allowed?: string[];
  priority?: string;
}

interface GeoValue {
  allowed?: string[];
  blocked?: string[];
  priority?: string;
}

interface PerformanceValue {
  minClicks?: number;
  autoSort?: boolean;
}

export interface LinkWithRules extends Link {
  rules: Rule[];
  _count?: { analytics: number };
}

/**
 * Validates HH:mm time range (value.start, value.end) against visitor timestamp.
 */
function isTimeRuleValid(value: TimeValue, timestamp: Date): boolean {
  if (value.days && value.days.length > 0) {
    const dayOfWeek = timestamp.getDay();
    if (!value.days.includes(dayOfWeek)) return false;
  }

  if (!value.start && !value.end) return true;

  const currentMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();

  if (value.start) {
    const [h, m] = value.start.split(':').map(Number);
    if (currentMinutes < h * 60 + m) return false;
  }

  if (value.end) {
    const [h, m] = value.end.split(':').map(Number);
    if (currentMinutes > h * 60 + m) return false;
  }

  return true;
}

/**
 * Determines if a link should be shown based on time, device, geo, and performance rules.
 */
export function shouldShowLink(link: LinkWithRules, context: RequestContext): boolean {
  if (!link.isActive) return false;
  if (!link.rules || link.rules.length === 0) return true;

  for (const rule of link.rules) {
    const value = rule.value as Record<string, unknown>;

    if (rule.type === 'time') {
      if (!isTimeRuleValid(value as TimeValue, context.timestamp)) return false;
    }

    if (rule.type === 'device') {
      const v = value as DeviceValue;
      if (v.allowed && v.allowed.length > 0 && !v.allowed.includes(context.deviceType)) return false;
    }

    if (rule.type === 'geo' && context.country) {
      const v = value as GeoValue;
      if (v.blocked?.includes(context.country)) return false;
      if (v.allowed && v.allowed.length > 0 && !v.allowed.includes(context.country)) return false;
    }

    if (rule.type === 'performance') {
      const v = value as PerformanceValue;
      const count = link._count?.analytics ?? 0;
      if (v.minClicks != null && count < v.minClicks) return false;
    }
  }

  return true;
}

/**
 * Computes dynamic priority for ranking. Uses priorityScore and boosts from
 * device/geo priority and performance autoSort (weighting _count.analytics).
 */
export function calculateLinkPriority(link: LinkWithRules, context: RequestContext): number {
  let priority = link.priorityScore;
  if (!link.rules) return priority;

  for (const rule of link.rules) {
    const value = rule.value as Record<string, unknown>;

    if (rule.type === 'device') {
      const v = value as DeviceValue;
      if (v.priority === context.deviceType) priority += 100;
    }

    if (rule.type === 'geo' && context.country) {
      const v = value as GeoValue;
      if (v.priority === context.country) priority += 50;
    }

    if (rule.type === 'performance') {
      const v = value as PerformanceValue;
      if (v.autoSort) priority += (link._count?.analytics ?? 0) * 2;
    }
  }

  return priority;
}

/**
 * Filters links by rules and sorts by calculated priority (desc).
 */
export function sortLinksByRules(
  links: LinkWithRules[],
  context: RequestContext
): LinkWithRules[] {
  return links
    .filter((link) => shouldShowLink(link, context))
    .sort((a, b) => calculateLinkPriority(b, context) - calculateLinkPriority(a, context));
}
