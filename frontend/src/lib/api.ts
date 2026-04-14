import axios from "axios";
import type { Document, PaginatedResponse, SearchResult, Category, Tag } from "./types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Documents
export async function getDocuments(params?: {
  page?: number;
  page_size?: number;
  category_id?: string;
  tag?: string;
  q?: string;
}): Promise<PaginatedResponse<Document>> {
  const { data } = await api.get("/documents", { params });
  return data;
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await api.get(`/documents/${id}`);
  return data;
}

export async function createDocument(body: {
  title: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  author?: string;
}): Promise<Document> {
  const { data } = await api.post("/documents", body);
  return data;
}

export async function updateDocument(
  id: string,
  body: {
    title?: string;
    content?: string;
    category_id?: string;
    tags?: string[];
    author?: string;
  }
): Promise<Document> {
  const { data } = await api.put(`/documents/${id}`, body);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function getDownloadUrl(id: string): Promise<string> {
  const { data } = await api.get(`/documents/${id}/download`);
  return data.download_url;
}

// Upload
export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ id: string; title: string; is_indexed: boolean }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return data;
}

// Search
export async function aiSearch(query: string): Promise<SearchResult> {
  const { data } = await api.post("/search", { query });
  return data;
}

// Categories & Tags
export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get("/categories");
  return data;
}

export async function getTags(): Promise<Tag[]> {
  const { data } = await api.get("/tags");
  return data;
}
