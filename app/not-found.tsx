import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="surface p-8 text-center max-w-md">
        <div className="display text-6xl text-accent">404</div>
        <div className="text-muted mt-2 mb-6">Страница не найдена</div>
        <Link href="/dashboard" className="accent-text hover:underline">
          На дашборд
        </Link>
      </div>
    </div>
  );
}
