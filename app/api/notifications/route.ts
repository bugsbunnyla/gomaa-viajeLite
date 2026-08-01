import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { sendEmail } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itineraryId, type } = body;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: { user: true },
    });
    if (!itinerary) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const flights = itinerary.flights as any[];
    const flightList = flights.map((f: any, i: number) =>
      `Leg ${i + 1}: ${f.from.city} → ${f.to.city} on ${new Date(f.departure).toLocaleDateString()}`
    ).join("\n");

    if (type === "email" || type === "both") {
      await sendEmail({
        to: itinerary.user.email,
        subject: `Itinerary Preview: ${itinerary.title}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
          <h2 style="color:#d4af37;">Viaje Lite</h2>
          <h3>Your itinerary is ready for review</h3>
          <p><strong>Verification code:</strong> <span style="font-size:24px;font-weight:bold;">${itinerary.verificationCode}</span></p>
          <p>Use this code to view and confirm your itinerary before payment.</p>
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">
            ${flights.map((f: any, i: number) => `<p>Leg ${i + 1}: ${f.from.city} (${f.from.iata}) → ${f.to.city} (${f.to.iata}) — ${f.airline} ${f.flightNumber} — $${f.price}</p>`).join("")}
            <p style="font-weight:bold;">Total: $${itinerary.totalPrice}</p>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/itinerary/${itinerary.id}" style="display:inline-block;background:#d4af37;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;">View & Pay</a>
        </div>`,
      });
    }

    if ((type === "sms" || type === "both") && itinerary.user.phone) {
      await sendSMS(
        itinerary.user.phone,
        `Viaje Lite: Your itinerary "${itinerary.title}" is ready! Verification code: ${itinerary.verificationCode}. View: ${process.env.NEXTAUTH_URL}/itinerary/${itinerary.id}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
