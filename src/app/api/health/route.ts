import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getProviders } from "@/lib/llm";

export const dynamic = "force-dynamic";

/** Open /api/health to verify every key works (uses 1 request per provider). */
export async function GET() {
  const providers = getProviders();
  const results = await Promise.all(
    providers.map(async (p) => {
      const model = p.models[0];
      const t0 = Date.now();
      try {
        const client = new OpenAI({
          apiKey: p.apiKey!,
          baseURL: p.baseURL,
          maxRetries: 0,
          timeout: 20_000,
        });
        const r = await client.chat.completions.create({
          model,
          messages: [
            { role: "user", content: "Reply with the single word: OK" },
          ],
          max_tokens: 10,
        });
        return {
          provider: p.name,
          model,
          ok: true,
          ms: Date.now() - t0,
          reply: r.choices[0]?.message?.content?.trim(),
        };
      } catch (e) {
        return {
          provider: p.name,
          model,
          ok: false,
          ms: Date.now() - t0,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
  return NextResponse.json({
    configured: providers.map((p) => p.name),
    note: providers.length
      ? undefined
      : "No keys found. Create .env.local from .env.example",
    results,
  });
}
