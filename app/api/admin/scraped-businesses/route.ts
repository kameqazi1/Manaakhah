import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/admin/scraped-businesses - Get all scraped businesses
export async function GET(req: Request) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    // Check admin authorization
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const claimStatus = searchParams.get("claimStatus");

    const where: any = {};
    if (claimStatus) {
      where.claimStatus = claimStatus;
    }

    const businesses = await db.scrapedBusiness.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Error fetching scraped businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch scraped businesses" },
      { status: 500 }
    );
  }
}
