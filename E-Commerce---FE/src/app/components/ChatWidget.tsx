import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { env } from "../../config/env";
import { parseRes } from "../../utils/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const SESSION_STORAGE_KEY = "sweetbean_chat_session_id";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Xin chào! Mình có thể giúp bạn chọn bánh, cà phê hoặc giải đáp thông tin đơn hàng.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const ensureSession = useCallback(async (): Promise<string> => {
    const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      return storedSessionId;
    }

    setInitializing(true);
    try {
      const response = await fetch(`${env.API_URL}/chat/sessions`, { method: "POST" });
      const data = await parseRes(response) as { id?: string };
      if (!response.ok || !data?.id) throw new Error("Không thể khởi tạo phiên tư vấn");
      window.localStorage.setItem(SESSION_STORAGE_KEY, data.id);
      setSessionId(data.id);
      return data.id;
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void ensureSession().catch(() => {
      setMessages(current => [...current, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Mình chưa kết nối được với hệ thống tư vấn. Bạn thử lại sau ít phút nhé.",
        createdAt: new Date().toISOString(),
      }]);
    });
  }, [ensureSession, open]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || loading || initializing) return;

    setDraft("");
    setMessages(current => [...current, {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }]);
    setLoading(true);

    try {
      const activeSessionId = sessionId || await ensureSession();
      const response = await fetch(`${env.API_URL}/chat/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await parseRes(response) as { message?: ChatMessage };
      if (!response.ok || !data?.message) throw new Error("Không thể gửi tin nhắn");
      setMessages(current => [...current, data.message as ChatMessage]);
    } catch {
      setMessages(current => [...current, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Mình gặp lỗi khi xử lý câu hỏi. Bạn thử lại nhé.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-4 z-[1000] flex h-[min(620px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <header className="flex items-center justify-between bg-[#3d2314] px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Sweet Bean tư vấn</p>
              <p className="text-xs text-white/70">Hỏi về sản phẩm và đơn hàng</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chat" className="rounded-full p-1 hover:bg-white/15">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fffaf5] p-3">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "rounded-br-sm bg-[#3d2314] text-white" : "rounded-bl-sm bg-white text-foreground shadow-sm"}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Đang tư vấn...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border bg-card p-3">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Bạn muốn hỏi gì?"
              className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#3d2314]"
              disabled={loading || initializing}
            />
            <button type="submit" aria-label="Gửi tin nhắn" disabled={loading || initializing || !draft.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3d2314] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setOpen(current => !current)} aria-label="Mở chat tư vấn" className="fixed bottom-6 right-6 z-[1001] flex h-14 w-14 items-center justify-center rounded-full bg-[#3d2314] text-white shadow-xl transition hover:-translate-y-1 hover:opacity-90">
        <MessageCircle size={26} />
      </button>
    </>
  );
}
