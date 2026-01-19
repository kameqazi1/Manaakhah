import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/messages/conversations/:id/messages - Get messages for a conversation
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = id;

    // Get conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        business: true,
        customer: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if user is part of this conversation
    const isParticipant =
      conversation.customerId === userId ||
      conversation.business?.ownerId === userId;

    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get messages
    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Get users for sender info
    const users = await db.user.findMany();
    const messagesWithSender = messages.map((msg: any) => {
      const sender = users.find((u: any) => u.id === msg.senderId);
      return {
        ...msg,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              image: sender.image,
              role: sender.role,
            }
          : null,
      };
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        business: conversation.business,
        customer: conversation.customer,
        subject: conversation.subject,
        status: conversation.status,
      },
      messages: messagesWithSender,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/messages/conversations/:id/messages - Send a message
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 2000 characters or less" },
        { status: 400 }
      );
    }

    const conversationId = id;

    // Verify user is part of conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { business: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant =
      conversation.customerId === userId ||
      conversation.business?.ownerId === userId;

    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
    });

    return NextResponse.json({
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
