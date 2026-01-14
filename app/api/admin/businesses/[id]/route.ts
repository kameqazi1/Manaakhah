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

// GET /api/admin/businesses/:id - Get single business
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: true,
        tags: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/businesses/:id - Update business
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Allowed fields for admin to update
    const allowedFields = [
      "name",
      "description",
      "shortDescription",
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
      "status",
      "verificationStatus",
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

    const updatedBusiness = await db.business.update({
      where: { id: businessId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Business updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/businesses/:id - Delete business
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const businessId = resolvedParams.id;

    // Delete related records first
    await db.review.deleteMany({
      where: { businessId },
    });

    await db.business.delete({
      where: { id: businessId },
    });

    return NextResponse.json({
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
