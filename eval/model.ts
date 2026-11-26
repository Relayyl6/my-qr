// eval/model.ts
import { getAIProvider } from "../lib/ai/provider";

/**
 * Model execution wrapper for the evaluation harness.
 * Connects directly through the app's resilient AI provider cascade:
 * Default: Google Gemini (gemini-3.5-flash / gemini-2.5-flash) via @ai-sdk/google
 * Fallback: Neon AI Gateway / OpenAI (gpt-4o-mini) via @ai-sdk/openai
 */
export default async function callModel(system: string, user: string): Promise<string> {
  const provider = getAIProvider();
  
  const result = await provider.generateText({
    system,
    prompt: user,
    temperature: 0.2,
    feature: "landing-page-builder",
  });

  return result.text;
}
