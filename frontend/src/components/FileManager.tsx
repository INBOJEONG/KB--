"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Trash2 } from "lucide-react";
import { uploadFile, deleteDocument } from "@/lib/api";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import type { Document, Category } from "@/lib/types";

interface FileManagerProps {
  files: Document[];
  categories: Category[];
  searchQuery: string;
  categoryName: string;
  onRefresh: () => void;
}

interface UploadingFile {
  name: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
}

export default function FileManager({
  files,
  categories,
  searchQuery,
  categoryName,
  onRefresh,
}: FileManagerProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const entry: UploadingFile = {
          name: file.name,
          progress: 0,
          status: "uploading",
        };
        setUploading((prev) => [...prev, entry]);

        try {
          await uploadFile(file, (percent) => {
            setUploading((prev) =>
              prev.map((u) =>
                u.name === file.name ? { ...u, progress: percent } : u
              )
            );
          });
          setUploading((prev) =>
            prev.map((u) =>
              u.name === file.name
                ? { ...u, status: "done", progress: 100 }
                : u
            )
          );
          onRefresh();
        } catch {
          setUploading((prev) =>
            prev.map((u) =>
              u.name === file.name ? { ...u, status: "error" } : u
            )
          );
        }
      }
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.status !== "done"));
      }, 3000);
    },
    [onRefresh]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (id: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    try {
      await deleteDocument(id);
      onRefresh();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2.5 m-0">
          {searchQuery
            ? `"${searchQuery}" 파일 검색 결과`
            : `${categoryName} 파일`}
          <span className="text-xs font-medium text-muted bg-background rounded-full px-2.5 py-0.5">
            {files.length}건
          </span>
        </h2>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-2 p-8 mb-5 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
          isDragActive
            ? "border-primary bg-primary-light text-primary"
            : "border-border bg-background/50 text-muted hover:border-primary hover:bg-primary-light/30 hover:text-primary"
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={28} />
        <p className="text-sm font-semibold mt-1">
          {isDragActive
            ? "여기에 놓으세요!"
            : "파일을 드래그하거나 클릭하여 업로드"}
        </p>
        <p className="text-[11px] text-muted">
          PDF, DOCX, XLSX, PPTX, 이미지 등 모든 파일 형식 지원
        </p>
      </div>

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploading.map((u) => (
            <div
              key={u.name}
              className="flex items-center gap-3 p-2.5 bg-surface rounded-lg border border-border"
            >
              <span className="text-xs font-medium flex-1 truncate">
                {u.name}
              </span>
              {u.status === "uploading" && (
                <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              <span
                className={`text-[10px] font-bold ${
                  u.status === "done"
                    ? "text-green-600"
                    : u.status === "error"
                    ? "text-red-500"
                    : "text-primary"
                }`}
              >
                {u.status === "uploading"
                  ? `${u.progress}%`
                  : u.status === "done"
                  ? "완료"
                  : "오류"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-2.5">📂</div>
          <p className="text-[15px] text-muted font-semibold mb-1">
            업로드된 파일이 없습니다
          </p>
          <p className="text-xs text-muted/60">
            위 영역에 파일을 드래그하여 업로드하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {files.map((file, i) => {
            const fi = getFileIcon(file.file_name || file.title);
            const cat = file.category;
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2.5 px-3.5 bg-surface rounded-[10px] border border-border hover:shadow-sm transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: fi.color + "14",
                    color: fi.color,
                  }}
                >
                  <span className="text-xl">{fi.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground truncate">
                    {file.file_name || file.title}
                  </div>
                  <div className="flex gap-1.5 text-[11px] text-muted mt-0.5">
                    {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
                    <span>·</span>
                    <span>{file.created_at?.split("T")[0]}</span>
                    {cat && (
                      <>
                        <span>·</span>
                        <span style={{ color: cat.color }}>
                          {cat.icon} {cat.name}
                        </span>
                      </>
                    )}
                    {!file.is_indexed && (
                      <>
                        <span>·</span>
                        <span className="text-yellow-600">분류 중...</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap shrink-0">
                  {file.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="text-[10px] text-primary bg-primary-light py-0.5 px-1.5 rounded"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    className="bg-transparent border-none cursor-pointer text-muted p-1 rounded hover:text-primary transition-colors"
                    title="다운로드"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="bg-transparent border-none cursor-pointer text-muted p-1 rounded hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
