import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://four-course-pocket-study.dqq12125.chatgpt.site"),
  title: "四课随身学 · Four-Course Study",
  description: "UTS Spring 2026 中英双语手机学习中心，覆盖 27 个知识点和 270 道练习题。",
  applicationName: "四课随身学 · Four-Course Study",
  openGraph: {
    title: "四课随身学",
    description: "中英双语学习四门课程：27 个知识点、270 道练习题。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "四课随身学" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "四课随身学",
    description: "Spring 2026 · UTS",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#17211b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
