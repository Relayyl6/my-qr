import { ZodType } from "zod";

export interface PromptDefinition<TInput = any, TOutput = any> {
  version: string;
  system: string;
  buildUserPrompt: (input: TInput) => string;
  schema?: ZodType<TOutput, any, any>;
  model: string;
  temperature?: number;
  cacheTtlSeconds?: number;
  fallback?: (input: TInput) => TOutput;
}

declare global {
  var __aiPromptRegistry: Map<string, PromptDefinition> | undefined;
}

function getRegistry(): Map<string, PromptDefinition> {
  if (!globalThis.__aiPromptRegistry) {
    globalThis.__aiPromptRegistry = new Map<string, PromptDefinition>();
  }
  return globalThis.__aiPromptRegistry;
}

export function registerPrompt<TInput, TOutput>(
  key: string,
  definition: PromptDefinition<TInput, TOutput>
) {
  getRegistry().set(key, definition);
}

export function getPrompt(key: string): PromptDefinition | undefined {
  return getRegistry().get(key);
}

// Auto-register built-in prompts on module initialization
import "./campaign-analyst.v1";
import "./campaign-orchestrator.v1";
import "./landing-page-builder.v1";
import "./qr-artist.v1";
import "./route-resolver.v1";
import "./url-enricher.v1";
