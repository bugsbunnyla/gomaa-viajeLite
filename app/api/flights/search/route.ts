import { NextRequest, NextResponse } from "next/server";
import { AIRPORTS, getAirport } from "@/lib/airports";

const AIRLINES = [
  { name: "Delta", alliance: "SkyTeam", code: "DL" },
  { name: "Air France", alliance: "SkyTeam", code: "AF" },
  { name: "KLM", alliance: "SkyTeam", code: "KL" },
  { name: "Korean Air", alliance: "SkyTeam", code: "KE" },
  { name: "United", alliance: "Star Alliance", code: "UA" },
  { name: "Lufthansa", alliance: "Star Alliance", code: "LH" },
  { name: "Singapore Airlines", alliance: "Star Alliance", code: "SQ" },
  { name: "Air Canada", alliance: "Star Alliance", code: "AC" },
  { name: "American Airlines", alliance: "oneworld", code: "AA" },
  { name: "British Airways", alliance: "oneworld", code: "BA" },
  { name: "Qatar Airways", alliance: "oneworld", code: "QR" },
  { name: "Cathay Pacific", alliance: "oneworld", code: "CX" },
  { name: "Emirates", alliance: "Independent", code: "EK" },
  { name: "Etihad", alliance: "Independent", code: "EY" },
  { name: "Virgin Atlantic", alliance: "Independent", code: "VS" },
  { name: "JetBlue", alliance: "Independent", code: "B6" },
];

const AIRCRAFT = ["Boeing 787-9", "Boeing 777-300ER", "Airbus A350-900", "Airbus A380-800", "Boeing 737 MAX 8", "Airbus A321neo", "Boeing 767-300ER", "Airbus A330-300"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateFlights(fromIata: string, toIata: string, dateStr: string, stopsFilter: string, index: number) {
  const from = getAirport(fromIata);
  const to = getAirport(toIata);
  if (!from || !to) return [];

  const baseDate = new Date(dateStr);
  const seed = baseDate.getTime() + fromIata.charCodeAt(0) * 1000 + toIata.charCodeAt(0) * 100 + index;
  const count = 3 + Math.floor(seededRandom(seed) * 5);
  const flights = [];

  const dist = Math.sqrt(Math.pow(from.lat - to.lat, 2) + Math.pow(from.lng - to.lng, 2));
  const basePrice = Math.max(80, Math.round(dist * 12 + seededRandom(seed + 1) * 300));
  const baseDuration = Math.round(dist * 8 + 60);

  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(seededRandom(seed + i * 7) * AIRLINES.length)];
    const stops = stopsFilter === "nonstop" ? 0 : stopsFilter === "1stop" ? (seededRandom(seed + i * 13) > 0.4 ? 0 : 1) : Math.floor(seededRandom(seed + i * 13) * 2.5);

    if (stopsFilter === "nonstop" && stops > 0) continue;
    if (stopsFilter === "1stop" && stops > 1) continue;

    const duration = baseDuration + stops * 120 + Math.floor(seededRandom(seed + i * 3) * 60);
    const price = Math.round(basePrice * (1 + stops * 0.15) + seededRandom(seed + i * 5) * 200 - 100);
    const depHour = 6 + Math.floor(seededRandom(seed + i * 11) * 18);
    const depMin = Math.floor(seededRandom(seed + i * 17) * 60);
    const dep = new Date(baseDate);
    dep.setHours(depHour, depMin);
    const arr = new Date(dep.getTime() + duration * 60000);

    flights.push({
      id: `${fromIata}-${toIata}-${seed}-${i}`,
      from: { iata: from.iata, city: from.city, country: from.country, name: from.name },
      to: { iata: to.iata, city: to.city, country: to.country, name: to.name },
      departure: dep.toISOString(),
      arrival: arr.toISOString(),
      airline: airline.name,
      alliance: airline.alliance,
      flightNumber: `${airline.code}${100 + Math.floor(seededRandom(seed + i * 23) * 8999)}`,
      price: Math.max(49, price),
      currency: "USD",
      duration,
      stops,
      stopoverHours: stops > 0 ? Math.round(2 + seededRandom(seed + i * 31) * 8) : undefined,
      aircraft: AIRCRAFT[Math.floor(seededRandom(seed + i * 29) * AIRCRAFT.length)],
      class: "Economy",
    });
  }

  return flights.sort((a, b) => a.price - b.price);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { segments, stopsFilter = "any" } = body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "Invalid segments" }, { status: 400 });
    }

    const results = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const flights = generateFlights(seg.from, seg.to, seg.date, stopsFilter, i);
      results.push({ segmentIndex: i, from: seg.from, to: seg.to, date: seg.date, flights });
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
