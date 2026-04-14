"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { createDocument, updateDocument } from "@/lib/api";
import type { Document, Category } from "@/lib/types";

const CATEGORIES: { id: string; name: string; icon: string; color: string }[] = [
  { id: "general", name: "일반", icon: "📋", color: "#5b5fc7" },
  { id: "hr", name: "인사/총무", icon: "👥", color: "#c44569" },
  { id: "dev", name: "개발/기술", icon: "💻", color: "#0ea47a" },
  { id: "sales", name: "영업/마케팅", icon: "📊", color: "#e08b2d" },
  { id: "finance", name: "재무/회계", icon: "💰", color: "#7c5cbf" },
  { id: "policy", name: "사내규정", icon: "📜", color: "#d94452" },
];

interface DocumentEditorProps {
  doc?: Document | null;
  serverCategories?: Category[];
}

export default function DocumentEditor({ doc, serverCategories }: DocumentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(doc?.title || "");
  const [content, setContent] = useState(doc?.content || "");
  const [categoryId, setCategoryId] = useState(doc?.category?.id || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(doc?.tags?.map((t) => t.name) || []);
  const [saving, setSaving] = useState(false);

  const cats = serverCategories?.length ? serverCategories : CATEGORIES.map((c, i) => ({
    ...c,
    sort_order: i,
    doc_count: 0,
  }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("제목을 입력하세요.");
    setSaving(true);
    try {
      if (doc?.id) {
        await updateDocument(doc.id, {
          title,
          content,
          category_id: categoryId || undefined,
          tags,
        });
        router.push(`/documents/${doc.id}`);
      } else {
        const created = await createDocument({
          title,
          content,
          category_id: categoryId || undefined,
          tags,
          author: "나",
        });
        router.push(`/documents/${created.id}`);
      }
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[740px] animate-fade-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-extrabold text-foreground m-0">
          {doc ? "문서 편집" : "새 문서 작성"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-1.5 rounded-lg border border-border bg-surface text-xs text-muted cursor-pointer hover:text-foreground transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 rounded-lg border-none bg-primary text-xs text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <input
          type="text"
          placeholder="문서 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full py-2.5 border-none border-b-2 border-border text-xl font-bold outline-none text-foreground bg-transparent mb-4"
        />

        {/* Category */}
        <div className="mb-3.5">
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
            카테고리
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {cats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`py-1 px-2.5 rounded-md border-[1.5px] text-[11px] cursor-pointer transition-all ${
                  categoryId === cat.id
                    ? "border-current bg-current/5"
                    : "border-border bg-surface"
                }`}
                style={{
                  color: categoryId === cat.id ? cat.color : undefined,
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3.5">
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
            태그
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="태그 입력 후 Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 py-1.5 px-2.5 rounded-md border-[1.5px] border-border text-xs outline-none text-foreground"
            />
            <button
              onClick={addTag}
              className="py-1.5 px-3.5 rounded-md border-none bg-primary text-white text-[11px] font-semibold cursor-pointer"
            >
              추가
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 py-0.5 px-2 rounded-[5px] bg-primary-light text-primary text-[11px] font-medium"
                >
                  #{tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="bg-transparent border-none text-primary cursor-pointer text-[13px] leading-none"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <textarea
          placeholder="내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[300px] p-4 border-[1.5px] border-border rounded-lg text-[13px] leading-[1.8] text-foreground outline-none bg-surface resize-y"
        />
      </div>
    </div>
  );
}
