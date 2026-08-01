import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, flights, totalPrice, currency = "USD" } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const code = randomBytes(3).toString("hex").toUpperCase();
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const itinerary = await prisma.itinerary.create({
      data: {
        userId: user.id,
        title: title || "My Trip",
        flights: flights as any,
        totalPrice: totalPrice,
        currency,
        verificationCode: code,
        verifyExpiry,
      },
    });

    return NextResponse.json({ itinerary: { id: itinerary.id, verificationCode: code } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save itinerary" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const itineraries = await prisma.itinerary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { booking: true },
    });

    return NextResponse.json({ itineraries });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
