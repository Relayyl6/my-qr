import { z } from "zod";

export const deviceConditionSchema = z.object({
  type: z.literal("device"),
  value: z.enum(["ios", "android", "desktop"]),
});

export const countryConditionSchema = z.object({
  type: z.literal("country"),
  value: z.string().length(2).describe("2-letter ISO country code (e.g. US, NG, GB)"),
});

export const timeRangeConditionSchema = z.object({
  type: z.literal("timeRange"),
  startHour: z.number().min(0).max(23).describe("Start hour in 24h format (e.g. 11 for 11 AM)"),
  endHour: z.number().min(0).max(23).describe("End hour in 24h format (e.g. 15 for 3 PM)"),
});

export const languageConditionSchema = z.object({
  type: z.literal("language"),
  value: z.string().describe("2-letter language code (e.g. en, es, fr)"),
});

export const referrerConditionSchema = z.object({
  type: z.literal("referrer"),
  contains: z.string().describe("Substring to match in HTTP referrer (e.g. instagram, twitter)"),
});

export const ruleConditionSchema = z.discriminatedUnion("type", [
  deviceConditionSchema,
  countryConditionSchema,
  timeRangeConditionSchema,
  languageConditionSchema,
  referrerConditionSchema,
]);

export type RuleCondition = z.infer<typeof ruleConditionSchema>;

export const compiledRuleSchema = z.object({
  priority: z.number().default(0),
  label: z.string().describe("Descriptive name for rule (e.g. 'iOS Users to App Store')"),
  destination: z.string().url().describe("Destination URL for when conditions match"),
  conditions: z.array(ruleConditionSchema).describe("List of conditions that all must match (AND logic)"),
});

export type CompiledRule = z.infer<typeof compiledRuleSchema>;
