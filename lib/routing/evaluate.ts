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
    case "schedule": {
      const now = ctx.now || new Date();
      const timezone = condition.timezone || "UTC";

      let currentDay = now.getUTCDay();
      let currentHour = now.getUTCHours();
      let currentMinute = now.getUTCMinutes();

      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          weekday: "short",
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        }).formatToParts(now);

        const weekdayStr = parts.find((p) => p.type === "weekday")?.value?.toLowerCase() || "";
        const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
        if (weekdayStr && dayMap[weekdayStr.slice(0, 3)] !== undefined) {
          currentDay = dayMap[weekdayStr.slice(0, 3)];
        }
        const hourVal = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
        const minVal = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
        currentHour = hourVal === 24 ? 0 : hourVal;
        currentMinute = minVal;
      } catch {
        // Fallback to UTC on invalid timezone
      }

      // Check Day of Week (0 = Sun, 1 = Mon, ..., 6 = Sat)
      if (condition.daysOfWeek && condition.daysOfWeek.length > 0) {
        if (!condition.daysOfWeek.includes(currentDay)) {
          return false;
        }
      }

      // Parse Start and End Times (HH:mm)
      const parseMinutes = (timeStr: string) => {
        const [h, m] = (timeStr || "00:00").split(":").map(Number);
        return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
      };

      const startMins = parseMinutes(condition.startTime);
      const endMins = parseMinutes(condition.endTime);
      const nowMins = currentHour * 60 + currentMinute;

      if (startMins <= endMins) {
        return nowMins >= startMins && nowMins < endMins;
      } else {
        // Spans midnight: e.g. 19:00 to 02:00
        return nowMins >= startMins || nowMins < endMins;
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
