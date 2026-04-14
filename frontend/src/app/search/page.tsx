"use client";

import Header from "@/components/Header";
import AISearch from "@/components/AISearch";

export default function SearchPage() {
  return (
    <div className="h-screen flex flex-col">
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        activeTab="ai"
        onTabChange={() => {}}
      />
      <main className="flex-1 overflow-auto p-5 px-6">
        <AISearch />
      </main>
    </div>
  );
}
