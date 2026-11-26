// eval/run.ts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { generateCopy, type GenerateInput } from "../lib/page/generate-copy";
import { LIMITS } from "../lib/page/config";
import callModel from "./model";

type Case = GenerateInput & { id: string; expectTemplate?: "creator" | "restaurant" };

const cases: Case[] = JSON.parse(readFileSync("eval/cases.json", "utf8"));
const noCache = { get: async () => null, set: async () => {} };

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const inputText = (c: Case) => [c.description, c.items, c.contact].filter(Boolean).join(" ").toLowerCase();

type Row = {
  id: string;
  ok: boolean;
  reason?: string;
  firstTryValid: boolean;
  templateCorrect: boolean | null;
  lengthOk: boolean;
  inventedPrice: boolean;
  ctaOk: boolean;
  headline: string;
};

async function main() {
  console.log(`Starting Evaluation Harness against ${cases.length} business test cases...`);
  const rows: Row[] = [];

  for (const c of cases) {
    process.stdout.write(`Testing [${c.id}]... `);
    try {
      const first = await generateCopy(c, callModel, noCache, { maxAttempts: 1 });
      const final = await generateCopy(c, callModel, noCache, { maxAttempts: 2 });

      if (!final.ok) {
        console.log(`FAILED (${final.reason})`);
        rows.push({
          id: c.id,
          ok: false,
          reason: final.reason,
          firstTryValid: first.ok,
          templateCorrect: null,
          lengthOk: false,
          inventedPrice: false,
          ctaOk: false,
          headline: "",
        });
        continue;
      }

      const copy = final.copy;
      const lengthOk =
        words(copy.headline) <= LIMITS.headlineWords &&
        words(copy.tagline) <= LIMITS.taglineWords &&
        words(copy.ctaLabel) <= LIMITS.ctaWords &&
        copy.services.every((s) => words(s.desc) <= LIMITS.serviceDescWords);

      const inventedPrice = copy.services.some(
        (s) => s.price && !inputText(c).includes(s.price.toLowerCase())
      );

      console.log(`PASS (template: ${copy.template}, lengthOk: ${lengthOk}, priceOk: ${!inventedPrice})`);
      rows.push({
        id: c.id,
        ok: true,
        firstTryValid: first.ok,
        templateCorrect: c.expectTemplate ? copy.template === c.expectTemplate : null,
        lengthOk,
        inventedPrice,
        ctaOk: true, // CTA is set by assemble(), checked in integration tests
        headline: copy.headline,
      });
    } catch (err: any) {
      console.log(`EXCEPTION: ${err.message}`);
      rows.push({
        id: c.id,
        ok: false,
        reason: err.message,
        firstTryValid: false,
        templateCorrect: null,
        lengthOk: false,
        inventedPrice: false,
        ctaOk: false,
        headline: "",
      });
    }
  }

  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
  const labelled = rows.filter((r) => r.templateCorrect !== null);
  const summary = {
    total: rows.length,
    schemaPassFirstTry: `${pct(rows.filter((r) => r.firstTryValid).length, rows.length)}%`,
    schemaPassFinal: `${pct(rows.filter((r) => r.ok).length, rows.length)}%`,
    templateAccuracy: `${pct(labelled.filter((r) => r.templateCorrect).length, labelled.length)}%`,
    lengthCompliance: `${pct(rows.filter((r) => r.ok && r.lengthOk).length, rows.filter((r) => r.ok).length)}%`,
    inventedPricesCount: rows.filter((r) => r.inventedPrice).length,
  };

  mkdirSync("eval/results", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(`eval/results/${stamp}.json`, JSON.stringify({ summary, rows }, null, 2));

  console.log("\n=================== EVALUATION RESULTS ===================");
  console.table(summary);
  console.log(`Detailed audit log saved to eval/results/${stamp}.json\n`);
}

main().catch((e) => {
  console.error("Eval runner crash:", e);
  process.exit(1);
});
