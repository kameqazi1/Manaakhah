import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// GET /api/admin/businesses - Get all businesses with filtering
export async function GET(req: Request) {
  try {
    // Check admin auth with fallback
    let authorized = false;
    try {
      authorized = await isAdmin(req);
    } catch (authError) {
      console.error("Auth check failed:", authError);
      // If auth fails, return empty data rather than crashing
      return NextResponse.json({
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        warning: "Authentication check failed - showing empty results",
      });
    }

    if (!authorized) {
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

    // Get all businesses with error handling
    let businesses: any[] = [];
    try {
      businesses = await db.business.findMany({
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
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      // Return empty results with warning rather than crashing
      return NextResponse.json({
        businesses: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        warning: "Database query failed - check DATABASE_URL configuration",
        details: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      businesses = businesses.filter(
        (b: any) =>
          b.name?.toLowerCase().includes(searchLower) ||
          b.address?.toLowerCase().includes(searchLower) ||
          b.city?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats
    const total = businesses.length;
    const offset = (page - 1) * limit;
    const paginatedBusinesses = businesses.slice(offset, offset + limit);

    // Add computed fields with null safety
    const businessesWithStats = paginatedBusinesses.map((b: any) => ({
      ...b,
      reviewCount: b.reviews?.length ?? 0,
      averageRating:
        b.reviews?.length > 0
          ? b.reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
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
    // Return empty results rather than 500 error
    return NextResponse.json({
      businesses: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      error: "Failed to fetch businesses",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
