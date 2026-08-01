export interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
}

export interface Flight {
  id: string;
  from: Airport;
  to: Airport;
  departure: string;
  arrival: string;
  airline: string;
  alliance: string;
  flightNumber: string;
  price: number;
  currency: string;
  duration: number;
  stops: number;
  stopoverHours?: number;
  aircraft: string;
  class: string;
}

export interface Itinerary {
  id: string;
  title: string;
  flights: Flight[];
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paidAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
}
