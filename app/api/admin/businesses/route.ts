import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// Helper to check admin authorization
function checkAdminAuth(req: Request): boolean {
  if (isMockMode()) {
    const userRole = req.headers.get("x-user-role");
    return userRole === "ADMIN";
  }
  return false;
}

// GET /api/admin/businesses - Get all businesses with filtering
export async function GET(req: Request) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filter
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }

    // Get all businesses
    let businesses = await db.business.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      businesses = businesses.filter(
        (b: any) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.address?.toLowerCase().includes(searchLower) ||
          b.city?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats
    const total = businesses.length;
    const offset = (page - 1) * limit;
    const paginatedBusinesses = businesses.slice(offset, offset + limit);

    // Add computed fields
    const businessesWithStats = paginatedBusinesses.map((b: any) => ({
      ...b,
      reviewCount: b.reviews?.length || 0,
      averageRating:
        b.reviews?.length > 0
          ? b.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            b.reviews.length
          : 0,
    }));

    return NextResponse.json({
      businesses: businessesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}
