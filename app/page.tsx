"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import SearchForm from "@/components/SearchForm";
import FlightResults from "@/components/FlightResults";
import PaymentModal from "@/components/PaymentModal";
import ChatWidget from "@/components/ChatWidget";
import { formatPrice } from "@/lib/utils";
import { Plane, Shield, Zap, Globe, User, LogOut, Loader2, Mail, Smartphone, CheckCircle } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<any[] | null>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notifSent, setNotifSent] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  async function handleSearch(segments: any[], stopsFilter: string) {
    setSearchLoading(true);
    setResults(null);
    setSelectedFlights(null);
    setItineraryId(null);
    setBooked(false);
    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments, stopsFilter }),
      });
      const data = await res.json();
      setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setSearchLoading(false);
  }

  async function handleSelectFlights(flights: any[]) {
    if (!session?.user) {
      setShowAuth(true);
      return;
    }
    setSelectedFlights(flights);
    const total = flights.reduce((s, f) => s + f.price, 0);
    setTotalPrice(total);

    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${flights[0].from.city} to ${flights[flights.length - 1].to.city}`,
        flights,
        totalPrice: total,
      }),
    });
    const data = await res.json();
    if (data.itinerary) {
      setItineraryId(data.itinerary.id);
      setVerificationCode(data.itinerary.verificationCode);
    }
  }

  async function sendNotification(type: "email" | "sms" | "both") {
    if (!itineraryId) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itineraryId, type }),
    });
    setNotifSent(true);
  }

  async function initiatePayment() {
    if (!itineraryId) return;
    const res = await fetch("/api/payment/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itineraryId }),
    });
    const data = await res.json();
    if (data.clientSecret) {
      setClientSecret(data.clientSecret);
      setPaymentOpen(true);
    }
  }

  async function handlePaymentSuccess() {
    if (!itineraryId || !clientSecret) return;
    await fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: clientSecret.split("_secret_")[0], itineraryId }),
    });
    setPaymentOpen(false);
    setBooked(true);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    if (authMode === "signup") {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, phone: authPhone }),
      });
      if (!res.ok) {
        setAuthError("Signup failed");
        setAuthLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email: authEmail,
      password: authPassword,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(result.error);
    } else {
      setShowAuth(false);
    }
    setAuthLoading(false);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold" />
            <span className="text-xl font-bold gold-text">Viaje Lite</span>
          </div>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <a href="/dashboard" className="text-sm text-neutral-400 hover:text-white transition-colors">My trips</a>
                {session.user.role === "admin" && (
                  <a href="/admin" className="text-sm text-gold hover:text-gold-light transition-colors">Admin</a>
                )}
                <button onClick={() => signOut()} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="text-sm text-neutral-300 hover:text-white">
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gold-text">Elite travel,</span>
            <br />
            <span className="text-white">simplified.</span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Search 200+ airlines. Multi-city with sightseeing stops. Book in seconds.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <SearchForm onSearch={handleSearch} loading={searchLoading} />
        </div>

        {searchLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        )}

        {results && !searchLoading && (
          <div className="max-w-4xl mx-auto mt-8">
            <FlightResults results={results} onSelect={handleSelectFlights} />
          </div>
        )}

        {selectedFlights && itineraryId && !booked && (
          <div className="max-w-4xl mx-auto mt-8 glass rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Review your itinerary</h3>
            <div className="space-y-3 mb-6">
              {selectedFlights.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <div className="text-sm">
                    <span className="text-white font-medium">{f.from.city} → {f.to.city}</span>
                    <span className="text-neutral-500 ml-2">{f.airline} {f.flightNumber}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{formatPrice(f.price)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="font-medium text-white">Total</span>
                <span className="text-xl font-bold gold-text">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-sm text-neutral-300 mb-2">Verification code (share this with your travel companion):</p>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono font-bold text-gold tracking-widest">{verificationCode}</code>
                <span className="text-xs text-neutral-500">Valid 24 hours</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => sendNotification("email")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-300 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> Email itinerary
              </button>
              <button onClick={() => sendNotification("sms")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-300 hover:text-white transition-colors">
                <Smartphone className="w-4 h-4" /> SMS itinerary
              </button>
              <button onClick={() => sendNotification("both")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-sm text-neutral-300 hover:text-white transition-colors">
                Send both
              </button>
            </div>
            {notifSent && <p className="text-sm text-green-400 mb-4">Notification sent!</p>}

            <button
              onClick={initiatePayment}
              className="w-full bg-gold text-black py-4 rounded-lg font-bold text-lg hover:bg-gold-light transition-colors"
            >
              Proceed to payment
            </button>
          </div>
        )}

        {booked && (
          <div className="max-w-4xl mx-auto mt-8 glass rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Booking confirmed!</h3>
            <p className="text-neutral-400 mb-4">Your itinerary has been booked and confirmation sent to your email and phone.</p>
            <a href="/dashboard" className="inline-block bg-gold text-black px-6 py-3 rounded-lg font-medium hover:bg-gold-light transition-colors">
              View my trips
            </a>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="border-t border-neutral-800 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Globe className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-medium text-white mb-1">200+ airlines</h3>
            <p className="text-sm text-neutral-500">Global coverage across all major alliances</p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-medium text-white mb-1">AI-powered search</h3>
            <p className="text-sm text-neutral-500">Smart routing with multi-city optimization</p>
          </div>
          <div className="text-center">
            <Shield className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="font-medium text-white mb-1">Secure payments</h3>
            <p className="text-sm text-neutral-500">Stripe-powered with instant confirmation</p>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-medium mb-4">{authMode === "signin" ? "Sign in" : "Create account"}</h3>
            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === "signup" && (
                <>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone (for SMS notifications)"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold"
                required
              />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gold text-black py-3 rounded-lg font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : authMode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
            <p className="text-center text-sm text-neutral-500 mt-4">
              {authMode === "signin" ? "No account? " : "Already have an account? "}
              <button onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-gold hover:underline">
                {authMode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
            <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      )}

      <PaymentModal
        open={paymentOpen}
        clientSecret={clientSecret}
        amount={totalPrice}
        onSuccess={handlePaymentSuccess}
        onClose={() => setPaymentOpen(false)}
      />

      <ChatWidget />
    </main>
  );
}
