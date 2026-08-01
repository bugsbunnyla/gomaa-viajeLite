"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Msg {
  id: string;
  senderId: string;
  senderName: string | null;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function ChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find admin on mount
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.users?.length > 0) {
          // For demo, we assume first user or we could have a dedicated admin endpoint
          // Actually let's just use a hardcoded admin fetch approach
        }
      });
  }, [session]);

  // Poll messages when open
  useEffect(() => {
    if (!open || !session?.user?.id) return;

    async function load() {
      const res = await fetch("/api/chat/messages");
      const data = await res.json();
      if (data.conversations?.length > 0) {
        const convo = data.conversations[0];
        setAdminId(convo.user.id);
        const msgs = await fetch(`/api/chat/messages?with=${convo.user.id}`);
        const mData = await msgs.json();
        if (mData.messages) setMessages(mData.messages);
      }
    }
    load();
    intervalRef.current = setInterval(load, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !adminId) return;
    setLoading(true);
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: adminId, content: input.trim() }),
    });
    if (res.ok) {
      setInput("");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    }
    setLoading(false);
  }

  if (!session?.user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg hover:bg-gold-light transition-colors"
      >
        {open ? <X className="w-6 h-6 text-black" /> : <MessageCircle className="w-6 h-6 text-black" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "480px" }}>
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-medium text-white">Chat with support</h3>
            <p className="text-xs text-neutral-500">We typically reply within minutes</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 text-sm py-8">
                No messages yet. Start a conversation!
              </div>
            )}
            {messages.map((m) => {
              const isMe = m.senderId === session.user.id;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    isMe ? "bg-gold text-black" : "bg-neutral-800 text-neutral-200"
                  }`}>
                    <p>{m.content}</p>
                    <span className="text-[10px] opacity-60 mt-1 block">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-neutral-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-2 bg-gold rounded-lg text-black hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
