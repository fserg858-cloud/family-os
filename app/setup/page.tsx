export const dynamic = "force-dynamic";

const REQUIRED = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", desc: "URL Supabase-проекта" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Публичный anon-ключ" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", desc: "Service role (только сервер)" },
  { name: "ANTHROPIC_API_KEY", desc: "Ключ Claude API" },
  { name: "NEXT_PUBLIC_APP_URL", desc: "Публичный URL приложения" },
  { name: "CRON_SECRET", desc: "Случайная строка для cron" },
];

export default function SetupPage() {
  const missing = REQUIRED.filter((v) => !process.env[v.name]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5 py-10">
      <div className="surface w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-block w-16 h-16 rounded-2xl bg-accent/15 mb-3 flex items-center justify-center text-3xl">
            🔧
          </div>
          <h1 className="text-xl font-semibold">Setup XS.Family</h1>
          <p className="text-xs text-muted mt-1">Не выставлены переменные окружения</p>
        </div>

        <p className="text-sm text-muted mb-5 leading-relaxed">
          Добавь ключи в Vercel → Project → Settings → Environment Variables, затем нажми Redeploy.
        </p>

        <div className="space-y-2 mb-4">
          {REQUIRED.map((v) => {
            const isMissing = missing.some((m) => m.name === v.name);
            return (
              <div
                key={v.name}
                className={`px-3 py-2.5 rounded-xl flex items-center justify-between border ${
                  isMissing ? "border-danger/40 bg-danger/10" : "border-success/40 bg-success/10"
                }`}
              >
                <div>
                  <div className="text-sm font-mono">{v.name}</div>
                  <div className="text-[11px] text-muted">{v.desc}</div>
                </div>
                <div className={`text-[11px] ${isMissing ? "text-danger" : "text-success"}`}>
                  {isMissing ? "нет" : "ok"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-muted leading-relaxed">
          После добавления — Vercel → Deployments → ⋯ → Redeploy. Эта страница исчезнет.
        </div>
      </div>
    </div>
  );
}
