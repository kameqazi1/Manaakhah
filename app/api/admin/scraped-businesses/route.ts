import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// GET /api/admin/scraped-businesses - Get all scraped businesses
export async function GET(req: Request) {
  try {
    if (!(await isAdmin(req))) {
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
