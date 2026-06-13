import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人工作台",
  description: "个人任务、需求、项目和日常工作的管理工具",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
