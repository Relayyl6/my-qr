import { RuleCondition } from "./types";

export interface RequestEvaluationContext {
  userAgent: string;
  country?: string | null;
  referrer?: string | null;
  acceptLanguage?: string | null;
  now?: Date;
}

export function detectDevice(userAgent: string): "ios" | "android" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

export function evaluateCondition(
  condition: RuleCondition,
  ctx: RequestEvaluationContext
): boolean {
  switch (condition.type) {
    case "device": {
      const dev = detectDevice(ctx.userAgent);
      return dev === condition.value;
    }
    case "country": {
      if (!ctx.country) return false;
      return ctx.country.toUpperCase() === condition.value.toUpperCase();
    }
    case "timeRange": {
      const now = ctx.now || new Date();
      const currentHour = now.getUTCHours();
      if (condition.startHour <= condition.endHour) {
        return currentHour >= condition.startHour && currentHour < condition.endHour;
      } else {
        // Spans midnight, e.g. 22:00 to 04:00
        return currentHour >= condition.startHour || currentHour < condition.endHour;
      }
    }
    case "language": {
      if (!ctx.acceptLanguage) return false;
      return ctx.acceptLanguage.toLowerCase().includes(condition.value.toLowerCase());
    }
    case "referrer": {
      if (!ctx.referrer) return false;
      return ctx.referrer.toLowerCase().includes(condition.contains.toLowerCase());
    }
    default:
      return false;
  }
}

export interface StoredRoutingRule {
  id: string;
  priority: number;
  conditions: any; // JSON
  destination: string;
  label?: string | null;
}

export function evaluateRules(
  rules: StoredRoutingRule[],
  fallbackDestination: string,
  ctx: RequestEvaluationContext
): { destination: string; ruleFiredId: string | null; matchedRule: StoredRoutingRule | null } {
  // Sort rules descending by priority (higher priority evaluated first)
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const rawConditions = Array.isArray(rule.conditions) ? rule.conditions : [];
    // All conditions must pass (AND)
    const matchesAll = rawConditions.every((cond: RuleCondition) =>
      evaluateCondition(cond, ctx)
    );

    if (matchesAll && rawConditions.length > 0) {
      return {
        destination: rule.destination,
        ruleFiredId: rule.id,
        matchedRule: rule,
      };
    }
  }

  return {
    destination: fallbackDestination,
    ruleFiredId: null,
    matchedRule: null,
  };
}
