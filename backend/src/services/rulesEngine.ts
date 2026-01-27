import { Link, Rule } from '@prisma/client'
import { RequestContext } from '../utils/contextDetector.js'

/* ───────────────── TYPES ───────────────── */

type RuleResult = true | false | 'unknown'

export interface RuleGroup {
  rules: Rule[]
}

export interface LinkWithRules extends Link {
  rules: Rule[]
}

export interface LinkWithAnalytics extends LinkWithRules {
  impressions?: number
  clicks?: number
  recentImpressions?: number
  recentClicks?: number
}

/* ───────────────── NORMALIZATION ───────────────── */

/**
 * Supported formats:
 * 1) Legacy: Rule[]
 * 2) New: { groups: RuleGroup[] }
 */
function normalizeRuleGroups(raw: any): RuleGroup[] {
  if (!raw) return [{ rules: [] }]

  if (raw.groups && Array.isArray(raw.groups)) {
    return raw.groups
  }

  if (Array.isArray(raw)) {
    return [{ rules: raw }]
  }

  return [{ rules: [] }]
}

/* ───────────────── SINGLE RULE EVALUATION ───────────────── */

function evaluateRule(
  rule: Rule,
  context: RequestContext
): RuleResult {
  const value = rule.value as any

  switch (rule.type) {
    case 'device':
      if (!context.deviceType) return 'unknown'
      return value.allowed?.includes(context.deviceType) ?? true

    case 'geo':
      if (!context.country || context.country === 'unknown') {
        return 'unknown'
      }
      if (value.blocked?.includes(context.country)) return false
      if (value.allowed) return value.allowed.includes(context.country)
      return true

    case 'time': {
      const now = context.timestamp
      if (!now) return 'unknown'

      if (value.days && !value.days.includes(now.getDay())) return false

      const minutes = now.getHours() * 60 + now.getMinutes()
      if (value.start) {
        const [h, m] = value.start.split(':').map(Number)
        if (minutes < h * 60 + m) return false
      }
      if (value.end) {
        const [h, m] = value.end.split(':').map(Number)
        if (minutes > h * 60 + m) return false
      }
      return true
    }

    case 'performance':
      return true // performance NEVER hides links

    default:
      return 'unknown'
  }
}

/* ───────────────── GROUP + LINK EVALUATION ───────────────── */

function evaluateGroup(
  group: RuleGroup,
  context: RequestContext
): boolean {
  for (const rule of group.rules) {
    const result = evaluateRule(rule, context)

    if (result === false) return false
    if (result === 'unknown') return false
  }
  return true
}

export function shouldShowLink(
  link: LinkWithRules,
  context: RequestContext
): boolean {
  if (!link.isActive) return false
  if (!link.rules || link.rules.length === 0) return true

  const groups = normalizeRuleGroups(link.rules)

  for (const group of groups) {
    if (evaluateGroup(group, context)) return true
  }

  return false
}

/* ───────────────── PRIORITY CALCULATION ───────────────── */

const PERFORMANCE_CONFIG = {
  MIN_IMPRESSIONS: 10,
  CTR_MULTIPLIER: 1000,
  CLICK_FALLBACK: 2,
  DECAY_WEIGHT: 0.7
} as const

export function calculateLinkPriority(
  link: LinkWithRules,
  context: RequestContext,
  analytics?: LinkWithAnalytics
): number {
  let score = link.priorityScore

  for (const rule of link.rules ?? []) {
    const value = rule.value as any

    if (rule.type === 'device' && value.priority === context.deviceType) {
      score += 100
    }

    if (rule.type === 'geo' && value.priority === context.country) {
      score += 50
    }

    if (rule.type === 'performance' && analytics) {
      score += calculatePerformanceBoost(analytics)
    }
  }

  return Math.round(score)
}

function calculatePerformanceBoost(
  analytics: LinkWithAnalytics
): number {
  const impressions = analytics.impressions ?? 0
  const clicks = analytics.clicks ?? 0

  if (impressions >= PERFORMANCE_CONFIG.MIN_IMPRESSIONS) {
    const ctr = clicks / impressions
    return ctr * PERFORMANCE_CONFIG.CTR_MULTIPLIER
  }

  return Math.min(clicks * PERFORMANCE_CONFIG.CLICK_FALLBACK, 100)
}

/* ───────────────── FILTER + SORT ───────────────── */

export function sortLinksByRules(
  links: LinkWithRules[],
  context: RequestContext,
  analyticsMap?: Map<number, LinkWithAnalytics>
): LinkWithRules[] {
  return links
    .filter(link => shouldShowLink(link, context))
    .sort((a, b) => {
      const pa = calculateLinkPriority(a, context, analyticsMap?.get(a.id))
      const pb = calculateLinkPriority(b, context, analyticsMap?.get(b.id))
      return pb - pa
    })
}
