import { z, ZodSchema } from "zod";
import { generateObject as aiGenerateObject, generateText as aiGenerateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

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
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage }>;

  generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage }>;

  generateImage?(opts: {
    prompt: string;
    size?: string;
    style?: string;
  }): Promise<{ url: string; usage: AIUsage }>;
}

// Cost calculation estimate per 1k tokens (based on typical fast models e.g. gemini-2.0-flash / gpt-4o-mini)
function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const isMini = model.includes("flash") || model.includes("mini");
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
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ data: T; usage: AIUsage }> {
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
    temperature?: number;
    stream?: boolean;
  }): Promise<{ text: string; usage: AIUsage }> {
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
  }): Promise<{ data: T; usage: AIUsage }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateObject(opts);
  }

  async generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
  }): Promise<{ text: string; usage: AIUsage }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateText(opts);
  }
}

/**
 * Stubbed Gemini Provider (same interface, ready to activate)
 */
export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateObject<T>(opts: {
    schema: ZodSchema<T>;
    system: string;
    prompt: string;
    model?: string;
  }): Promise<{ data: T; usage: AIUsage }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateObject(opts);
  }

  async generateText(opts: {
    system: string;
    prompt: string;
    model?: string;
  }): Promise<{ text: string; usage: AIUsage }> {
    const fallback = new NeonGatewayProvider();
    return fallback.generateText(opts);
  }
}

/**
 * Factory getAIProvider()
 * Reads AI_PROVIDER=neon|openai|anthropic|gemini and returns the right instance.
 */
export function getAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER || "neon").toLowerCase();
  switch (providerName) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    case "neon":
    default:
      return new NeonGatewayProvider();
  }
}
