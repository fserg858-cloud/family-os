import { getServerLocale } from "@/lib/preferences";
import { t, type TKey } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const REQUIRED: { name: string; key: TKey }[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", key: "setup.env_url" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", key: "setup.env_anon" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", key: "setup.env_service" },
  { name: "ANTHROPIC_API_KEY", key: "setup.env_claude" },
  { name: "NEXT_PUBLIC_APP_URL", key: "setup.env_app_url" },
  { name: "CRON_SECRET", key: "setup.env_cron" },
];

export default function SetupPage() {
  const locale = getServerLocale();
  const tr = (k: TKey) => t(k, locale);
  const missing = REQUIRED.filter((v) => !process.env[v.name]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5 py-10">
      <div className="surface w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="inline-block w-16 h-16 rounded-2xl bg-accent/15 mb-3 flex items-center justify-center text-3xl">
            🔧
          </div>
          <h1 className="text-xl font-semibold">Setup XS.Family</h1>
          <p className="text-xs text-muted mt-1">{tr("setup.title")}</p>
        </div>

        <p className="text-sm text-muted mb-5 leading-relaxed">
          {tr("setup.instructions")}
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
                  <div className="text-[11px] text-muted">{tr(v.key)}</div>
                </div>
                <div className={`text-[11px] ${isMissing ? "text-danger" : "text-success"}`}>
                  {isMissing ? tr("setup.missing") : tr("setup.ok")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-muted leading-relaxed">
          {tr("setup.final")}
        </div>
      </div>
    </div>
  );
}
