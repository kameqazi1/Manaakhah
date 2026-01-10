import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// PUT /api/admin/scraped-businesses/:id - Update scraped business status
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { claimStatus } = body;

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Update status
    const updateData: any = {
      claimStatus,
      reviewedAt: new Date(),
    };

    const updatedBusiness = await db.scrapedBusiness.update({
      where: { id: businessId },
      data: updateData,
    });

    // If approved, create a real business listing
    if (claimStatus === "APPROVED") {
      const businesses = await db.scrapedBusiness.findMany({
        where: { id: businessId },
      });

      if (businesses && businesses.length > 0) {
        const scraped = businesses[0];

        // Create business from scraped data
        const newBusiness = await db.business.create({
          data: {
            name: scraped.name,
            description: scraped.description || `${scraped.name} in ${scraped.city}`,
            category: scraped.category,
            address: scraped.address,
            city: scraped.city,
            state: scraped.state,
            zipCode: scraped.zipCode,
            latitude: scraped.latitude || 37.5485,
            longitude: scraped.longitude || -121.9886,
            phone: scraped.phone || "",
            email: scraped.email || null,
            website: scraped.website || null,
            ownerId: "system", // System-created, awaiting claim
            status: "PUBLISHED",
            verificationStatus: "UNVERIFIED",
            isScraped: true,
            scrapedBusinessId: scraped.id,
          },
        });

        return NextResponse.json({
          message: "Business approved and created",
          business: newBusiness,
          scrapedBusiness: updatedBusiness,
        });
      }
    }

    return NextResponse.json({
      message: "Business status updated",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating scraped business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}
