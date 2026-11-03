import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "케어로그 CareLog",
  description: "외국인 요양보호사를 위한 AI 돌봄 기록",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-13 max-w-xl items-center justify-between px-5">
            <Link href="/" className="text-[17px] font-extrabold tracking-tight">
              케어로그
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-xl px-5 pt-2">{children}</main>
        <footer className="mx-auto max-w-xl px-5 py-6 text-[11px] text-faint">
          데모 서비스 · 모든 대상자와 기록은 가상 데이터입니다
        </footer>
		<Analytics />
      </body>
    </html>
  );
}
