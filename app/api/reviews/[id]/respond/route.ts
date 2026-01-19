import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// POST /api/reviews/:id/respond - Business owner responds to review
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    if (!userId || (userRole !== "BUSINESS_OWNER" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { response } = body;

    if (!response || response.length === 0) {
      return NextResponse.json({ error: "Response text is required" }, { status: 400 });
    }

    if (response.length > 500) {
      return NextResponse.json(
        { error: "Response must be 500 characters or less" },
        { status: 400 }
      );
    }

    const reviewId = id;

    // Get the review
    const reviews = await db.review.findMany({
      where: { id: reviewId },
    });

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = reviews[0];

    // Get the business to verify ownership
    const business = await db.business.findUnique({
      where: { id: review.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if user owns the business
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "You can only respond to reviews on your own business" },
        { status: 403 }
      );
    }

    // Update review with owner response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        ownerResponse: response,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Response posted successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error posting review response:", error);
    return NextResponse.json({ error: "Failed to post response" }, { status: 500 });
  }
}
