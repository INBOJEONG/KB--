export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  doc_count: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  category: Category | null;
  tags: Tag[];
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  author: string | null;
  doc_type: "doc" | "file";
  keywords: string[];
  is_indexed: boolean;
  views: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SearchSource {
  doc_id: string;
  title: string;
  chunk: string;
  score: number;
}

export interface SearchResult {
  query: string;
  answer: string;
  sources: SearchSource[];
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
  sources?: SearchSource[];
}
