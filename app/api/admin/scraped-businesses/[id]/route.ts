import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdminAuth } from "@/lib/admin-auth";
import { BusinessTag, BusinessCategory, ScrapedBusinessClaimStatus } from "@prisma/client";
import { z } from "zod";

// Zod schema for PUT request body
const UpdateStatusSchema = z.object({
  claimStatus: z.enum(["APPROVED", "REJECTED", "PENDING_REVIEW", "CLAIMED"] as const, {
    message: "Invalid claim status. Must be APPROVED, REJECTED, PENDING_REVIEW, or CLAIMED",
  }),
});

// Helper to transform empty strings to undefined (so they become null in DB)
const emptyToUndefined = (val: string | undefined) => (val === "" ? undefined : val);

// Zod schema for PATCH request body - all fields optional
const EditBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).transform(emptyToUndefined).optional(),
  category: z.nativeEnum(BusinessCategory, {
    message: "Invalid category",
  }).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  phone: z.string().max(30).transform(emptyToUndefined).optional(),
  email: z.string().email().or(z.literal("")).transform(emptyToUndefined).optional(),
  website: z.string().url().or(z.literal("")).transform(emptyToUndefined).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).strict()
  // Require both lat/lng or neither - partial updates break maps
  .refine(
    (data) => {
      const hasLat = data.latitude !== undefined;
      const hasLng = data.longitude !== undefined;
      return hasLat === hasLng;
    },
    { message: "Must provide both latitude and longitude, or neither" }
  );

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// GET /api/admin/scraped-businesses/:id - Get single scraped business
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
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
    // Server-side session authentication - no header spoofing possible
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse and validate request body with Zod
    const body = await req.json();
    const parseResult = UpdateStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { claimStatus } = parseResult.data;

    // Get admin user ID from authenticated session (not from spoofable headers)
    const adminUserId = auth.userId;

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // For non-APPROVED statuses, just update the scraped business
    if (claimStatus !== "APPROVED") {
      const updatedBusiness = await db.scrapedBusiness.update({
        where: { id: businessId },
        data: {
          claimStatus: claimStatus as ScrapedBusinessClaimStatus,
          reviewedAt: new Date(),
          ...(adminUserId && { reviewedBy: adminUserId }),
        },
      });

      return NextResponse.json({
        message: "Business status updated",
        business: updatedBusiness,
      });
    }

    // For APPROVED status, we need to create a Business record
    // First, fetch the scraped business
    const scraped = await db.scrapedBusiness.findUnique({
      where: { id: businessId },
    });

    if (!scraped) {
      return NextResponse.json({ error: "Scraped business not found" }, { status: 404 });
    }

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

    // Generate unique slug with crypto-safe random suffix
    const baseSlug = scraped.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50); // Limit base slug length
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    // CRITICAL: Use sourceUrl as fallback when website is null
    const websiteUrl = scraped.website || scraped.sourceUrl || null;

    // Handle missing coordinates - use null instead of hardcoded coordinates
    const latitude = scraped.latitude || null;
    const longitude = scraped.longitude || null;

    // CRITICAL: Wrap EVERYTHING in a transaction - including duplicate check
    // This prevents race conditions where two concurrent approvals both pass the check
    try {
      const result = await db.$transaction(async (tx) => {
        // Step 1: Check for duplicates INSIDE the transaction
        // This ensures atomic check-and-create
        const potentialDuplicate = await tx.business.findFirst({
          where: {
            OR: [
              // Same name and city (case-insensitive would be better but Prisma doesn't support it easily)
              { name: scraped.name, city: scraped.city },
              // Same phone (if exists and not empty)
              ...(scraped.phone && scraped.phone.trim() ? [{ phone: scraped.phone }] : []),
              // Same address and city
              { address: scraped.address, city: scraped.city },
            ],
          },
          select: { id: true, name: true, address: true },
        });

        if (potentialDuplicate) {
          // Throw to trigger rollback - we'll catch this specifically
          const error = new Error("DUPLICATE_DETECTED");
          (error as any).duplicate = potentialDuplicate;
          throw error;
        }

        // Step 2: Create the business
        const newBusiness = await tx.business.create({
          data: {
            name: scraped.name,
            slug,
            description: scraped.description || `${scraped.name} in ${scraped.city}`,
            category: scraped.category,
            address: scraped.address,
            city: scraped.city,
            state: scraped.state,
            zipCode: scraped.zipCode,
            latitude,
            longitude,
            phone: scraped.phone || "",
            email: scraped.email,
            website: websiteUrl,

            // Transfer additional metadata
            hours: metadata.hours || null,
            priceRange: metadata.priceRange as "BUDGET" | "MODERATE" | "PREMIUM" | "LUXURY" | null,
            serviceList: metadata.serviceList || [],

            ownerId,
            status: "PUBLISHED",
            verificationStatus: "PENDING",
            isScraped: true,
            scrapedBusinessId: scraped.id,
            scrapedFrom: metadata.source || scraped.sourceUrl,
            scrapedAt: scraped.scrapedAt,
            confidenceScore: metadata.confidence || null,
          },
        });

        let photosTransferred = 0;
        let tagsTransferred = 0;

        // Step 3: Transfer photos if available
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
            await tx.businessPhoto.createMany({
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

        // Step 4: Transfer tags if available
        if (metadata.tags && metadata.tags.length > 0) {
          const validTags = metadata.tags.filter((tag) =>
            Object.values(BusinessTag).includes(tag as BusinessTag)
          );

          if (validTags.length > 0) {
            await tx.businessTagRelation.createMany({
              data: validTags.map((tag) => ({
                businessId: newBusiness.id,
                tag: tag as BusinessTag,
              })),
              skipDuplicates: true,
            });
            tagsTransferred = validTags.length;
          }
        }

        // Step 5: Update scraped business status ONLY inside transaction
        // This is the ONLY place we update status - not outside!
        const updatedScraped = await tx.scrapedBusiness.update({
          where: { id: businessId },
          data: {
            claimStatus: "APPROVED",
            reviewedAt: new Date(),
            ...(adminUserId && { reviewedBy: adminUserId }),
          },
        });

        return {
          business: newBusiness,
          scrapedBusiness: updatedScraped,
          photosTransferred,
          tagsTransferred,
        };
      });

      return NextResponse.json({
        message: "Business approved and created",
        ...result,
        missingCoordinates: latitude === null,
      });
    } catch (txError: any) {
      // Handle duplicate detection specially
      if (txError.message === "DUPLICATE_DETECTED") {
        return NextResponse.json(
          {
            error: "Potential duplicate detected",
            duplicate: txError.duplicate,
            message: `A business with similar details already exists: "${txError.duplicate.name}" at "${txError.duplicate.address}"`,
          },
          { status: 409 }
        );
      }

      console.error("Transaction failed during approval:", txError);

      // Provide detailed error message
      let errorStep = "unknown";
      if (txError.message?.includes("Business")) errorStep = "business creation";
      else if (txError.message?.includes("Photo")) errorStep = "photo transfer";
      else if (txError.message?.includes("Tag")) errorStep = "tag transfer";
      else if (txError.message?.includes("ScrapedBusiness")) errorStep = "status update";
      else if (txError.code === "P2002") errorStep = "unique constraint (slug collision)";

      return NextResponse.json(
        {
          error: "Transaction failed - all changes rolled back",
          failedStep: errorStep,
          details: txError.message,
        },
        { status: 500 }
      );
    }
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
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Validate and parse with Zod - rejects unknown fields, validates types
    const parseResult = EditBusinessSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

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
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
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
