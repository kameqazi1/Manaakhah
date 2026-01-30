import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { ScrapedBusinessClaimStatus } from "@prisma/client";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// Valid claim statuses for validation
const VALID_CLAIM_STATUSES = Object.values(ScrapedBusinessClaimStatus);

// GET /api/admin/scraped-businesses - Get all scraped businesses
export async function GET(req: Request) {
  try {
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const claimStatus = searchParams.get("claimStatus");

    const where: Record<string, unknown> = {};

    // Validate claimStatus if provided - reject invalid values
    if (claimStatus) {
      if (!VALID_CLAIM_STATUSES.includes(claimStatus as ScrapedBusinessClaimStatus)) {
        return NextResponse.json(
          {
            error: "Invalid claimStatus",
            validValues: VALID_CLAIM_STATUSES
          },
          { status: 400 }
        );
      }
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
