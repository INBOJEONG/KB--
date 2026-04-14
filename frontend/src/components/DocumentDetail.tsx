"use client";

import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import type { Document } from "@/lib/types";
import { getDownloadUrl } from "@/lib/api";

interface DocumentDetailProps {
  doc: Document;
}

export default function DocumentDetail({ doc }: DocumentDetailProps) {
  const handleDownload = async () => {
    const url = await getDownloadUrl(doc.id);
    window.open(url, "_blank");
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>목록으로</span>
        </Link>
        <Link
          href={`/documents/${doc.id}?edit=true`}
          className="px-4 py-1.5 rounded-lg border border-primary bg-surface text-xs text-primary font-semibold hover:bg-primary-light transition-colors"
        >
          ✏️ 편집
        </Link>
      </div>

      <article className="bg-surface rounded-xl border border-border p-7 max-w-[740px] animate-fade-up">
        <div className="mb-5">
          {doc.category && (
            <span
              className="text-[13px] font-bold py-1 px-3 rounded-[5px]"
              style={{
                backgroundColor: doc.category.color + "14",
                color: doc.category.color,
              }}
            >
              {doc.category.icon} {doc.category.name}
            </span>
          )}
          <h1 className="text-2xl font-extrabold text-foreground mt-2.5 mb-2 leading-snug tracking-tight">
            {doc.title}
          </h1>
          <div className="flex gap-2 text-xs text-muted flex-wrap">
            {doc.author && (
              <>
                <span>
                  작성자: <strong>{doc.author}</strong>
                </span>
                <span>·</span>
              </>
            )}
            <span>최종 수정: {doc.updated_at?.split("T")[0]}</span>
            <span>·</span>
            <span>조회 {doc.views}</span>
          </div>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {doc.tags.map((tag) => (
              <span
                key={tag.name}
                className="text-[10px] text-primary bg-primary-light py-0.5 px-1.5 rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        {doc.summary && (
          <div className="mb-4 p-3 bg-primary-light/50 rounded-lg text-sm text-foreground/80 leading-relaxed">
            <strong>요약:</strong> {doc.summary}
          </div>
        )}

        <div className="text-sm leading-[1.8] text-foreground/80 whitespace-pre-wrap">
          {doc.content}
        </div>

        {doc.file_name && (
          <div className="mt-6 p-3.5 bg-background rounded-lg">
            <h3 className="text-[13px] font-bold mb-2 text-foreground">
              📎 첨부파일
            </h3>
            <div className="flex items-center gap-2 p-2 bg-surface rounded-md text-xs text-muted">
              <FileText size={14} />
              <span className="flex-1">{doc.file_name}</span>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-surface text-[11px] text-primary cursor-pointer hover:bg-primary-light transition-colors"
              >
                <Download size={12} /> 다운로드
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
