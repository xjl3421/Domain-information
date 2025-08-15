import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "剑之魂域名查询-免费的一站式域名信息查询",
  description: "在线域名信息查询工具，支持RDAP和WHOIS两种查询方式，提供域名状态、注册商、注册时间等详细信息，支持域名、IP地址、自治系统号等多种对象类型查询。",
  keywords: ["域名查询", "RDAP", "WHOIS", "域名信息", "域名状态", "注册商", "IP查询", "ASN查询", "剑之魂域名查询"],
  authors: [{ name: "剑之魂科技" }],
  openGraph: {
    title: "剑之魂域名查询-免费的一站式域名信息查询",
    description: "支持RDAP和WHOIS的域名信息查询工具，提供详细的域名注册信息查询服务",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "剑之魂域名查询-免费的一站式域名信息查询",
    description: "支持RDAP和WHOIS的域名信息查询工具",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
