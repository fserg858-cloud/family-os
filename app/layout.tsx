import type { Metadata } from "next";
import { Oswald, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

// Bebas Neue не поддерживает кириллицу — используем Oswald (тот же геометрический condensed sans)
const display = Oswald({
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Family OS",
  description: "Семейная операционная система",
};

// Layout читает текущего пользователя для UI-профиля, поэтому
// все маршруты должны рендериться по запросу, не на этапе билда.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const ui = user?.ui_profile ?? "default";

  return (
    <html lang="ru" className={`${display.variable} ${mono.variable}`}>
      <body data-ui={ui}>{children}</body>
    </html>
  );
}
