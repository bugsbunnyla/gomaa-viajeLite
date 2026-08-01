import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get("with");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!withUserId) {
      // Get all conversations for this user
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, email: true } }, receiver: { select: { id: true, name: true, email: true } } },
      });

      const conversations = new Map();
      messages.forEach((m) => {
        const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
        const other = m.senderId === user.id ? m.receiver : m.sender;
        if (!conversations.has(otherId)) {
          conversations.set(otherId, { user: other, lastMessage: m, unread: 0 });
        }
        if (m.receiverId === user.id && !m.read) {
          conversations.get(otherId).unread++;
        }
      });

      return NextResponse.json({ conversations: Array.from(conversations.values()) });
    }

    // Get messages between two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true } } },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: withUserId, receiverId: user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ messages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
