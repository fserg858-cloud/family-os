export const dynamic = "force-dynamic";

const REQUIRED = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", desc: "URL Supabase-проекта (https://xxx.supabase.co)" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Публичный anon-ключ" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", desc: "Service role (только сервер, секретный)" },
  { name: "ANTHROPIC_API_KEY", desc: "Ключ Claude API (sk-ant-…)" },
  { name: "NEXT_PUBLIC_APP_URL", desc: "Публичный URL приложения, напр. https://family-os-silk.vercel.app" },
  { name: "CRON_SECRET", desc: "Любая случайная строка для cron-задач" },
];

export default function SetupPage() {
  const missing = REQUIRED.filter((v) => !process.env[v.name]);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="surface w-full max-w-2xl p-8">
        <div className="display text-4xl text-accent tracking-[0.2em] text-center">
          FAMILY OS
        </div>
        <div className="text-xs text-muted text-center mt-2 mb-8">Setup required</div>
        <div className="gold-line mb-8" />

        <h1 className="text-text text-xl mb-3">Не выставлены переменные окружения</h1>
        <p className="text-muted text-sm mb-6 leading-relaxed">
          Приложение работает, но базы и AI пока недоступны. Добавь эти ключи в
          Vercel → Project → Settings → Environment Variables, затем нажми Redeploy.
        </p>

        <div className="space-y-2 mb-6">
          {REQUIRED.map((v) => {
            const isMissing = missing.some((m) => m.name === v.name);
            return (
              <div
                key={v.name}
                className={`surface-2 p-3 flex items-center justify-between ${
                  isMissing ? "border-danger/40" : "border-success/40"
                }`}
              >
                <div>
                  <div className="text-text font-mono text-sm">{v.name}</div>
                  <div className="text-xs text-muted">{v.desc}</div>
                </div>
                <div className={`text-xs ${isMissing ? "text-danger" : "text-success"}`}>
                  {isMissing ? "не задана" : "ok"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted leading-relaxed">
          После добавления переменных — Vercel → Deployments → последний деплой →
          ⋯ → Redeploy. Эта страница исчезнет автоматически.
        </div>
      </div>
    </div>
  );
}
