import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const itineraries = await prisma.itinerary.findMany({
      include: { user: { select: { name: true, email: true, phone: true } }, booking: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ itineraries });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
