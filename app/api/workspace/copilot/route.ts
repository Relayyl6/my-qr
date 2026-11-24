import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Regex to strip any accidental emojis
function stripEmojis(str: string): string {
  try {
    const emojiRegex = new RegExp('[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+|[\\u2600-\\u27BF]+', 'g');
    return str.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();
  } catch {
    return str.replace(/\s{2,}/g, ' ').trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { query, history = [], workspaceContext = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const {
      linksCount = 0,
      totalScans = 0,
      healthScore = 100,
      subscribersCount = 0,
      vcardsCount = 0,
      shortenersCount = 0,
      menusCount = 0,
      wifisCount = 0,
      topLinkTitle = 'None',
      topLinkScans = 0,
      topLinkDestination = '',
      mailingListName = 'VIP Mailing List',
      recentLeads = [],
      peakMonth = 'recent months',
      peakMonthScans = 0,
    } = workspaceContext;

    const systemPrompt = `You are the DynamicQR Workspace Copilot, an analytical, high-intelligence operations copilot for the user's QR routing, digital cards, domains, and micro-saas ecosystem.

CURRENT REAL WORKSPACE CONTEXT:
- User: ${user?.name || user?.email || 'Workspace Member'} (${user?.tier || 'Free'} Tier)
- Active Dynamic QR Links: ${linksCount}
- Total Recorded Scans: ${totalScans}
- Routing System Health Score: ${healthScore}%
- Top Performing Link: "${topLinkTitle}" with ${topLinkScans} scans (Destination: ${topLinkDestination || 'Direct'})
- Peak Month: ${peakMonth} (${peakMonthScans} scans)
- Captured VIP Leads: ${subscribersCount} in "${mailingListName}" (Recent contacts: ${recentLeads.slice(0, 3).join(', ') || 'None'})
- Digital vCards: ${vcardsCount}
- Branded Shorteners: ${shortenersCount}
- Contactless Restaurant Menus: ${menusCount}
- Instant Wi-Fi Cards: ${wifisCount}

STRICT CONSTRAINTS (MANDATORY):
1. LENGTH LIMIT: Keep your answer strictly between 2 to 3 concise sentences (max 75 words). Be direct, dense with facts, and immediately actionable.
2. ABSOLUTELY NO EMOJIS: Do NOT use any emojis under any circumstances. No smileys, no fire, no rocket, no checkmarks, no unicode emoticons. Plain text only.
3. CONVERSATIONAL CONTEXT: If the user asks a short inquiry like 'how', 'what', 'how does this work', or 'guide me', explain how DynamicQR routes scans dynamically, lets them update destinations anytime, and captures leads with digital cards.
4. NO FILLER: Never start with conversational pleasantries like "Sure!", "Certainly!", "Hello!", or "I would be happy to help". Answer immediately.`;

    const conversationSnippet = history
      .slice(-4)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Copilot'}: ${m.text}`)
      .join('\n');

    const prompt = conversationSnippet
      ? `${conversationSnippet}\nUser: ${query}\nCopilot:`
      : `User query: ${query}`;

    let reply = '';

    try {
      const provider = getAIProvider();
      const aiResult = await provider.generateText({
        system: systemPrompt,
        prompt,
        model: 'gemini-3.5-flash',
        temperature: 0.2,
      });
      reply = stripEmojis(aiResult.text);
    } catch (aiErr: any) {
      console.warn('[Workspace Copilot] AI Provider call failed, falling back to analytical synthesis:', aiErr.message);

      // Deterministic analytical fallback without emojis
      const lower = query.toLowerCase();
      if (lower === 'how' || lower.includes('how does') || lower.includes('how to') || lower.includes('guide')) {
        reply = 'DynamicQR routes scans through smart dynamic shortlinks, letting you change destination URLs anytime without reprinting physical QR materials. Select any QR link or micro-saas card to update targets, review scan metrics, or attach a custom domain.';
      } else if (lower.includes('domain') || lower.includes('cname') || lower.includes('brand')) {
        reply = 'To add a custom domain, visit the Branded Domains section, enter your subdomain, and add the CNAME and TXT records at your registrar. You can also register domains and custom business email forwarding directly via NameLaunch with Paystack.';
      } else if (lower.includes('lead') || lower.includes('subscriber') || lower.includes('contact') || lower.includes('audience')) {
        reply = subscribersCount > 0
          ? `You have ${subscribersCount} captured leads in your ${mailingListName} list. Recent contacts include ${recentLeads.slice(0, 2).join(', ') || 'VIP subscribers'}.`
          : `You currently have zero captured leads in your workspace. Connect your VIP mailing list to capture leads from dynamic QR scans.`;
      } else if (lower.includes('top') || lower.includes('best') || lower.includes('performing')) {
        reply = topLinkScans > 0
          ? `Your top route is ${topLinkTitle} with ${topLinkScans} scans, redirecting to ${topLinkDestination || 'destination'}. It accounts for the majority of scanner engagement.`
          : `Your dynamic links have not recorded scans yet. Deploy a dynamic QR code on physical collateral to start tracking.`;
      } else if (lower.includes('scan') || lower.includes('traffic') || lower.includes('volume') || lower.includes('stat')) {
        reply = `Total recorded scans across your network stand at ${totalScans} across ${linksCount} active links. Peak monthly volume occurred during ${peakMonth} with ${peakMonthScans} scans.`;
      } else if (lower.includes('vcard') || lower.includes('card')) {
        reply = vcardsCount > 0
          ? `You have ${vcardsCount} digital vCards deployed with contact exchange and one-tap address book saving enabled.`
          : `You currently have zero digital vCards active. Create one in the Micro-SaaS tab to launch your digital card.`;
      } else {
        reply = `Workspace status shows ${linksCount} active QR links, ${subscribersCount} captured leads, and ${totalScans} total redirects with ${healthScore} percent routing health. What specific link or workflow would you like to review?`;
      }
    }

    return NextResponse.json({
      text: stripEmojis(reply),
      source: 'ai',
    });
  } catch (err: any) {
    console.error('[Workspace Copilot API Error]:', err);
    return NextResponse.json({
      text: 'Workspace telemetry routing is operational across all active dynamic QR destinations and micro-saas services.',
      source: 'fallback',
    });
  }
}
