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
 * IMPORTANT: If a link has NO rules, it should ALWAYS be shown (default behavior).
 * If a link has rules, ALL rules must pass for the link to be shown.
 */
export function shouldShowLink(link: LinkWithRules, context: RequestContext): boolean {
  console.log(`🔍 Evaluating link "${link.title}" (ID: ${link.id}):`, {
    isActive: link.isActive,
    rulesCount: link.rules?.length || 0,
    context: {
      deviceType: context.deviceType,
      country: context.country,
      timestamp: context.timestamp.toISOString(),
    }
  });

  if (!link.isActive) {
    console.log(`❌ Link "${link.title}" is inactive`);
    return false;
  }

  // If no rules exist, show the link by default
  if (!link.rules || link.rules.length === 0) {
    console.log(`✅ Link "${link.title}" has no rules - showing by default`);
    return true;
  }

  // Evaluate each rule - ALL must pass
  for (const rule of link.rules) {
    const value = rule.value as Record<string, unknown>;
    console.log(`🔧 Evaluating rule:`, { type: rule.type, value });

    if (rule.type === 'time') {
      const isValid = isTimeRuleValid(value as TimeValue, context.timestamp);
      console.log(`⏰ Time rule result: ${isValid}`);
      if (!isValid) {
        console.log(`❌ Link "${link.title}" failed time rule`);
        return false;
      }
    }

    if (rule.type === 'device') {
      const v = value as DeviceValue;
      // Only filter if allowed list is specified and not empty
      if (v.allowed && v.allowed.length > 0) {
        if (!v.allowed.includes(context.deviceType)) {
          console.log(`❌ Link "${link.title}" failed device rule: ${context.deviceType} not in allowed [${v.allowed.join(', ')}]`);
          return false;
        }
      }
      console.log(`✅ Device rule passed: ${context.deviceType}`);
    }

    if (rule.type === 'geo') {
      const v = value as GeoValue;
      
      // Skip geo filtering if country is undefined/unknown (VPN, localhost, etc.)
      if (!context.country || context.country === 'unknown') {
        console.log(`⚠️ Geo rule skipped: country is ${context.country || 'undefined'} - allowing link`);
        continue; // Skip this rule, don't fail the link
      }

      // Check blocked list first
      if (v.blocked && v.blocked.length > 0 && v.blocked.includes(context.country)) {
        console.log(`❌ Link "${link.title}" failed geo rule: ${context.country} is blocked`);
        return false;
      }
      
      // Check allowed list only if it's specified and not empty
      if (v.allowed && v.allowed.length > 0) {
        if (!v.allowed.includes(context.country)) {
          console.log(`❌ Link "${link.title}" failed geo rule: ${context.country} not in allowed [${v.allowed.join(', ')}]`);
          return false;
        }
      }
      
      console.log(`✅ Geo rule passed: ${context.country}`);
    }

    if (rule.type === 'performance') {
      const v = value as PerformanceValue;
      const count = link._count?.analytics ?? 0;
      // Only check minClicks if it's specified
      if (v.minClicks != null && v.minClicks > 0 && count < v.minClicks) {
        console.log(`❌ Link "${link.title}" failed performance rule: ${count} clicks < ${v.minClicks} required`);
        return false;
      }
      console.log(`✅ Performance rule passed: ${count} clicks >= ${v.minClicks || 0} required`);
    }
  }

  console.log(`✅ Link "${link.title}" passed all rules`);
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
