"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Plane, Users, MessageSquare, Loader2 } from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") router.push("/");
      else fetchData();
    }
  }, [status]);

  async function fetchData() {
    const [uRes, iRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/itineraries")]);
    const uData = await uRes.json();
    const iData = await iRes.json();
    setUsers(uData.users || []);
    setItineraries(iData.itineraries || []);
    setLoading(false);
  }

  async function openChat(user: any) {
    setSelectedUser(user);
    const res = await fetch(`/api/chat/messages?with=${user.id}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function sendMessage() {
    if (!chatInput.trim() || !selectedUser) return;
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedUser.id, content: chatInput.trim() }),
    });
    if (res.ok) {
      setChatInput("");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-obsidian">
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold" />
            <span className="text-xl font-bold gold-text">Viaje Lite Admin</span>
          </div>
          <a href="/" className="text-sm text-neutral-400 hover:text-white">Back to site</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" /> Travelers ({users.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => openChat(u)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUser?.id === u.id ? "bg-gold/10 border border-gold/30" : "hover:bg-neutral-800"}`}
              >
                <div className="text-sm font-medium text-white">{u.name || u.email}</div>
                <div className="text-xs text-neutral-500">{u.email}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-5 flex flex-col" style={{ height: "500px" }}>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold" /> Chat
          </h2>
          {selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {messages.map((m) => {
                  const isAdmin = m.senderId === session?.user?.id;
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${isAdmin ? "bg-gold text-black" : "bg-neutral-800 text-neutral-200"}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Reply..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-gold text-black rounded-lg text-sm font-medium hover:bg-gold-light">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">Select a traveler to chat</div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-medium text-white mb-4">Bookings ({itineraries.length})</h2>
          <div className="space-y-3 max-h-96 overflow-auto">
            {itineraries.map((it) => (
              <div key={it.id} className="p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-white">{it.user.name || it.user.email}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${it.status === "booked" ? "bg-green-500/20 text-green-400" : "bg-neutral-700 text-neutral-400"}`}>
                    {it.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">{it.title}</div>
                <div className="text-sm font-bold gold-text mt-1">{formatPrice(Number(it.totalPrice))}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
