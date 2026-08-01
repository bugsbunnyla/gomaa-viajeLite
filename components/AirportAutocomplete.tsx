"use client";
import { useState, useRef, useEffect } from "react";
import { searchAirports, Airport } from "@/lib/airports";
import { Plane, MapPin } from "lucide-react";

interface Props {
  value: string;
  onChange: (airport: Airport) => void;
  placeholder: string;
  label: string;
}

export default function AirportAutocomplete({ value, onChange, placeholder, label }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(v: string) {
    setQuery(v);
    setResults(searchAirports(v));
    setOpen(true);
  }

  function select(a: Airport) {
    setQuery(`${a.city} (${a.iata})`);
    setOpen(false);
    onChange(a);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-neutral-400 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-gold transition-colors"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl max-h-64 overflow-auto">
          {results.map((a) => (
            <button
              key={a.iata}
              onClick={() => select(a)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{a.city}, {a.country}</div>
                <div className="text-xs text-neutral-500">{a.name} · <span className="text-gold font-mono">{a.iata}</span></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
