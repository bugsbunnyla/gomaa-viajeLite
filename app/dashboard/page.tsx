"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Plane, ArrowRight, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") fetchItineraries();
  }, [status]);

  async function fetchItineraries() {
    const res = await fetch("/api/itinerary");
    const data = await res.json();
    setItineraries(data.itineraries || []);
    setLoading(false);
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gold">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-obsidian">
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold" />
            <span className="text-xl font-bold gold-text">Viaje Lite</span>
          </a>
          <span className="text-sm text-neutral-400">{session?.user?.email}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">My trips</h1>

        {itineraries.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-neutral-400 mb-4">No trips yet.</p>
            <a href="/" className="text-gold hover:underline">Search flights</a>
          </div>
        ) : (
          <div className="grid gap-4">
            {itineraries.map((it) => {
              const flights = it.flights as any[];
              return (
                <div key={it.id} className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{it.title}</h3>
                      <p className="text-sm text-neutral-500">
                        Created {new Date(it.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold gold-text">{formatPrice(Number(it.totalPrice))}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        it.status === "booked" ? "bg-green-500/20 text-green-400" : "bg-neutral-700 text-neutral-400"
                      }`}>
                        {it.status === "booked" ? "Confirmed" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {flights.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                        <ArrowRight className="w-4 h-4 text-gold" />
                        {f.from.city} → {f.to.city} · {f.airline} · {new Date(f.departure).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                  {it.status !== "booked" && (
                    <a href={`/itinerary/${it.id}`} className="inline-block bg-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-light transition-colors">
                      Complete booking
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
