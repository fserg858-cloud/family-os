import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <div className="surface p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-3">🤷</div>
        <div className="text-2xl font-semibold mb-2">404</div>
        <div className="text-sm text-muted mb-5">Страница не найдена</div>
        <Link href="/dashboard" className="inline-block btn-primary">
          На главную
        </Link>
      </div>
    </div>
  );
}
