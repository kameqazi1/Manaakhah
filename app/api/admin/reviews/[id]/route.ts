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

// GET /api/admin/reviews/:id - Get single review
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const reviewId = resolvedParams.id;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews/:id - Update review status
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
    const reviewId = resolvedParams.id;

    // Allowed fields for admin to update
    const allowedFields = ["status"];

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

    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/:id - Delete review
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const reviewId = resolvedParams.id;

    await db.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
