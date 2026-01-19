import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const channelSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  coverImage: z.string().url().optional().nullable(),
  isPrivate: z.boolean().optional(),
});

// GET /api/community/channels - List channels
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // official, community, all

    const where: any = {};

    if (type === "official") {
      where.isOfficial = true;
    } else if (type === "community") {
      where.isOfficial = false;
    }

    // Don't show private channels in public listing
    where.isPrivate = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [channels, total] = await Promise.all([
      prisma.communityChannel.findMany({
        where,
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: [
          { isOfficial: "desc" },
          { memberCount: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityChannel.count({ where }),
    ]);

    return NextResponse.json({
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        coverImage: c.coverImage,
        isOfficial: c.isOfficial,
        memberCount: c.memberCount,
        postCount: c._count.posts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get channels error:", error);
    return NextResponse.json(
      { error: "Failed to get channels" },
      { status: 500 }
    );
  }
}

// POST /api/community/channels - Create a channel (admin only for official)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = channelSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { isOfficial } = body;

    // Only admins can create official channels
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, karmaPoints: true },
    });

    if (isOfficial && user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create official channels" },
        { status: 403 }
      );
    }

    // Check if user has enough karma to create community channels
    const minKarmaToCreate = 100;
    if (!isOfficial && (user?.karmaPoints || 0) < minKarmaToCreate) {
      return NextResponse.json(
        { error: `You need at least ${minKarmaToCreate} karma points to create a channel` },
        { status: 403 }
      );
    }

    // Check if slug is unique
    const existingChannel = await prisma.communityChannel.findUnique({
      where: { slug: validationResult.data.slug },
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: "A channel with this slug already exists" },
        { status: 400 }
      );
    }

    const channel = await prisma.communityChannel.create({
      data: {
        name: validationResult.data.name,
        slug: validationResult.data.slug,
        description: validationResult.data.description,
        icon: validationResult.data.icon,
        coverImage: validationResult.data.coverImage,
        isOfficial: isOfficial || false,
        isPrivate: validationResult.data.isPrivate || false,
      },
    });

    // Add creator as moderator
    await prisma.channelModerator.create({
      data: {
        channelId: channel.id,
        userId: session.user.id,
        role: "admin",
      },
    });

    return NextResponse.json({ success: true, channel });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}

// PUT /api/community/channels - Update a channel
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { channelId, ...data } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a moderator/admin
    const moderator = await prisma.channelModerator.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    const isModerator = moderator?.role === "admin" || moderator?.role === "moderator";

    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const channel = await prisma.communityChannel.update({
      where: { id: channelId },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        coverImage: data.coverImage,
        isPrivate: data.isPrivate,
      },
    });

    return NextResponse.json({ success: true, channel });
  } catch (error) {
    console.error("Update channel error:", error);
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }
}
