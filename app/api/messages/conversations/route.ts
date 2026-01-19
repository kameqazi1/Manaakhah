import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/messages/conversations - Get user's conversations
export async function GET(req: Request) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: any = {};

    // Filter by role
    if (role === "customer" || (!role && userRole === "CONSUMER")) {
      where.customerId = userId;
    } else if (role === "business" || (!role && userRole === "BUSINESS_OWNER")) {
      // Get businesses owned by this user
      const businesses = await db.business.findMany({
        where: { ownerId: userId },
      });
      const businessIds = businesses.map((b: any) => b.id);

      if (businessIds.length === 0) {
        return NextResponse.json({ conversations: [], unreadTotal: 0 });
      }

      // Filter conversations
      const allConversations = await db.conversation.findMany({
        include: {
          business: true,
          customer: true,
          messages: true,
        },
      });

      const filteredConversations = allConversations.filter((c: any) =>
        businessIds.includes(c.businessId)
      );

      // Calculate unread count
      const unreadTotal = filteredConversations.reduce(
        (sum: number, c: any) => sum + c.unreadByBusiness,
        0
      );

      // Get last message for each conversation
      const conversationsWithLastMessage = filteredConversations.map((conv: any) => {
        const messages = conv.messages.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastMessage = messages[0];

        return {
          id: conv.id,
          business: conv.business,
          customer: conv.customer,
          subject: conv.subject,
          status: conv.status,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount: conv.unreadByBusiness,
          lastMessageAt: conv.lastMessageAt,
        };
      });

      return NextResponse.json({
        conversations: conversationsWithLastMessage,
        unreadTotal,
      });
    }

    if (status) where.status = status;

    const conversations = await db.conversation.findMany({
      where,
      include: {
        business: true,
        customer: true,
        messages: true,
      },
    });

    // Calculate unread total
    const unreadTotal = conversations.reduce((sum: number, c: any) => {
      return sum + (c.customerId === userId ? c.unreadByCustomer : c.unreadByBusiness);
    }, 0);

    // Format conversations with last message
    const formattedConversations = conversations.map((conv: any) => {
      const messages = conv.messages.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastMessage = messages[0];

      return {
        id: conv.id,
        business: conv.business,
        customer: conv.customer,
        subject: conv.subject,
        status: conv.status,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount: conv.customerId === userId ? conv.unreadByCustomer : conv.unreadByBusiness,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      unreadTotal,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/messages/conversations - Create conversation or send first message
export async function POST(req: Request) {
  try {
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, message, subject } = body;

    if (!businessId || !message) {
      return NextResponse.json(
        { error: "businessId and message are required" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversations = await db.conversation.findMany({
      where: { businessId, customerId: userId },
    });

    let conversation;

    if (existingConversations && existingConversations.length > 0) {
      conversation = existingConversations[0];
    } else {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          businessId,
          customerId: userId,
          subject: subject || null,
        },
      });
    }

    // Create message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: message,
      },
    });

    return NextResponse.json({
      message: "Message sent successfully",
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
