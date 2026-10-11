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

const registry = new Map<string, PromptDefinition>();

export function registerPrompt<TInput, TOutput>(
  key: string,
  definition: PromptDefinition<TInput, TOutput>
) {
  registry.set(key, definition);
}

export function getPrompt(key: string): PromptDefinition | undefined {
  return registry.get(key);
}
