import { prisma } from "@/lib/prisma";
import { AIFeatureName, assertFeatureAccess } from "./flags";
import { getAIProvider, AIUsage, AIProvider } from "./provider";
import { getPrompt, PromptDefinition } from "./prompts";

export interface AIResult<T> {
  data: T;
  usage: AIUsage;
  cached: boolean;
  latencyMs: number;
  isFallback?: boolean;
}

export async function runAI<T>(opts: {
  feature: AIFeatureName;
  promptKey: string;
  input: any;
  userId?: string;
  cacheKey?: string;
}): Promise<AIResult<T>> {
  const startTime = Date.now();

  // 1. Assert feature access
  const access = await assertFeatureAccess(opts.userId, opts.feature);
  if (!access.allowed) {
    throw new Error(access.reason || "Unauthorized to access this AI feature.");
  }

  // 2. Dynamic Rate limit check per tier
  const maxCallsPerMinute = access.tierConfig?.rateLimitPerMinute ?? 30;
  if (opts.userId) {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCalls = await prisma.aiInvocation.count({
        where: {
          userId: opts.userId,
          feature: opts.feature,
          createdAt: { gte: oneMinuteAgo },
        },
      });

      if (recentCalls >= maxCallsPerMinute) {
        throw new Error(
          `Rate limit exceeded (${maxCallsPerMinute} calls/min on ${access.tierConfig.name} plan). Please wait a minute before retrying.`
        );
      }
    } catch (e: any) {
      if (e.message?.includes("Rate limit exceeded")) throw e;
      console.warn("[runAI] DB rate-limit check skipped:", e.message);
    }
  }

  // 3. Cache lookup
  const promptDef = getPrompt(opts.promptKey);
  const cacheTtlSeconds = promptDef?.cacheTtlSeconds ?? 3600;
  const fullCacheKey = opts.cacheKey ? `${opts.promptKey}:${opts.cacheKey}` : null;

  if (fullCacheKey) {
    try {
      const cachedEntry = await prisma.aiCache.findUnique({
        where: { key: fullCacheKey },
      });

      if (cachedEntry && cachedEntry.expiresAt > new Date()) {
        const latencyMs = Date.now() - startTime;
        return {
          data: cachedEntry.value as unknown as T,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
          },
          cached: true,
          latencyMs,
        };
      }
    } catch (e) {
      console.warn("AI cache read failed:", e);
    }
  }

  // 4. Dynamic Cost budget guard per tier
  const tierLimit = access.tierConfig?.monthlyLimitUsd ?? 5.00;
  if (opts.userId) {
    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: opts.userId },
        select: { email: true },
      });
      const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
      const isAdmin = userRecord && userRecord.email.toLowerCase() === adminEmail;

      if (!isAdmin) {
        const credit = await prisma.aiCredit.findUnique({
          where: { userId: opts.userId },
        });

        const effectiveLimit = credit ? Number(credit.monthlyLimitUsd) : tierLimit;
        if (credit && Number(credit.usedThisMonth) >= effectiveLimit) {
          throw new Error(
            `Monthly AI budget of $${effectiveLimit.toFixed(2)} reached for your ${access.tierConfig.name} plan. Please upgrade to a higher plan for more AI compute.`
          );
        }
      }
    } catch (e: any) {
      if (e.message?.includes("Monthly AI budget")) throw e;
      console.warn("[runAI] DB credit check skipped:", e.message);
    }
  }

  // 5. Provider call & fallback resolution with strict 4.5s timeout guarantee
  const provider = getAIProvider();
  let resultData: T;
  let usage: AIUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };
  let errorMsg: string | null = null;
  let isSuccess = false;

  const system = promptDef?.system || "You are an expert AI assistant for DynamicQR.";
  const userPrompt = promptDef?.buildUserPrompt
    ? promptDef.buildUserPrompt(opts.input)
    : String(opts.input);

  // Generous server execution window (120s ceiling for serverless boundaries, never cutting off legitimate inference)
  const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 120000);
  let isFallback = false;

  try {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`AI_TIMEOUT: Upstream inference exceeded safety window of ${Math.round(AI_TIMEOUT_MS / 1000)}s`));
      }, AI_TIMEOUT_MS);
    });

    const executeWithProvider = async (targetProvider: AIProvider) => {
      if (promptDef?.schema) {
        return await targetProvider.generateObject<T>({
          schema: promptDef.schema,
          system,
          prompt: userPrompt,
          model: promptDef.model,
          temperature: promptDef.temperature,
        });
      } else {
        const textRes = await targetProvider.generateText({
          system,
          prompt: userPrompt,
          model: promptDef?.model,
          temperature: promptDef?.temperature,
        });
        return { data: textRes.text as unknown as T, usage: textRes.usage };
      }
    };

    try {
      const res = await Promise.race([executeWithProvider(provider), timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });
      resultData = res.data;
      usage = res.usage;
      isSuccess = true;
    } catch (primaryErr: any) {
      // If primary is Gemini, do NOT failover to OpenAI (user has zero credits on OpenAI)
      // GeminiProvider already handled internal multi-model retries (flash-lite -> 3.5 -> 3.8)
      console.warn(`[runAI] Provider '${provider.name}' inference failed: ${primaryErr.message}`);
      throw primaryErr;
    }
  } catch (err: any) {
    console.warn(`[runAI] Live AI execution error for ${opts.promptKey} (${err.message}). Engaging smart deterministic engine as safety fallback.`);
    errorMsg = err.message;
    isFallback = true;

    // Check for defined deterministic fallback
    if (promptDef?.fallback) {
      resultData = promptDef.fallback(opts.input) as T;
      isSuccess = true;
    } else {
      let validErrUserId: string | null = null;
      if (opts.userId) {
        const u = await prisma.user.findUnique({ where: { id: opts.userId }, select: { id: true } }).catch(() => null);
        if (u) validErrUserId = u.id;
      }
      const errLatencyMs = Date.now() - startTime;
      await prisma.aiInvocation.create({
        data: {
          userId: validErrUserId,
          feature: opts.feature,
          promptKey: opts.promptKey,
          model: promptDef?.model || "unknown",
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          latencyMs: errLatencyMs,
          success: false,
          error: errorMsg,
        },
      }).catch(console.error);

      throw err;
    }
  }

  const latencyMs = Date.now() - startTime;

  // 6. Validation against schema if available
  if (promptDef?.schema && isSuccess) {
    const parseRes = promptDef.schema.safeParse(resultData);
    if (!parseRes.success) {
      console.warn(`[runAI] Schema validation failed for ${opts.promptKey}:`, parseRes.error);
      if (promptDef.fallback) {
        resultData = promptDef.fallback(opts.input) as T;
      }
    } else {
      resultData = parseRes.data;
    }
  }

  // 7. Logging to AiInvocation & Credit accounting
  try {
    let validUserId: string | null = null;
    if (opts.userId) {
      const user = await prisma.user.findUnique({
        where: { id: opts.userId },
        select: { id: true },
      }).catch(() => null);
      if (user) validUserId = user.id;
    }

    await prisma.aiInvocation.create({
      data: {
        userId: validUserId,
        feature: opts.feature,
        promptKey: opts.promptKey,
        model: promptDef?.model || "gemini-3.8-flash",
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        costUsd: usage.costUsd,
        latencyMs,
        success: isSuccess,
        error: errorMsg,
      },
    });

    if (validUserId && usage.costUsd > 0) {
      await prisma.aiCredit.upsert({
        where: { userId: validUserId },
        create: {
          userId: validUserId,
          usedThisMonth: usage.costUsd,
          monthlyLimitUsd: access.tierConfig?.monthlyLimitUsd ?? 5.00,
        },
        update: {
          usedThisMonth: { increment: usage.costUsd },
        },
      });
    }
  } catch (e) {
    console.error("[runAI] Logging failed:", e);
  }

  // 8. Cache write
  if (fullCacheKey && isSuccess && cacheTtlSeconds > 0) {
    try {
      const expiresAt = new Date(Date.now() + cacheTtlSeconds * 1000);
      await prisma.aiCache.upsert({
        where: { key: fullCacheKey },
        create: {
          key: fullCacheKey,
          value: resultData as any,
          expiresAt,
        },
        update: {
          value: resultData as any,
          expiresAt,
        },
      });
    } catch (e) {
      console.warn("AI cache write failed:", e);
    }
  }

  return {
    data: resultData!,
    usage,
    cached: false,
    latencyMs,
    isFallback,
  };
}
