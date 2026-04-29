import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XS.Family",
  description: "Семейный хаб: задачи, события, привычки и AI-ассистент",
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Все маршруты — динамические: layout читает сессию через cookies()
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const ui = user?.ui_profile ?? "default";

  return (
    <html lang="ru" className={mono.variable}>
      <body data-ui={ui}>{children}</body>
    </html>
  );
}
