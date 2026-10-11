import { prisma } from "@/lib/prisma";
import { AIFeatureName, assertFeatureAccess } from "./flags";
import { getAIProvider, AIUsage } from "./provider";
import { getPrompt, PromptDefinition } from "./prompts";

export interface AIResult<T> {
  data: T;
  usage: AIUsage;
  cached: boolean;
  latencyMs: number;
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

  // 2. Rate limit check (Max 30 calls/minute per user/feature)
  if (opts.userId) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCalls = await prisma.aiInvocation.count({
      where: {
        userId: opts.userId,
        feature: opts.feature,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentCalls >= 30) {
      throw new Error("Rate limit exceeded for this feature. Please wait a minute before retrying.");
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

  // 4. Cost budget guard
  if (opts.userId) {
    const credit = await prisma.aiCredit.findUnique({
      where: { userId: opts.userId },
    });

    if (credit && Number(credit.usedThisMonth) >= Number(credit.monthlyLimitUsd)) {
      throw new Error(
        `Monthly AI budget of $${credit.monthlyLimitUsd.toFixed(2)} reached. Please upgrade your plan.`
      );
    }
  }

  // 5. Provider call & fallback resolution
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

  try {
    if (promptDef?.schema) {
      const res = await provider.generateObject<T>({
        schema: promptDef.schema,
        system,
        prompt: userPrompt,
        model: promptDef.model,
        temperature: promptDef.temperature,
      });
      resultData = res.data;
      usage = res.usage;
    } else {
      const res = await provider.generateText({
        system,
        prompt: userPrompt,
        model: promptDef?.model,
        temperature: promptDef?.temperature,
      });
      resultData = res.text as unknown as T;
      usage = res.usage;
    }
    isSuccess = true;
  } catch (err: any) {
    console.warn(`[runAI] Provider '${provider.name}' call failed for ${opts.promptKey}:`, err.message);
    errorMsg = err.message;

    // Check for defined deterministic fallback
    if (promptDef?.fallback) {
      console.info(`[runAI] Applying graceful fallback for ${opts.promptKey}`);
      resultData = promptDef.fallback(opts.input) as T;
      isSuccess = true;
    } else {
      // Log failed invocation before throwing
      const latencyMs = Date.now() - startTime;
      await prisma.aiInvocation.create({
        data: {
          userId: opts.userId ?? null,
          feature: opts.feature,
          promptKey: opts.promptKey,
          model: promptDef?.model || "unknown",
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          latencyMs,
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
    await prisma.aiInvocation.create({
      data: {
        userId: opts.userId ?? null,
        feature: opts.feature,
        promptKey: opts.promptKey,
        model: promptDef?.model || "default",
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        costUsd: usage.costUsd,
        latencyMs,
        success: isSuccess,
        error: errorMsg,
      },
    });

    if (opts.userId && usage.costUsd > 0) {
      await prisma.aiCredit.upsert({
        where: { userId: opts.userId },
        create: {
          userId: opts.userId,
          usedThisMonth: usage.costUsd,
          monthlyLimitUsd: 5.00,
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
  };
}
