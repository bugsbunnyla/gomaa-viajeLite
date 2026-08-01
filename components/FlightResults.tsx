"use client";
import { useState } from "react";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Plane, Clock, ArrowRight, Check, Shield, Star } from "lucide-react";

interface Flight {
  id: string;
  from: { city: string; iata: string };
  to: { city: string; iata: string };
  departure: string;
  arrival: string;
  airline: string;
  alliance: string;
  flightNumber: string;
  price: number;
  duration: number;
  stops: number;
  stopoverHours?: number;
  aircraft: string;
}

interface Props {
  results: { segmentIndex: number; from: string; to: string; date: string; flights: Flight[] }[];
  onSelect: (flights: Flight[]) => void;
}

export default function FlightResults({ results, onSelect }: Props) {
  const [selectedPerSegment, setSelectedPerSegment] = useState<Record<number, Flight>>({});

  if (!results || results.length === 0) return null;

  const allSelected = results.every((_, i) => selectedPerSegment[i]);
  const totalPrice = Object.values(selectedPerSegment).reduce((sum, f) => sum + f.price, 0);

  function selectFlight(segmentIndex: number, flight: Flight) {
    setSelectedPerSegment((prev) => ({ ...prev, [segmentIndex]: flight }));
  }

  function handleContinue() {
    const flights = results.map((r, i) => selectedPerSegment[i]).filter(Boolean);
    if (flights.length === results.length) onSelect(flights);
  }

  return (
    <div className="space-y-6">
      {results.map((segment) => (
        <div key={segment.segmentIndex}>
          <div className="flex items-center gap-2 mb-3">
            <Plane className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-medium text-neutral-300">
              Leg {segment.segmentIndex + 1}: {segment.from} → {segment.to}
            </h3>
          </div>
          <div className="space-y-2">
            {segment.flights.map((flight, idx) => {
              const isSelected = selectedPerSegment[segment.segmentIndex]?.id === flight.id;
              const isCheapest = idx === 0;
              return (
                <button
                  key={flight.id}
                  onClick={() => selectFlight(segment.segmentIndex, flight)}
                  className={`w-full text-left glass rounded-lg p-4 transition-all hover:border-gold/50 ${
                    isSelected ? "gold-border bg-gold/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-gold">{flight.airline.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{flight.airline}</span>
                          <span className="text-xs text-neutral-500">{flight.flightNumber}</span>
                          {isCheapest && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">CHEAPEST</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1">
                          <span>{new Date(flight.departure).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{new Date(flight.arrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="text-neutral-600">|</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(flight.duration)}</span>
                          <span className="text-neutral-600">|</span>
                          <span>{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-white">{formatPrice(flight.price)}</div>
                      <div className="text-xs text-neutral-500">{flight.alliance}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-gold shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allSelected && (
        <div className="glass rounded-xl p-5 sticky bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-400">Total for {results.length} leg{results.length > 1 ? "s" : ""}</div>
              <div className="text-2xl font-bold gold-text">{formatPrice(totalPrice)}</div>
            </div>
            <button
              onClick={handleContinue}
              className="bg-gold text-black px-6 py-3 rounded-lg font-medium hover:bg-gold-light transition-colors"
            >
              Select & continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
