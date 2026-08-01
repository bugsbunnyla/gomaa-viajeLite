import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itineraryId, paymentIntentId } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId } });
    if (!itinerary || itinerary.userId !== user.id) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        itineraryId,
        stripePaymentIntent: paymentIntentId,
        amount: itinerary.totalPrice,
        currency: itinerary.currency,
        status: "confirmed",
        paidAt: new Date(),
      },
    });

    await prisma.itinerary.update({
      where: { id: itineraryId },
      data: { status: "booked" },
    });

    return NextResponse.json({ booking });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
