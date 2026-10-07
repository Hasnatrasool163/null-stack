/**
 * One LLM wrapper for the whole app (server-side only).
 * - Groq, Gemini and OpenRouter all speak the OpenAI API, so one SDK covers them.
 * - Tries providers/models in order; if one is rate-limited or down, falls to the next.
 * - structured() gives you validated JSON via zod, with one automatic repair retry.
 * - Optional in-memory cache so repeated demo inputs never burn quota.
 */
import OpenAI from "openai";
import type { ZodType } from "zod";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
export type ChatOptions = {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  cache?: boolean;
  timeoutMs?: number;
};
export type ChatResult = {
  text: string;
  provider: string;
  model: string;
  cached?: boolean;
};

type Provider = {
  name: string;
  baseURL: string;
  apiKey?: string;
  models: string[];
};

const list = (v: string | undefined, fallback: string[]) =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

export function getProviders(): Provider[] {
  const all: Record<string, Provider> = {
    groq: {
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      models: list(process.env.GROQ_MODELS, ["llama-3.3-70b-versatile"]),
    },
    gemini: {
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: process.env.GEMINI_API_KEY,
      models: list(process.env.GEMINI_MODELS, ["gemini-2.5-flash"]),
    },
    openrouter: {
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      models: list(process.env.OPENROUTER_MODELS, [
        "meta-llama/llama-3.3-70b-instruct:free",
      ]),
    },
  };
  return list(process.env.LLM_PROVIDER_ORDER, ["groq", "gemini", "openrouter"])
    .map((n) => all[n])
    .filter((p): p is Provider => !!p && !!p.apiKey);
}

const cache = new Map<string, ChatResult>();

async function callOne(
  p: Provider,
  model: string,
  messages: ChatMessage[],
  o: ChatOptions,
): Promise<string> {
  const client = new OpenAI({
    apiKey: p.apiKey!,
    baseURL: p.baseURL,
    maxRetries: 0,
    timeout: o.timeoutMs ?? 30_000,
  });
  const base = {
    model,
    messages,
    temperature: o.temperature ?? 0.4,
    max_tokens: o.maxTokens ?? 1500,
  };
  try {
    const res = await client.chat.completions.create(
      o.json
        ? { ...base, response_format: { type: "json_object" as const } }
        : base,
    );
    return res.choices[0]?.message?.content ?? "";
  } catch (e) {
    // some models reject response_format: retry once without it
    if (o.json && e instanceof OpenAI.APIError && e.status === 400) {
      const res = await client.chat.completions.create(base);
      return res.choices[0]?.message?.content ?? "";
    }
    throw e;
  }
}

export async function chat(
  messages: ChatMessage[],
  o: ChatOptions = {},
): Promise<ChatResult> {
  const key = o.cache ? JSON.stringify([messages, o.json, o.temperature]) : "";
  if (key && cache.has(key)) return { ...cache.get(key)!, cached: true };

  const providers = getProviders();
  if (!providers.length) {
    throw new Error(
      "No LLM API key found. Copy .env.example to .env.local and add a key.",
    );
  }

  const errors: string[] = [];
  for (const p of providers) {
    for (const model of p.models) {
      try {
        const text = await callOne(p, model, messages, o);
        if (!text.trim()) throw new Error("empty response");
        const result = { text, provider: p.name, model };
        if (key) cache.set(key, result);
        return result;
      } catch (e) {
        errors.push(
          `${p.name}/${model}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }
  throw new Error("All LLM providers failed:\n" + errors.join("\n"));
}

/** Pull a JSON object out of a model reply (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const t = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
    throw new Error("No JSON found in model reply");
  }
}

/** Ask for JSON that matches a zod schema. Retries once with the validation error. */
export async function structured<T>(
  schema: ZodType<T>,
  messages: ChatMessage[],
  o: Omit<ChatOptions, "json"> = {},
): Promise<T & {}> {
  let msgs = messages;
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await chat(msgs, { ...o, json: true });
    try {
      const parsed = schema.safeParse(extractJson(r.text));
      if (parsed.success) return parsed.data as T & {};
      lastErr = parsed.error.message;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
    msgs = [
      ...messages,
      { role: "assistant", content: r.text },
      {
        role: "user",
        content: `That was invalid: ${lastErr}\nReturn ONLY corrected JSON that matches the schema.`,
      },
    ];
  }
  throw new Error("Model did not return valid JSON: " + lastErr);
}
