import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, buildUserContext } from "@/lib/agent/context";
import { findSimilarDecision, saveDecision, upsertPattern } from "@/lib/agent/memory";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-7";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey });

  const cachedDecision = await findSimilarDecision(user.id, message);

  const ctx = await buildUserContext(user.id);
  const systemPrompt = buildSystemPrompt(ctx);

  // История разговора: одна строка per-user в ai_conversations с messages jsonb
  const { data: convData } = await supabase
    .from("ai_conversations")
    .select("messages")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(convData?.messages)
    ? convData!.messages
    : [];

  const messages = [...history.slice(-20), { role: "user" as const, content: message }];

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            (chunk.delta as any).type === "text_delta"
          ) {
            const text = (chunk.delta as any).text as string;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err?.message ?? "Stream error" })}\n\n`),
        );
        controller.close();
        return;
      }

      // Парсим AGENT_META
      const metaMatch = fullResponse.match(/<!--AGENT_META\n([\s\S]*?)\n-->/);
      if (metaMatch) {
        try {
          const meta = JSON.parse(metaMatch[1]);
          if (Array.isArray(meta.patterns)) {
            await Promise.all(
              meta.patterns.map((p: any) =>
                upsertPattern(user.id, p.key, p.type ?? "behavior", p.data ?? {}, 0.05),
              ),
            );
          }
        } catch {
          /* ignore */
        }
      }

      const cleanResponse = fullResponse.replace(/<!--AGENT_META[\s\S]*?-->/, "").trim();

      // Обновляем единый row истории на пользователя
      const updatedHistory = [...messages, { role: "assistant" as const, content: cleanResponse }];
      const sliced = updatedHistory.slice(-50);
      const { data: existingConv } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingConv) {
        await supabase
          .from("ai_conversations")
          .update({ messages: sliced, content: cleanResponse, role: "assistant" })
          .eq("id", existingConv.id);
      } else {
        await supabase.from("ai_conversations").insert({
          user_id: user.id,
          role: "assistant",
          content: cleanResponse,
          messages: sliced,
        });
      }

      // Записываем фрагмент в ai_memory (используем и старые, и новые поля)
      await supabase.from("ai_memory").insert({
        user_id: user.id,
        memory_type: "context",
        content: `Q: ${message.slice(0, 200)}\nA: ${cleanResponse.slice(0, 500)}`,
        key: `context_${Date.now()}`,
        value: cleanResponse.slice(0, 500),
        importance: 3,
      });

      // Сохраняем решение
      await saveDecision(
        user.id,
        message,
        cleanResponse,
        "",
        {
          habits: ctx.habits_summary.length,
          goals: ctx.goals_active.length,
          patterns: ctx.top_patterns.length,
        },
      );

      // Если использовали кэш — инкрементируем счётчик использования
      if (cachedDecision) {
        await supabase
          .from("agent_decisions")
          .update({ used_count: (cachedDecision.used_count ?? 0) + 1 })
          .eq("id", cachedDecision.id);
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
