"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api";
import DocumentEditor from "@/components/DocumentEditor";
import Header from "@/components/Header";

export default function NewDocumentPage() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
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
        <DocumentEditor serverCategories={categories} />
      </main>
    </div>
  );
}
