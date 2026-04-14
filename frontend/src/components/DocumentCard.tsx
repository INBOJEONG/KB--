"use client";

import { FileText, Eye } from "lucide-react";
import type { Document } from "@/lib/types";

interface DocumentCardProps {
  doc: Document;
  index: number;
  onClick: () => void;
}

export default function DocumentCard({ doc, index, onClick }: DocumentCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-[10px] overflow-hidden cursor-pointer border border-border hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all animate-fade-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div
        className="h-[3px]"
        style={{ backgroundColor: doc.category?.color || "#5b5fc7" }}
      />
      <div className="p-3.5 px-4">
        <div className="flex justify-between items-center mb-1.5">
          <span
            className="text-[10px] font-bold py-0.5 px-2 rounded-[5px]"
            style={{
              backgroundColor: (doc.category?.color || "#5b5fc7") + "14",
              color: doc.category?.color || "#5b5fc7",
            }}
          >
            {doc.category?.icon} {doc.category?.name}
          </span>
          <span className="text-[10px] text-muted">
            {doc.updated_at?.split("T")[0]}
          </span>
        </div>
        <h3 className="text-sm font-bold text-foreground mb-1 leading-snug">
          {doc.title}
        </h3>
        <p className="text-xs text-muted leading-relaxed mb-2.5 line-clamp-2">
          {doc.summary || doc.content}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1 flex-wrap">
            {doc.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.name}
                className="text-[10px] text-primary bg-primary-light py-0.5 px-1.5 rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            {doc.file_name && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <FileText size={12} /> 1
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <Eye size={12} /> {doc.views}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
