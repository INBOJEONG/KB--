"use client";

import type { Category } from "@/lib/types";

interface SidebarProps {
  categories: Category[];
  allTags: string[];
  activeTab: string;
  selectedCategory: string | null;
  selectedTags: string[];
  onTabChange: (tab: string) => void;
  onCategoryChange: (id: string | null) => void;
  onTagToggle: (tag: string) => void;
  totalDocs: number;
  totalFiles: number;
}

const TABS = [
  { id: "docs", label: "문서", icon: "📝" },
  { id: "files", label: "파일", icon: "📁" },
  { id: "ai", label: "AI 검색", icon: "🤖" },
];

export default function Sidebar({
  categories,
  allTags,
  activeTab,
  selectedCategory,
  selectedTags,
  onTabChange,
  onCategoryChange,
  onTagToggle,
  totalDocs,
  totalFiles,
}: SidebarProps) {
  const total = activeTab === "docs" ? totalDocs : totalFiles;

  return (
    <aside className="w-[220px] bg-surface border-r border-border overflow-y-auto shrink-0">
      {/* Tab Switcher */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-3 border-b-2 text-xs font-medium cursor-pointer transition-all ${
              activeTab === tab.id
                ? "text-primary border-primary font-bold"
                : "text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== "ai" && (
        <>
          {/* Categories */}
          <div className="px-3 pt-4">
            <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider px-2 mb-1.5">
              카테고리
            </div>
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex items-center gap-2 w-full py-1.5 px-2.5 border-l-[3px] rounded-r-md text-xs cursor-pointer transition-all ${
                !selectedCategory
                  ? "bg-primary-light text-primary font-bold border-l-primary"
                  : "border-transparent text-muted hover:bg-background"
              }`}
            >
              <span>📁</span>
              <span>전체</span>
              <span className="ml-auto text-[10px] text-muted bg-background rounded-full px-2 py-px">
                {total}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  onCategoryChange(selectedCategory === cat.id ? null : cat.id)
                }
                className={`flex items-center gap-2 w-full py-1.5 px-2.5 border-l-[3px] rounded-r-md text-xs cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary-light text-primary font-bold"
                    : "border-transparent text-muted hover:bg-background"
                }`}
                style={{
                  borderLeftColor:
                    selectedCategory === cat.id ? cat.color : "transparent",
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="ml-auto text-[10px] text-muted bg-background rounded-full px-2 py-px">
                  {cat.doc_count}
                </span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="px-3 pt-4">
            <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider px-2 mb-1.5">
              태그
            </div>
            <div className="flex flex-wrap gap-1 px-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={`px-2 py-0.5 rounded-full border text-[11px] cursor-pointer transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-muted border-border hover:border-primary"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
