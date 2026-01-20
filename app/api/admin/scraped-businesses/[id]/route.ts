import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// GET /api/admin/scraped-businesses/:id - Get single scraped business
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    const business = await db.scrapedBusiness.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching scraped business:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/scraped-businesses/:id - Update scraped business status (approve/reject)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
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

// PATCH /api/admin/scraped-businesses/:id - Edit scraped business details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Only allow editing certain fields
    const allowedFields = [
      "name",
      "description",
      "category",
      "address",
      "city",
      "state",
      "zipCode",
      "phone",
      "email",
      "website",
      "latitude",
      "longitude",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedBusiness = await db.scrapedBusiness.update({
      where: { id: businessId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Business updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error editing scraped business:", error);
    return NextResponse.json(
      { error: "Failed to edit business" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scraped-businesses/:id - Delete scraped business
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    await db.scrapedBusiness.delete({
      where: { id: businessId },
    });

    return NextResponse.json({
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scraped business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
