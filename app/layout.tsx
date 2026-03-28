import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SKCT 준비 서비스",
  description: "SKCT 실전 시뮬레이터, 오답 모의고사 생성기, AI 전략 코치"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-[var(--font-body)]">{children}</body>
    </html>
  );
}
