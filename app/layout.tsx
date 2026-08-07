import type { Metadata, Viewport } from "next";
import { getPublicLocale } from "@/src/application/public-locale";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/noto-sans-sc";
import "./globals.css";
import "./saas.css";
import "./redesign.css";
import "./personal/personal-redesign.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://uts-deep-study.dqq12125-study.workers.dev"),
  title: {
    default: "DeepStudy",
    template: "%s · DeepStudy",
  },
  description:
    "An adaptive learning operating system that turns university courses into focused sessions and verifiable mastery.",
  applicationName: "DeepStudy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeepStudy",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/deepstudy-1024.png",
  },
  openGraph: {
    title: "DeepStudy",
    description:
      "Know exactly what to study today, then verify what you truly mastered.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "DeepStudy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepStudy",
    description: "Turn your semester into today’s next step.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getPublicLocale();
  return (
    <html lang={language === "zh-CN" ? "zh-CN" : "en-AU"}>
      <body>{children}</body>
    </html>
  );
}
