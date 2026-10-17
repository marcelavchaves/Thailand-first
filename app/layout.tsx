import type { Metadata } from "next";
import "./globals.css";
import "./public-edition.css";
import "./wondercase-brand.css";
import "./wondercase-clean.css";
import "./journey-extras.css";

const testing=process.env.NEXT_PUBLIC_APP_ENV === "test";
const pretour=process.env.NEXT_PUBLIC_APP_ENV === "pretour";
const appName="Vietnam, Cambodia & Thailand";
const appIcon="/icons/kingdoms-dragons-live-192.png";

export const metadata: Metadata = {
  title: pretour ? `${appName} · Pre-Tour Review` : testing ? `${appName} · Test` : appName,
  robots: pretour || testing ? { index: false, follow: false } : undefined,
  description: "Your 16-day Vietnam, Cambodia & Thailand travel companion · xxx edition.",
  applicationName: appName,
  manifest: "/manifest-live-v028.webmanifest",
  appleWebApp: { capable: true, title: appName, statusBarStyle: "default" },
  icons: {
    icon: appIcon,
    shortcut: appIcon,
    apple: "/icons/kingdoms-dragons-live-180.png",
  },
};

export const viewport = { themeColor: "#315C4F", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
