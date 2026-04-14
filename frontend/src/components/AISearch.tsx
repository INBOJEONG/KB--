"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { aiSearch } from "@/lib/api";
import type { ChatMessage, SearchSource } from "@/lib/types";
import { getFileIcon } from "@/lib/utils";

export default function AISearch() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "안녕하세요! Knowledge Base AI 검색입니다.\n\n등록된 문서와 업로드된 파일을 기반으로 질문에 답변해드립니다. 무엇이 궁금하신가요?\n\n💡 예시 질문:\n• 연차 신청은 어떻게 하나요?\n• 경비 청구 절차를 알려줘\n• Git 브랜치 규칙이 뭐야?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await aiSearch(userMsg);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: result.answer, sources: result.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "죄송합니다. 검색 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[740px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 p-3.5 bg-gradient-to-br from-primary/5 to-[#7c5cbf]/5 rounded-xl border border-border">
        <div className="text-3xl">🤖</div>
        <div>
          <h2 className="text-base font-extrabold text-foreground m-0">
            AI Knowledge 검색
          </h2>
          <p className="text-[11px] text-muted mt-0.5">
            문서 기반으로 답변합니다
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 items-start animate-fade-up ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {msg.role === "ai" && (
              <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-primary to-[#7c5cbf] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                AI
              </div>
            )}
            <div
              className={
                msg.role === "user"
                  ? "max-w-[75%] py-2.5 px-3.5 rounded-[14px_14px_4px_14px] bg-primary text-white text-[13px] leading-relaxed"
                  : "max-w-[80%] py-3 px-4 rounded-[14px_14px_14px_4px] bg-surface border border-border text-[13px] leading-relaxed text-foreground/90"
              }
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-background rounded-lg">
                  <div className="text-[11px] font-bold text-muted mb-1.5">
                    📚 참고 자료
                  </div>
                  {msg.sources.map((src, k) => (
                    <div
                      key={k}
                      className="flex items-center gap-1.5 w-full p-1.5 rounded bg-surface text-xs mb-1"
                    >
                      <span>📄</span>
                      <span className="flex-1 text-primary font-medium">
                        {src.title}
                      </span>
                      <span className="text-[9px] font-bold text-muted bg-background rounded px-1.5 py-px">
                        {Math.round(src.score * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 items-start animate-fade-up">
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-primary to-[#7c5cbf] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
              AI
            </div>
            <div className="py-3 px-4 rounded-[14px_14px_14px_4px] bg-surface border border-border">
              <div className="flex gap-1 py-1">
                <span className="w-[7px] h-[7px] rounded-full bg-muted/40 typing-dot" />
                <span
                  className="w-[7px] h-[7px] rounded-full bg-muted/40 typing-dot"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-[7px] h-[7px] rounded-full bg-muted/40 typing-dot"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-border mt-3">
        <div className="flex gap-2 items-center p-2 bg-surface rounded-xl border-[1.5px] border-border focus-within:border-primary transition-colors">
          <input
            type="text"
            placeholder="Knowledge Base에 질문하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border-none outline-none bg-transparent text-[13px] text-foreground py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-[34px] h-[34px] rounded-lg border-none bg-primary text-white flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-muted/60 text-center mt-2">
          AI 답변은 등록된 문서 기반이며, 정확하지 않을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
