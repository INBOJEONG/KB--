"use client";

import { Search, X, Plus, Layers } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}: HeaderProps) {
  return (
    <header className="flex items-center px-6 h-[58px] bg-surface border-b border-border shrink-0 gap-4">
      <div className="shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl text-primary">&#9670;</span>
          <span className="text-[17px] font-extrabold text-foreground tracking-tight">
            KnowledgeHub
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-[480px]">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] border-[1.5px] border-border bg-background text-muted focus-within:border-primary transition-colors">
          <Search size={18} />
          <input
            type="text"
            placeholder="문서·파일 통합 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 border-none outline-none bg-transparent text-[13px] text-foreground placeholder:text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="text-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 flex gap-2 items-center">
        <button
          onClick={() => onTabChange("ai")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-[1.5px] text-xs font-semibold cursor-pointer transition-all ${
            activeTab === "ai"
              ? "border-primary bg-primary-light text-primary"
              : "border-border bg-surface text-muted hover:border-primary/50"
          }`}
        >
          <Layers size={16} />
          <span>AI 검색</span>
        </button>
        <Link
          href="/documents/new"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-none bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span>새 문서</span>
        </Link>
      </div>
    </header>
  );
}
