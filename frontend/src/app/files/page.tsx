"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import FileManager from "@/components/FileManager";
import { getDocuments, getCategories } from "@/lib/api";

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: docsData, refetch } = useQuery({
    queryKey: ["files", searchQuery],
    queryFn: () =>
      getDocuments({
        q: searchQuery || undefined,
        page_size: 100,
      }),
  });

  const files = docsData?.items.filter((d) => d.doc_type === "file") || [];

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab="files"
        onTabChange={() => {}}
      />
      <main className="flex-1 overflow-auto p-5 px-6">
        <FileManager
          files={files}
          categories={categoriesData || []}
          searchQuery={searchQuery}
          categoryName="전체"
          onRefresh={() => refetch()}
        />
      </main>
    </div>
  );
}
