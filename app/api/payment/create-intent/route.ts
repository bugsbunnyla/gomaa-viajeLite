import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itineraryId } = body;

    const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId } });
    if (!itinerary) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const amount = Math.round(Number(itinerary.totalPrice) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: itinerary.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { itineraryId, userEmail: session.user.email },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Payment failed" }, { status: 500 });
  }
}
