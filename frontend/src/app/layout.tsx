import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "KnowledgeHub",
  description: "사내 문서 관리 및 AI 검색 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
