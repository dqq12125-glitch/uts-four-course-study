import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./saas.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://uts-deep-study.dqq12125-study.workers.dev"),
  title: {
    default: "DeepStudy",
    template: "%s · DeepStudy",
  },
  description:
    "Turn your semester into today’s next step. Open-course planning, original practice and spaced retesting for university students.",
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
  themeColor: "#17211b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
