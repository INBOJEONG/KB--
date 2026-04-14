"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DocumentList from "@/components/DocumentList";
import FileManager from "@/components/FileManager";
import AISearch from "@/components/AISearch";
import { getDocuments, getCategories, getTags } from "@/lib/api";
import type { Document } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const categories = categoriesData || [];

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });
  const allTags = tagsData?.map((t) => t.name) || [];

  const { data: docsData, refetch: refetchDocs } = useQuery({
    queryKey: ["documents", searchQuery, selectedCategory, activeTab],
    queryFn: () =>
      getDocuments({
        q: searchQuery || undefined,
        category_id: selectedCategory || undefined,
        page_size: 50,
      }),
  });

  const allDocs = docsData?.items || [];
  const docs = allDocs.filter((d) => d.doc_type === "doc");
  const files = allDocs.filter((d) => d.doc_type === "file");

  const filteredDocs = selectedTags.length
    ? docs.filter((d) =>
        selectedTags.some((st) => d.tags.some((t) => t.name === st))
      )
    : docs;

  const filteredFiles = selectedTags.length
    ? files.filter((f) =>
        selectedTags.some((st) => f.tags.some((t) => t.name === st))
      )
    : files;

  const categoryName =
    selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.name || "전체"
      : "전체";

  const handleOpenDoc = (doc: Document) => {
    router.push(`/documents/${doc.id}`);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          categories={categories}
          allTags={allTags}
          activeTab={activeTab}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onTabChange={setActiveTab}
          onCategoryChange={setSelectedCategory}
          onTagToggle={handleTagToggle}
          totalDocs={docs.length}
          totalFiles={files.length}
        />
        <main className="flex-1 overflow-auto p-5 px-6">
          {activeTab === "ai" ? (
            <AISearch />
          ) : activeTab === "files" ? (
            <FileManager
              files={filteredFiles}
              categories={categories}
              searchQuery={searchQuery}
              categoryName={categoryName}
              onRefresh={() => refetchDocs()}
            />
          ) : (
            <DocumentList
              docs={filteredDocs}
              searchQuery={searchQuery}
              categoryName={categoryName}
              onOpenDoc={handleOpenDoc}
            />
          )}
        </main>
      </div>
    </div>
  );
}
