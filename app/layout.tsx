import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getServerLocale, getServerTheme } from "@/lib/preferences";
import { PreferencesProvider } from "@/components/preferences-provider";

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

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const ui = user?.ui_profile ?? "default";
  const theme = getServerTheme();
  const locale = getServerLocale();

  return (
    <html lang={locale} data-theme={theme} className={mono.variable}>
      <body data-ui={ui}>
        <PreferencesProvider initialTheme={theme} initialLocale={locale}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
