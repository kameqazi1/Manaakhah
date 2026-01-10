import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { scrapeMuslimBusinesses } from "@/lib/scraper/scraper";

// POST /api/admin/scraper/run - Run web scraper
export async function POST(req: Request) {
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

    const body = await req.json();
    const { searchQuery, city, state, zipCode, radius, category, source } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Run scraper
    const results = await scrapeMuslimBusinesses({
      searchQuery,
      city: city || "Fremont",
      state: state || "CA",
      zipCode: zipCode || "94536",
      radius: parseInt(radius) || 10,
      category: category || "RESTAURANT",
      source: source || "google",
    });

    // Save scraped businesses to database
    const savedBusinesses = [];
    const errors = [];

    for (const business of results.businesses) {
      try {
        // Check for duplicates
        const existingBusinesses = await db.scrapedBusiness.findMany({
          where: {
            name: business.name,
            address: business.address,
          },
        });

        if (existingBusinesses && existingBusinesses.length > 0) {
          errors.push(`Duplicate: ${business.name} already exists`);
          continue;
        }

        const saved = await db.scrapedBusiness.create({
          data: {
            name: business.name,
            category: business.category || category,
            address: business.address,
            city: business.city || city,
            state: business.state || state,
            zipCode: business.zipCode || zipCode,
            latitude: business.latitude || null,
            longitude: business.longitude || null,
            phone: business.phone || null,
            email: business.email || null,
            website: business.website || null,
            description: business.description || null,
            sourceUrl: business.sourceUrl,
            scrapedAt: new Date(),
            claimStatus: "PENDING_REVIEW",
            metadata: business.metadata || {},
          },
        });

        savedBusinesses.push(saved);
      } catch (error) {
        errors.push(`Failed to save ${business.name}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      businessesFound: savedBusinesses.length,
      businesses: savedBusinesses,
      errors,
    });
  } catch (error) {
    console.error("Error running scraper:", error);
    return NextResponse.json(
      { error: "Failed to run scraper" },
      { status: 500 }
    );
  }
}
