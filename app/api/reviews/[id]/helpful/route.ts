import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// POST /api/reviews/:id/helpful - Toggle helpful vote
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = id;

    // In mock mode, we'll simulate the helpful vote by updating the helpfulCount
    if (isMockMode()) {
      const review = await db.review.findMany({
        where: { id: reviewId },
      });

      if (!review || review.length === 0) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      const currentReview = review[0];
      const newCount = currentReview.helpfulCount + 1;

      await db.review.update({
        where: { id: reviewId },
        data: { helpfulCount: newCount },
      });

      return NextResponse.json({
        helpfulCount: newCount,
        userVoted: true,
      });
    }

    // For real database mode, implement proper helpful votes table
    return NextResponse.json({
      helpfulCount: 1,
      userVoted: true,
    });
  } catch (error) {
    console.error("Error toggling helpful vote:", error);
    return NextResponse.json({ error: "Failed to toggle helpful vote" }, { status: 500 });
  }
}
