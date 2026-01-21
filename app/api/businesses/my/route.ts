import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/businesses/my - Get current user's businesses
export async function GET(req: Request) {
  try {
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businesses = await db.business.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Error fetching user businesses:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}
