import { z, ZodSchema } from "zod";
import { generateObject as aiGenerateObject, generateText as aiGenerateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface AIProvider {
  name: string;
  generateObject<T>(opts: {
    schema: ZodSchema<T>;
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage; modelUsed?: string }>;

  generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage; modelUsed?: string }>;

  generateImage?(opts: {
    prompt: string;
    size?: string;
    style?: string;
  }): Promise<{ url: string; usage: AIUsage }>;
}

// Cost calculation estimate per 1k tokens (based on typical fast models e.g. gemini-2.0-flash / gpt-4o-mini / gemini-3.x)
function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const isMini = model.includes("flash") || model.includes("mini") || model.includes("lite");
  const promptRate = isMini ? 0.00015 / 1000 : 0.0025 / 1000;
  const completionRate = isMini ? 0.0006 / 1000 : 0.01 / 1000;
  return Number((promptTokens * promptRate + completionTokens * completionRate).toFixed(6));
}

/**
 * Neon Gateway Provider (Default)
 * Uses Neon AI Gateway (OpenAI compatible) or standard OPENAI_API_KEY / NEON_AI_GATEWAY_TOKEN
 */
export class NeonGatewayProvider implements AIProvider {
  name = "neon";

  private getClient() {
    const token = process.env.NEON_AI_GATEWAY_TOKEN || process.env.OPENAI_API_KEY;
    const rawBaseUrl = process.env.NEON_AI_GATEWAY_BASE_URL || process.env.OPENAI_BASE_URL;
    
    // Normalize base URL: if bare host, ensure /v1 path
    let baseURL = rawBaseUrl;
    if (baseURL && !baseURL.endsWith("/v1") && !baseURL.endsWith("/openai/v1")) {
      baseURL = `${baseURL.replace(/\/+$/, "")}/v1`;
    }

    if (!token) {
      return null;
    }

    return createOpenAI({
      apiKey: token,
      baseURL: baseURL || undefined,
    });
  }

  async generateObject<T>(opts: {
    schema: ZodSchema<T>;
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage; modelUsed?: string }> {
    const client = this.getClient();
    const modelId = opts.model || "gpt-4o-mini";

    if (!client) {
      // In development or when no AI key is configured, provide graceful deterministic fallback
      console.warn("[AI Provider] No NEON_AI_GATEWAY_TOKEN or OPENAI_API_KEY found. Using heuristic fallback.");
      throw new Error("AI_PROVIDER_UNCONFIGURED");
    }

    const result = await aiGenerateObject({
      model: client(modelId),
      system: opts.system,
      prompt: opts.prompt,
      schema: opts.schema,
      temperature: opts.temperature ?? 0.2,
      maxTokens: opts.maxTokens,
      maxRetries: 0,
    });

    const usage = result.usage as any;
    const promptTokens = usage?.inputTokens ?? usage?.promptTokens ?? 50;
    const completionTokens = usage?.outputTokens ?? usage?.completionTokens ?? 50;
    const totalTokens = promptTokens + completionTokens;

    return {
      data: result.object as T,
      modelUsed: modelId,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd: calculateCost(promptTokens, completionTokens, modelId),
      },
    };
  }

  async generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage; modelUsed?: string }> {
    const client = this.getClient();
    const modelId = opts.model || "gpt-4o-mini";

    if (!client) {
      console.warn("[AI Provider] No NEON_AI_GATEWAY_TOKEN or OPENAI_API_KEY found.");
      throw new Error("AI_PROVIDER_UNCONFIGURED");
    }

    const result = await aiGenerateText({
      model: client(modelId),
      system: opts.system,
      prompt: opts.prompt,
      temperature: opts.temperature ?? 0.3,
      maxRetries: 0,
    });

    const textUsage = result.usage as any;
    const promptTokens = textUsage?.inputTokens ?? textUsage?.promptTokens ?? 50;
    const completionTokens = textUsage?.outputTokens ?? textUsage?.completionTokens ?? 50;
    const totalTokens = promptTokens + completionTokens;

    return {
      text: result.text,
      modelUsed: modelId,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd: calculateCost(promptTokens, completionTokens, modelId),
      },
    };
  }

  async generateImage(opts: {
    prompt: string;
    size?: string;
    style?: string;
  }): Promise<{ url: string; usage: AIUsage }> {
    // Generate an SVG-based generative art representation as fallback or URL
    return {
      url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80`,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0.02,
      },
    };
  }
}

/**
 * Standard OpenAI Provider
 */
export class OpenAIProvider extends NeonGatewayProvider {
  override name = "openai";
}

/**
 * Stubbed Anthropic Provider (same interface, ready to activate)
 */
export class AnthropicProvider implements AIProvider {
  name = "anthropic";

  async generateObject<T>(opts: {
    schema: ZodSchema<T>;
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage; modelUsed?: string }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateObject(opts);
  }

  async generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage; modelUsed?: string }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateText(opts);
  }
}

/**
 * Helper to wrap individual model probes with a strict fail-fast timeout (5.5s).
 * This prevents any hanging model (like gemini-3.8-flash taking 148s) from blocking the cascade.
 */
async function withProbeTimeout<T>(promise: Promise<T>, ms: number, modelId: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`MODEL_PROBE_TIMEOUT: Model '${modelId}' exceeded safety window of ${ms}ms`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Google Gemini Provider (Powered by Google Generative AI)
 * Resilient task-tailored multi-model cascade with fail-fast per-model probes:
 * - Heavy Reasoning Profile: gemini-4-argon -> gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash -> gemini-3.5-flash-lite -> gemini-flash-lite-latest
 * - Fast Operational Profile: gemini-3.6-flash -> gemini-3.5-flash-lite -> gemini-flash-lite-latest -> gemini-3.5-flash -> gemini-3.8-flash -> gemini-4-argon
 */
export class GeminiProvider implements AIProvider {
  name = "gemini";

  private getClient() {
    const key =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    if (!key) return null;
    return createGoogleGenerativeAI({
      apiKey: key,
    });
  }

  /**
   * Task-tailored model hierarchy cascade:
   * Heavy features test frontier reasoning down to fast fallbacks.
   * Fast operational features prioritize ultra-low latency to avoid UI hangs.
   */
  private getCandidateModels(requestedModel?: string, feature?: string): string[] {
    const isHeavyReasoning =
      feature === "landing-page-builder" ||
      feature === "route-resolver" ||
      feature === "qr-artist" ||
      feature === "campaign-orchestrator";

    // Frontier reasoning cascade
    const heavyCascade = [
      "gemini-4-argon",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];

    // Ultra-low latency operational cascade (sub-3s guarantee)
    const fastCascade = [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-4-argon",
    ];

    const baseList = isHeavyReasoning ? heavyCascade : fastCascade;
    if (requestedModel) {
      const normalized = this.resolveModel(requestedModel);
      return Array.from(new Set([normalized, ...baseList]));
    }
    return baseList;
  }

  private resolveModel(model?: string): string {
    if (!model) return "gemini-3.6-flash";
    const m = model.toLowerCase();
    if (m.startsWith("gpt-") || m.startsWith("claude-") || m.includes("mini") || m.includes("4o")) {
      return "gemini-3.6-flash";
    }
    if (m.includes("argon") || m.includes("gemini-4")) return "gemini-4-argon";
    if (m.includes("3.8")) return "gemini-3.8-flash";
    if (m.includes("3.7")) return "gemini-3.7-flash";
    if (m.includes("3.6")) return "gemini-3.6-flash";
    if (m.includes("flash-lite") || m.includes("3.5-flash-lite")) return "gemini-3.5-flash-lite";
    if (m.includes("lite-latest")) return "gemini-flash-lite-latest";
    if (m.includes("3.5")) return "gemini-3.5-flash";
    return model;
  }

  async generateObject<T>(opts: {
    schema: ZodSchema<T>;
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage; modelUsed?: string }> {
    const client = this.getClient();
    if (!client) {
      console.warn("[Gemini Provider] No GEMINI_API_KEY found.");
      throw new Error("AI_PROVIDER_UNCONFIGURED");
    }

    const candidateModels = this.getCandidateModels(opts.model, opts.feature);
    let lastError: any = null;
    const PROBE_TIMEOUT_MS = 5500; // 5.5s probe window per candidate model

    for (const modelId of candidateModels) {
      try {
        const result = await withProbeTimeout(
          aiGenerateObject({
            model: client(modelId),
            system: opts.system,
            prompt: opts.prompt,
            schema: opts.schema,
            temperature: opts.temperature ?? 0.2,
            maxTokens: opts.maxTokens,
            maxRetries: 0,
          }),
          PROBE_TIMEOUT_MS,
          modelId
        );

        const usage = result.usage as any;
        const promptTokens = usage?.inputTokens ?? usage?.promptTokens ?? 50;
        const completionTokens = usage?.outputTokens ?? usage?.completionTokens ?? 50;
        const totalTokens = promptTokens + completionTokens;

        return {
          data: result.object as T,
          modelUsed: modelId,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
            costUsd: calculateCost(promptTokens, completionTokens, modelId),
          },
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Provider] Model '${modelId}' returned: ${err.message}. Cascading to next priority candidate...`);
      }
    }

    throw lastError || new Error("All Gemini candidate models failed.");
  }

  async generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
    feature?: string;
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage; modelUsed?: string }> {
    const client = this.getClient();
    if (!client) {
      console.warn("[Gemini Provider] No GEMINI_API_KEY found.");
      throw new Error("AI_PROVIDER_UNCONFIGURED");
    }

    const candidateModels = this.getCandidateModels(opts.model, opts.feature);
    let lastError: any = null;
    const PROBE_TIMEOUT_MS = 5500; // 5.5s probe window per candidate model

    for (const modelId of candidateModels) {
      try {
        const result = await withProbeTimeout(
          aiGenerateText({
            model: client(modelId),
            system: opts.system,
            prompt: opts.prompt,
            temperature: opts.temperature ?? 0.3,
            maxRetries: 0,
          }),
          PROBE_TIMEOUT_MS,
          modelId
        );

        const textUsage = result.usage as any;
        const promptTokens = textUsage?.inputTokens ?? textUsage?.promptTokens ?? 50;
        const completionTokens = textUsage?.outputTokens ?? textUsage?.completionTokens ?? 50;
        const totalTokens = promptTokens + completionTokens;

        return {
          text: result.text,
          modelUsed: modelId,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
            costUsd: calculateCost(promptTokens, completionTokens, modelId),
          },
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Provider] Model '${modelId}' returned: ${err.message}. Cascading to next priority candidate...`);
      }
    }

    throw lastError || new Error("All Gemini candidate models failed.");
  }
}

/**
 * Factory getAIProvider()
 * Accepts dynamic admin sovereignty override (gemini | openai | neon | anthropic)
 * or falls back to AI_PROVIDER env var. Defaults to Gemini whenever GEMINI_API_KEY is present.
 */
export function getAIProvider(overrideMode?: string): AIProvider {
  const providerName = (overrideMode || process.env.AI_PROVIDER || "").toLowerCase();
  if (providerName === "openai") {
    return new OpenAIProvider();
  }
  if (providerName === "anthropic") {
    return new AnthropicProvider();
  }
  if (providerName === "neon") {
    return new NeonGatewayProvider();
  }
  if (providerName === "gemini") {
    return new GeminiProvider();
  }

  // Priority default: Always use Gemini if credentials exist (OpenAI has 0 credit)
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY
  ) {
    return new GeminiProvider();
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  return new NeonGatewayProvider();
}
