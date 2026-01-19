import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/businesses/[id] - Get single business
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const business = await db.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        photos: {
          orderBy: { order: "asc" },
        },
        tags: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            photos: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          where: {
            startTime: {
              gte: new Date(),
            },
          },
          orderBy: {
            startTime: "asc",
          },
          take: 5,
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Calculate average rating
    const avgRating =
      business.reviews.length > 0
        ? business.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          business.reviews.length
        : 0;

    return NextResponse.json({
      ...business,
      averageRating: avgRating,
      reviewCount: business.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// PUT /api/businesses/[id] - Update business
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get session based on mode
    let session: any = null;

    if (isMockMode()) {
      const userId = req.headers.get("x-user-id");
      const userRole = req.headers.get("x-user-role");

      if (userId && userRole) {
        session = {
          user: {
            id: userId,
            role: userRole,
          },
        };
      }
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await db.business.findUnique({
      where: { id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can update
    if (
      business.ownerId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Remove tags from body if present (handle separately)
    const { tags, ...updateData } = body;

    const updatedBusiness = await db.business.update({
      where: { id },
      data: updateData,
    });

    // Update tags if provided
    if (tags) {
      // Delete existing tags
      // Skip tag relations in mock mode
      if (!isMockMode()) {
        await db.businessTagRelation.deleteMany({
          where: { businessId: id },
        });

        // Create new tags
        if (tags.length > 0) {
          await db.businessTagRelation.createMany({
            data: tags.map((tag: string) => ({
              businessId: id,
              tag: tag as any,
            })),
          });
        }
      }
    }

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

// DELETE /api/businesses/[id] - Delete business
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get session based on mode
    let session: any = null;

    if (isMockMode()) {
      const userId = req.headers.get("x-user-id");
      const userRole = req.headers.get("x-user-role");

      if (userId && userRole) {
        session = {
          user: {
            id: userId,
            role: userRole,
          },
        };
      }
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await db.business.findUnique({
      where: { id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    if (
      business.ownerId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.business.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
