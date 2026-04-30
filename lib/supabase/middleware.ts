import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Если env-переменные не выставлены — рендерим setup-страницу вместо 500.
  // Это бывает на свежем Vercel-проекте, пока пользователь не добавил ключи.
  if (!url || !key) {
    const path = request.nextUrl.pathname;
    if (path !== "/setup" && !path.startsWith("/_next") && !path.startsWith("/favicon")) {
      const u = request.nextUrl.clone();
      u.pathname = "/setup";
      return NextResponse.rewrite(u);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  let user: any = null;
  try {
    const r = await supabase.auth.getUser();
    user = r.data.user;
  } catch {
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/login" ||
    path === "/register" ||
    path === "/setup" ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/api/");

  if (!user && !isPublic) {
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    return NextResponse.redirect(u);
  }

  // /login доступен залогиненным только если они хотят сменить аккаунт - не редиректим
  // /register — редиректим в /dashboard, ТОЛЬКО если у пользователя уже есть профиль.
  // Иначе позволяем долатать профиль в /register или auto-create в requireUser.
  if (user && path === "/login") {
    const u = request.nextUrl.clone();
    u.pathname = "/dashboard";
    return NextResponse.redirect(u);
  }

  return response;
}
