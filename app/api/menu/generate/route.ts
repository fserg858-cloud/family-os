import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/menu/generate { preferences?: string, allergies?: string }
// Возвращает меню на 7 дней (завтрак/обед/ужин) + готовый список покупок
// сгруппированный по категориям. Учитывает возраст всех членов семьи.

export async function POST(req: NextRequest) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const preferences = String(body.preferences ?? "").slice(0, 500);
  const allergies = String(body.allergies ?? "").slice(0, 300);

  const { data: members } = await sb
    .from("users")
    .select("display_name, age, member_key")
    .order("age", { ascending: false });

  const memberLine = (members ?? [])
    .map((m: any) => `${m.display_name} (${m.age ?? "?"} лет, ${m.member_key})`)
    .join(", ");

  const claude = new Anthropic({ apiKey });
  const resp = await claude.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 3000,
    system:
      "Ты семейный диетолог-нутрициолог. Составляешь меню на неделю, учитывая возраст и нужды каждого. " +
      "Учитывай: достаточно белка (1.2-1.6 г/кг для взрослых), мало добавленных сахаров, цельные продукты, " +
      "разнообразие железа/Омега-3/клетчатки. Для бабушки — мягкая текстура, без жгучего. " +
      "Для подростка — быстрые перекусы между приёмами. Будь конкретен и реалистичен — это домашняя кухня, не ресторан.",
    messages: [
      {
        role: "user",
        content:
          `Семья: ${memberLine}.\n` +
          (preferences ? `Предпочтения: ${preferences}.\n` : "") +
          (allergies ? `Аллергии и непереносимости: ${allergies}.\n` : "") +
          `\nСоставь меню на 7 дней (понедельник-воскресенье). ` +
          `На каждый день: завтрак, обед, ужин (можно перекус). ` +
          `Затем — единый список покупок на всю неделю, сгруппированный по категориям ` +
          `(produce, dairy, meat, grain, bakery, household, other).\n\n` +
          `Верни СТРОГО валидный JSON без markdown:\n` +
          `{"days":[{"day":"Понедельник","breakfast":"...","lunch":"...","dinner":"...","snack":"..."}],` +
          `"shopping":[{"category":"produce","items":[{"item":"...","qty":"..."}]}],` +
          `"motivation":"короткое мотивационное сообщение для семьи"}`,
      },
    ],
  });

  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return NextResponse.json({ error: "menu parse failed", raw: text.slice(0, 500) }, { status: 500 });

  let parsed: any;
  try {
    parsed = JSON.parse(m[0]);
  } catch (e: any) {
    return NextResponse.json({ error: `JSON parse: ${e.message}`, raw: text.slice(0, 500) }, { status: 500 });
  }

  return NextResponse.json(parsed);
}
