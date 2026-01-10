import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/reviews - Get reviews for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const rating = searchParams.get("rating");
    const verified = searchParams.get("verified");
    const sortBy = searchParams.get("sortBy") || "newest";

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const where: any = {
      businessId,
      status: "PUBLISHED",
    };

    if (rating) where.rating = parseInt(rating);
    if (verified === "true") where.isVerified = true;

    const orderBy: any = {};
    if (sortBy === "newest") orderBy.createdAt = "desc";
    if (sortBy === "oldest") orderBy.createdAt = "asc";
    if (sortBy === "highest") orderBy.rating = "desc";
    if (sortBy === "lowest") orderBy.rating = "asc";
    if (sortBy === "helpful") orderBy.helpfulCount = "desc";

    const reviews = await db.review.findMany({
      where,
      include: {
        user: true,
      },
      orderBy,
    });

    // Calculate stats
    const allReviews = await db.review.findMany({
      where: { businessId, status: "PUBLISHED" },
    });

    const stats = {
      averageRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0,
      totalReviews: allReviews.length,
      breakdown: {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      },
      verifiedPercentage: allReviews.length > 0
        ? Math.round((allReviews.filter((r) => r.isVerified).length / allReviews.length) * 100)
        : 0,
    };

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review
export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, bookingId, rating, title, content, photos } = body;

    // Validation
    if (!businessId || !rating || !content) {
      return NextResponse.json(
        { error: "businessId, rating, and content are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: "Review content must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Check if user already reviewed this business
    const existingReview = await db.review.findMany({
      where: {
        businessId,
        userId,
        bookingId: bookingId || null,
      },
    });

    if (existingReview && existingReview.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this business" },
        { status: 400 }
      );
    }

    // Check if user owns this business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (business?.ownerId === userId) {
      return NextResponse.json(
        { error: "You cannot review your own business" },
        { status: 400 }
      );
    }

    // Create review
    const review = await db.review.create({
      data: {
        businessId,
        userId,
        bookingId: bookingId || null,
        rating,
        title: title || null,
        content,
        photos: photos || [],
        isVerified: !!bookingId,
        verifiedAt: bookingId ? new Date() : null,
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
