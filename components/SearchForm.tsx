"use client";
import { useState } from "react";
import AirportAutocomplete from "./AirportAutocomplete";
import { Airport } from "@/lib/airports";
import { Search, Plus, X, ArrowRightLeft } from "lucide-react";

interface Segment {
  id: string;
  from: Airport | null;
  to: Airport | null;
  date: string;
}

interface Props {
  onSearch: (segments: { from: string; to: string; date: string }[], stopsFilter: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">("oneway");
  const [segments, setSegments] = useState<Segment[]>([
    { id: "1", from: null, to: null, date: "" },
  ]);
  const [stopsFilter, setStopsFilter] = useState("any");

  function updateSegment(id: string, field: keyof Segment, value: any) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addSegment() {
    setSegments((prev) => [...prev, { id: Math.random().toString(36).slice(2), from: null, to: null, date: "" }]);
  }

  function removeSegment(id: string) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSearch() {
    const valid = segments.filter((s) => s.from && s.to && s.date);
    if (valid.length === 0) return;
    onSearch(
      valid.map((s) => ({ from: s.from!.iata, to: s.to!.iata, date: s.date })),
      stopsFilter
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-5">
      <div className="flex gap-2">
        {(["oneway", "roundtrip", "multicity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTripType(t);
              if (t === "oneway") setSegments([segments[0] || { id: "1", from: null, to: null, date: "" }]);
              if (t === "roundtrip" && segments.length === 1) {
                setSegments([
                  segments[0] || { id: "1", from: null, to: null, date: "" },
                  { id: "2", from: null, to: null, date: "" },
                ]);
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tripType === t ? "bg-gold text-black" : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {t === "oneway" ? "One way" : t === "roundtrip" ? "Round trip" : "Multi-city"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {segments.map((seg, idx) => (
          <div key={seg.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <AirportAutocomplete
              label={idx === 0 ? "From" : `Stop ${idx} from`}
              placeholder="City or airport code"
              value={seg.from ? `${seg.from.city} (${seg.from.iata})` : ""}
              onChange={(a) => updateSegment(seg.id, "from", a)}
            />
            <AirportAutocomplete
              label={idx === segments.length - 1 ? "To" : `Stop ${idx + 1} to`}
              placeholder="City or airport code"
              value={seg.to ? `${seg.to.city} (${seg.to.iata})` : ""}
              onChange={(a) => updateSegment(seg.id, "to", a)}
            />
            <div>
              <label className="block text-xs text-neutral-400 mb-1 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={seg.date}
                onChange={(e) => updateSegment(seg.id, "date", e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
              />
            </div>
            {tripType === "multicity" && segments.length > 1 && (
              <button onClick={() => removeSegment(seg.id)} className="p-3 text-neutral-500 hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {tripType === "multicity" && (
        <button onClick={addSegment} className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors">
          <Plus className="w-4 h-4" /> Add another city
        </button>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(["any", "nonstop", "1stop"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStopsFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                stopsFilter === s ? "bg-neutral-700 text-white" : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {s === "any" ? "Any stops" : s === "nonstop" ? "Non-stop" : "1 stop max"}
            </button>
          ))}
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-lg font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {loading ? "Searching..." : "Find cheapest flights"}
        </button>
      </div>
    </div>
  );
}
