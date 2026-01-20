import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveBusinessSchema = z.object({
  businessId: z.string(),
  listId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const businessListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  isCollaborative: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable(),
});

// GET /api/user/saved - Get saved businesses and lists
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");
    const type = searchParams.get("type"); // "lists" or "businesses"

    if (type === "lists") {
      // Get user's lists
      const lists = await prisma.businessList.findMany({
        where: { userId: session.user.id },
        include: {
          _count: {
            select: { businesses: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json({ lists });
    }

    // Get saved businesses
    const where: any = { userId: session.user.id };
    if (listId) {
      where.listId = listId;
    }

    const savedBusinesses = await prisma.savedBusiness.findMany({
      where,
      include: {
        business: {
          include: {
            photos: { take: 1 },
            tags: true,
            _count: {
              select: { reviews: true },
            },
          },
        },
        list: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      savedBusinesses: savedBusinesses.map((sb: any) => ({
        id: sb.id,
        notes: sb.notes,
        createdAt: sb.createdAt,
        list: sb.list,
        business: {
          ...sb.business,
          reviewCount: sb.business._count.reviews,
        },
      })),
    });
  } catch (error) {
    console.error("Get saved businesses error:", error);
    return NextResponse.json(
      { error: "Failed to get saved businesses" },
      { status: 500 }
    );
  }
}

// POST /api/user/saved - Save a business or create a list
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body; // "business" or "list"

    if (type === "list") {
      const validationResult = businessListSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const list = await prisma.businessList.create({
        data: {
          userId: session.user.id,
          name: validationResult.data.name,
          description: validationResult.data.description,
          isPublic: validationResult.data.isPublic ?? false,
          isCollaborative: validationResult.data.isCollaborative ?? false,
          coverImage: validationResult.data.coverImage,
        },
      });

      return NextResponse.json({ success: true, list });
    } else {
      const validationResult = saveBusinessSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      // Check if already saved
      const existing = await prisma.savedBusiness.findUnique({
        where: {
          userId_businessId: {
            userId: session.user.id,
            businessId: validationResult.data.businessId,
          },
        },
      });

      if (existing) {
        // Update if already saved
        const updated = await prisma.savedBusiness.update({
          where: { id: existing.id },
          data: {
            listId: validationResult.data.listId,
            notes: validationResult.data.notes,
          },
        });
        return NextResponse.json({ success: true, saved: updated });
      }

      const saved = await prisma.savedBusiness.create({
        data: {
          userId: session.user.id,
          businessId: validationResult.data.businessId,
          listId: validationResult.data.listId,
          notes: validationResult.data.notes,
        },
      });

      return NextResponse.json({ success: true, saved });
    }
  } catch (error) {
    console.error("Save business error:", error);
    return NextResponse.json(
      { error: "Failed to save business" },
      { status: 500 }
    );
  }
}

// PUT /api/user/saved - Update saved business or list
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "list") {
      const list = await prisma.businessList.update({
        where: { id, userId: session.user.id },
        data: {
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          isCollaborative: data.isCollaborative,
          coverImage: data.coverImage,
        },
      });

      return NextResponse.json({ success: true, list });
    } else {
      const saved = await prisma.savedBusiness.update({
        where: { id, userId: session.user.id },
        data: {
          listId: data.listId,
          notes: data.notes,
        },
      });

      return NextResponse.json({ success: true, saved });
    }
  } catch (error) {
    console.error("Update saved error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/saved - Remove saved business or list
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const businessId = searchParams.get("businessId");

    if (type === "list" && id) {
      await prisma.businessList.delete({
        where: { id, userId: session.user.id },
      });
      return NextResponse.json({ success: true });
    } else if (businessId) {
      await prisma.savedBusiness.delete({
        where: {
          userId_businessId: {
            userId: session.user.id,
            businessId,
          },
        },
      });
      return NextResponse.json({ success: true });
    } else if (id) {
      await prisma.savedBusiness.delete({
        where: { id, userId: session.user.id },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "ID or businessId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete saved error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
