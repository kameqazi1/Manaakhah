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

// GET /api/admin/users - Get all users with filtering
export async function GET(req: Request) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filter
    const where: any = {};
    if (role) {
      where.role = role;
    }

    // Get all users
    let users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      );
    }

    // Get business counts for business owners
    const businessCounts: Record<string, number> = {};
    const businesses = await db.business.findMany({
      select: { ownerId: true },
    });
    businesses.forEach((b: any) => {
      businessCounts[b.ownerId] = (businessCounts[b.ownerId] || 0) + 1;
    });

    // Get review counts
    const reviewCounts: Record<string, number> = {};
    const reviews = await db.review.findMany({
      select: { userId: true },
    });
    reviews.forEach((r: any) => {
      reviewCounts[r.userId] = (reviewCounts[r.userId] || 0) + 1;
    });

    // Calculate pagination
    const total = users.length;
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    // Add computed fields
    const usersWithStats = paginatedUsers.map((u: any) => ({
      ...u,
      businessCount: businessCounts[u.id] || 0,
      reviewCount: reviewCounts[u.id] || 0,
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
