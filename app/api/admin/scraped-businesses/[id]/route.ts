import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { BusinessTag } from "@prisma/client";

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

    // Get the admin user ID from headers (set by the review queue page)
    const adminUserId = req.headers.get("x-user-id");

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

    // If approved, create a real business listing with complete metadata transfer
    if (claimStatus === "APPROVED") {
      const scraped = await db.scrapedBusiness.findUnique({
        where: { id: businessId },
      });

      if (scraped) {
        // Ensure we have a valid owner ID
        let ownerId = adminUserId;
        if (!ownerId) {
          // Fallback: find any admin user to assign as owner
          const adminUser = await db.user.findFirst({
            where: { role: "ADMIN" },
            select: { id: true },
          });
          ownerId = adminUser?.id || null;
        }

        if (!ownerId) {
          return NextResponse.json(
            { error: "No valid owner ID found. Please ensure an admin user exists." },
            { status: 400 }
          );
        }

        // Parse metadata (stored as Json in ScrapedBusiness)
        const metadata = (scraped.metadata || {}) as {
          photos?: Array<{ url: string; caption?: string; type?: string }>;
          tags?: string[];
          hours?: Record<string, string>;
          priceRange?: string;
          serviceList?: string[];
          confidence?: number;
          source?: string;
        };

        // Generate unique slug
        const baseSlug = scraped.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const existingSlugs = await db.business.findMany({
          where: { slug: { startsWith: baseSlug } },
          select: { slug: true },
        });
        const slug =
          existingSlugs.length === 0
            ? baseSlug
            : `${baseSlug}-${existingSlugs.length + 1}`;

        // CRITICAL: Use sourceUrl as fallback when website is null
        const websiteUrl = scraped.website || scraped.sourceUrl || null;

        // Create business with all fields
        const newBusiness = await db.business.create({
          data: {
            name: scraped.name,
            slug,
            description:
              scraped.description || `${scraped.name} in ${scraped.city}`,
            category: scraped.category,
            address: scraped.address,
            city: scraped.city,
            state: scraped.state,
            zipCode: scraped.zipCode,
            latitude: scraped.latitude || 37.5485,
            longitude: scraped.longitude || -121.9886,
            phone: scraped.phone || "",
            email: scraped.email,
            website: websiteUrl, // Uses sourceUrl fallback

            // Transfer additional metadata
            hours: metadata.hours || null,
            priceRange: metadata.priceRange as
              | "BUDGET"
              | "MODERATE"
              | "PREMIUM"
              | "LUXURY"
              | null,
            serviceList: metadata.serviceList || [],

            ownerId, // Validated admin user ID
            status: "PUBLISHED",
            verificationStatus: "UNVERIFIED",
            isScraped: true,
            scrapedBusinessId: scraped.id,
            scrapedFrom: metadata.source || scraped.sourceUrl,
            scrapedAt: scraped.scrapedAt,
            confidenceScore: metadata.confidence || null,
          },
        });

        let photosTransferred = 0;
        let tagsTransferred = 0;

        // Transfer photos if available
        if (metadata.photos && metadata.photos.length > 0) {
          const validPhotos = metadata.photos.filter((photo) => {
            try {
              new URL(photo.url);
              return true;
            } catch {
              return false;
            }
          });

          if (validPhotos.length > 0) {
            await db.businessPhoto.createMany({
              data: validPhotos.map((photo, index) => ({
                businessId: newBusiness.id,
                url: photo.url,
                caption: photo.caption || null,
                type: photo.type || "general",
                order: index,
                isApproved: true,
              })),
            });
            photosTransferred = validPhotos.length;
          }
        }

        // Transfer tags if available
        if (metadata.tags && metadata.tags.length > 0) {
          const validTags = metadata.tags.filter((tag) =>
            Object.values(BusinessTag).includes(tag as BusinessTag)
          );

          if (validTags.length > 0) {
            await db.businessTagRelation.createMany({
              data: validTags.map((tag) => ({
                businessId: newBusiness.id,
                tag: tag as BusinessTag,
              })),
              skipDuplicates: true,
            });
            tagsTransferred = validTags.length;
          }
        }

        return NextResponse.json({
          message: "Business approved and created",
          business: newBusiness,
          scrapedBusiness: updatedBusiness,
          photosTransferred,
          tagsTransferred,
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
