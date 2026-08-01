"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import PaymentModal from "@/components/PaymentModal";
import { Plane, CheckCircle, Loader2 } from "lucide-react";

export default function ItineraryPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (id) fetchItinerary();
  }, [id]);

  async function fetchItinerary() {
    const res = await fetch("/api/itinerary");
    const data = await res.json();
    const found = data.itineraries?.find((i: any) => i.id === id);
    setItinerary(found);
    setLoading(false);
  }

  async function initiatePayment() {
    const res = await fetch("/api/payment/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itineraryId: id }),
    });
    const data = await res.json();
    if (data.clientSecret) {
      setClientSecret(data.clientSecret);
      setPaymentOpen(true);
    }
  }

  async function handlePaymentSuccess() {
    await fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: clientSecret?.split("_secret_")[0], itineraryId: id }),
    });
    setPaymentOpen(false);
    setBooked(true);
    fetchItinerary();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!itinerary) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Itinerary not found</div>;

  const flights = itinerary.flights as any[];

  return (
    <main className="min-h-screen bg-obsidian">
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold" />
            <span className="text-xl font-bold gold-text">Viaje Lite</span>
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {booked || itinerary.status === "booked" ? (
          <div className="glass rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Booking confirmed!</h2>
            <p className="text-neutral-400">Confirmation sent to your email and phone.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">{itinerary.title}</h1>
            <p className="text-neutral-400 mb-8">Review and complete your booking</p>

            <div className="glass rounded-xl p-6 mb-6">
              <h3 className="font-medium text-white mb-4">Flight details</h3>
              <div className="space-y-4">
                {flights.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-800">
                    <div>
                      <div className="text-white font-medium">{f.from.city} → {f.to.city}</div>
                      <div className="text-sm text-neutral-500">{f.airline} {f.flightNumber} · {new Date(f.departure).toLocaleString()}</div>
                    </div>
                    <span className="font-medium text-white">{formatPrice(f.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <span className="text-lg font-medium text-white">Total</span>
                  <span className="text-2xl font-bold gold-text">{formatPrice(Number(itinerary.totalPrice))}</span>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-sm text-neutral-300">Verification code:</p>
              <code className="text-2xl font-mono font-bold text-gold tracking-widest">{itinerary.verificationCode}</code>
            </div>

            <button
              onClick={initiatePayment}
              className="w-full bg-gold text-black py-4 rounded-lg font-bold text-lg hover:bg-gold-light transition-colors"
            >
              Pay {formatPrice(Number(itinerary.totalPrice))} & confirm
            </button>
          </>
        )}
      </div>

      <PaymentModal
        open={paymentOpen}
        clientSecret={clientSecret}
        amount={Number(itinerary.totalPrice)}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaymentOpen(false)}
      />
    </main>
  );
}
