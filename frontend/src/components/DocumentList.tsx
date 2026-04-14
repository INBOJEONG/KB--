"use client";

import type { Document } from "@/lib/types";
import DocumentCard from "./DocumentCard";

interface DocumentListProps {
  docs: Document[];
  searchQuery: string;
  categoryName: string;
  onOpenDoc: (doc: Document) => void;
}

export default function DocumentList({
  docs,
  searchQuery,
  categoryName,
  onOpenDoc,
}: DocumentListProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2.5 m-0">
          {searchQuery
            ? `"${searchQuery}" 검색 결과`
            : `${categoryName} 문서`}
          <span className="text-xs font-medium text-muted bg-background rounded-full px-2.5 py-0.5">
            {docs.length}건
          </span>
        </h2>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-2.5">📭</div>
          <p className="text-[15px] text-muted font-semibold mb-1">
            검색 결과가 없습니다
          </p>
          <p className="text-xs text-muted/60">다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          {docs.map((doc, i) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              index={i}
              onClick={() => onOpenDoc(doc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
