import Link from "next/link";
import { getServerLocale } from "@/lib/preferences";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function NotFound() {
  const locale = getServerLocale();
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <div className="surface p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-3">🤷</div>
        <div className="text-2xl font-semibold mb-2">404</div>
        <div className="text-sm text-muted mb-5">{t("notfound.title", locale)}</div>
        <Link href="/dashboard" className="inline-block btn-primary">
          {t("common.back_home", locale)}
        </Link>
      </div>
    </div>
  );
}
