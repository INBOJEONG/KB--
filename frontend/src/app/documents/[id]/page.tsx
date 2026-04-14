"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/lib/api";
import DocumentDetail from "@/components/DocumentDetail";
import Header from "@/components/Header";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        activeTab="docs"
        onTabChange={() => {}}
      />
      <main className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <div className="text-center py-20 text-muted">불러오는 중...</div>
        ) : doc ? (
          <DocumentDetail doc={doc} />
        ) : (
          <div className="text-center py-20 text-muted">
            문서를 찾을 수 없습니다.
          </div>
        )}
      </main>
    </div>
  );
}
