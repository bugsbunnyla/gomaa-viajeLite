import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId, itineraryId } = body;

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: { user: true },
    });
    if (!itinerary) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const booking = await prisma.booking.create({
      data: {
        userId: itinerary.userId,
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

    // Send confirmation email
    const flights = itinerary.flights as any[];
    const flightList = flights.map((f: any, i: number) =>
      `<p><strong>Leg ${i + 1}:</strong> ${f.from.city} (${f.from.iata}) → ${f.to.city} (${f.to.iata})<br/>
      ${new Date(f.departure).toLocaleString()} — ${f.airline} ${f.flightNumber}</p>`
    ).join("");

    await sendEmail({
      to: itinerary.user.email,
      subject: `Viaje Lite — Booking Confirmed: ${itinerary.title}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#d4af37;">Viaje Lite</h2>
        <h3>Your booking is confirmed!</h3>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Total paid:</strong> $${itinerary.totalPrice}</p>
        ${flightList}
        <p style="margin-top:24px;color:#6b7280;font-size:12px;">Thank you for flying with Viaje Lite.</p>
      </div>`,
    });

    // Send SMS if phone exists
    if (itinerary.user.phone) {
      await sendSMS(
        itinerary.user.phone,
        `Viaje Lite: Your booking ${booking.id.slice(0, 8)} is confirmed! Total: $${itinerary.totalPrice}. Check your email for full itinerary.`
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Confirm failed" }, { status: 500 });
  }
}
