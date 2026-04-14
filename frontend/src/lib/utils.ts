export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "📕", color: "#d94452" },
  xlsx: { icon: "📊", color: "#0ea47a" },
  xls: { icon: "📊", color: "#0ea47a" },
  docx: { icon: "📘", color: "#5b5fc7" },
  doc: { icon: "📘", color: "#5b5fc7" },
  pptx: { icon: "📙", color: "#e08b2d" },
  ppt: { icon: "📙", color: "#e08b2d" },
  png: { icon: "🖼️", color: "#7c5cbf" },
  jpg: { icon: "🖼️", color: "#7c5cbf" },
  jpeg: { icon: "🖼️", color: "#7c5cbf" },
  txt: { icon: "📄", color: "#888" },
  csv: { icon: "📊", color: "#0ea47a" },
};

export function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || { icon: "📎", color: "#888" };
}
