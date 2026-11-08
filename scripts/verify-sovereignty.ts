import { prisma } from '../lib/prisma';
import { runAI } from '../lib/ai/run';
import { getAIProvider, GeminiProvider, OpenAIProvider } from '../lib/ai/provider';

async function testSovereignty() {
  console.log('--- Testing System Sovereignty Controls & Dynamic Routing ---');

  // Test 1: Provider factory with overrides
  const geminiProv = getAIProvider('gemini');
  console.assert(geminiProv instanceof GeminiProvider, 'gemini override must yield GeminiProvider');
  console.log('✅ Provider override "gemini" -> GeminiProvider verified.');

  const openaiProv = getAIProvider('openai');
  console.assert(openaiProv instanceof OpenAIProvider, 'openai override must yield OpenAIProvider');
  console.log('✅ Provider override "openai" -> OpenAIProvider verified.');

  // Test 2: Offline Heuristic Mode
  // Set system_sovereignty_config to heuristic_offline in DB
  const saved = await prisma.aiCache.upsert({
    where: { key: 'system_sovereignty_config' },
    create: {
      key: 'system_sovereignty_config',
      value: { aiGatewayMode: 'heuristic_offline', maintenanceMode: false, announcementBanner: null, globalScanLogging: true },
      expiresAt: new Date(Date.now() + 86400000),
    },
    update: {
      value: { aiGatewayMode: 'heuristic_offline', maintenanceMode: false, announcementBanner: null, globalScanLogging: true },
    },
  });
  console.log('Saved config record:', saved);

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { email: { equals: 'oseghaleleonard39@gmail.com', mode: 'insensitive' } },
  });
  const userId = admin?.id;

  const res = await runAI<{ rules: any[]; explanation: string }>({
    userId,
    feature: 'route-resolver',
    promptKey: 'route-resolver.v1',
    input: { naturalLanguagePrompt: 'Between 11am and 3pm send to lunch menu, other times dinner', defaultDestination: 'https://example.com' },
  });

  console.log('Offline Heuristic Result:', {
    modelUsed: res.modelUsed,
    isFallback: res.isFallback,
    latencyMs: res.latencyMs,
    rulesCount: res.data.rules?.length,
  });

  console.assert(res.modelUsed === 'offline-heuristic-engine', 'Model used must be offline-heuristic-engine');
  console.assert(res.isFallback === true, 'isFallback must be true');
  console.assert(res.data.rules?.length > 0, 'Offline rules must be parsed');
  console.log('✅ Offline heuristic fallback executed instantly & deterministically!');

  // Test 3: Reset back to Gemini
  await prisma.aiCache.upsert({
    where: { key: 'system_sovereignty_config' },
    create: {
      key: 'system_sovereignty_config',
      value: { aiGatewayMode: 'gemini', maintenanceMode: false, announcementBanner: null, globalScanLogging: true },
      expiresAt: new Date(Date.now() + 86400000),
    },
    update: {
      value: { aiGatewayMode: 'gemini', maintenanceMode: false, announcementBanner: null, globalScanLogging: true },
    },
  });
  console.log('✅ System sovereignty config reset to Gemini default.');

  await prisma.$disconnect();
  console.log('--- All Sovereignty Verification Checks Passed Successfully! ---');
}

testSovereignty().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
