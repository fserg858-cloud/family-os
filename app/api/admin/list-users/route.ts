import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/list-users?secret=CRON_SECRET
// Diagnostic: возвращает env-видимость и список users.

function decodeJwtRole(jwt?: string): string {
  if (!jwt) return "(empty)";
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return "(not-jwt)";
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return String(payload.role ?? "(no role)");
  } catch {
    return "(parse-error)";
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL_value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_role: decodeJwtRole(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_first10: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) ?? null,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY_role: decodeJwtRole(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_SERVICE_ROLE_KEY_first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) ?? null,
    ANTHROPIC_API_KEY_set: !!process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_API_KEY_first10: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? null,
  };

  let listResult: any = null;
  try {
    const sb = createAdminClient();
    const list = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (list.error) {
      listResult = { error: list.error.message, status: (list.error as any).status };
    } else {
      listResult = {
        total: list.data.users.length,
        users: list.data.users.map((u) => ({
          email: u.email,
          confirmed: !!u.email_confirmed_at,
          created_at: u.created_at,
        })),
      };
    }
  } catch (e: any) {
    listResult = { exception: e?.message ?? String(e) };
  }

  return NextResponse.json({ env, listResult });
}
