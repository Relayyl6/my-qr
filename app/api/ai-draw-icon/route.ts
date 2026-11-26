import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Built-in crisp SVG 24x24 single/compound paths for reliable procedural fallbacks
const PROCEDURAL_ICONS: Record<string, string> = {
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-1.5 5-1.5 M15 9v5s3.03-.55 4.5-2c1.63-1.62 1.5-5 1.5-5',
  crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z',
  diamond: 'M6 3h12l4 7-10 11L2 10l4-7zm0 0l4 7m4-7l-4 7m4-7l4 7M2 10h20',
  robot: 'M12 2v2 M4 11a8 8 0 0 1 16 0v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z M9 13h.01 M15 13h.01 M9 17h6',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.88-1.5-2.5-2-4-.5 1.5-2 2.12-2 4z M12 2c-4 5-8 7.5-8 12a8 8 0 0 0 16 0c0-4.5-4-7-8-12z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  music: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  sparkles: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  car: 'M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z M5 17H3v-4l2-5h14l2 5v4h-2m-8 0h4',
  trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34 M18 2H6v7a6 6 0 0 0 12 0V2z',
  coffee: 'M10 2v2 M14 2v2 M17 8h1a4 4 0 1 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
  burger: 'M3 11c0-4 4-7 9-7s9 3 9 7 M3 15h18 M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1H3v1z',
  globe: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-9.9-10h19.8M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const normalizedPrompt = prompt.toLowerCase();

    // Check procedural lookup first for instant instant return if exact keyword matches
    for (const [key, path] of Object.entries(PROCEDURAL_ICONS)) {
      if (normalizedPrompt === key || normalizedPrompt.includes(key)) {
        return NextResponse.json({
          success: true,
          name: key,
          svgPath: path,
          source: 'library',
        });
      }
    }

    // Attempt AI Generation using configured AI Provider
    try {
      const provider = getAIProvider();
      const systemPrompt = `You are a precision SVG icon designer. You generate minimalist, stroke-friendly SVG path strings designed for a 24x24 viewBox.
Strict Rules:
1. Output ONLY the raw SVG path 'd' attribute string (e.g. M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5).
2. The entire icon MUST fit inside the 24x24 box (coordinates between 1 and 23).
3. Do not include markdown, tags, <svg>, or explanation. ONLY the path data string.
4. Keep the design simple, geometric, and clear at small sizes (like Lucide / Heroicons).`;

      const result = await provider.generateText({
        system: systemPrompt,
        prompt: `Create a clean 24x24 SVG path for: "${prompt}"`,
        temperature: 0.2,
      });

      let pathStr = (result.text || '').trim();
      // Clean accidental quotes or markdown code blocks
      pathStr = pathStr.replace(/```(?:svg|xml|path)?/gi, '').replace(/```/g, '').trim();
      // If AI wrapped it in <path d="..." />, extract the d value
      const match = pathStr.match(/d=["']([^"']+)["']/i);
      if (match) {
        pathStr = match[1];
      }

      if (pathStr && pathStr.length > 5 && pathStr.toUpperCase().includes('M')) {
        return NextResponse.json({
          success: true,
          name: prompt,
          svgPath: pathStr,
          source: 'ai',
        });
      }
    } catch (aiErr) {
      console.warn('AI icon generation skipped/fallback:', aiErr);
    }

    // Fallback: Pick closest procedural icon or a stylized spark badge
    const fallbackPath = PROCEDURAL_ICONS.sparkles;
    return NextResponse.json({
      success: true,
      name: prompt,
      svgPath: fallbackPath,
      source: 'procedural-fallback',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate icon' },
      { status: 500 }
    );
  }
}
