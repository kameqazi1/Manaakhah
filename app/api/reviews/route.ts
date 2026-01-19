import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/reviews - Get reviews for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const rating = searchParams.get("rating");
    const verified = searchParams.get("verified");
    const verifiedBooking = searchParams.get("verifiedBooking");
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const where: any = {
      businessId,
      status: "PUBLISHED",
    };

    if (rating) where.rating = parseInt(rating);
    if (verified === "true") where.isVerified = true;
    if (verifiedBooking === "true") where.isVerifiedBooking = true;

    const orderBy: any = [];
    // Always prioritize verified booking reviews
    orderBy.push({ isVerifiedBooking: "desc" });

    if (sortBy === "newest") orderBy.push({ createdAt: "desc" });
    if (sortBy === "oldest") orderBy.push({ createdAt: "asc" });
    if (sortBy === "highest") orderBy.push({ rating: "desc" });
    if (sortBy === "lowest") orderBy.push({ rating: "asc" });
    if (sortBy === "helpful") orderBy.push({ helpfulCount: "desc" });

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              isVerifiedReviewer: true,
              reviewCount: true,
              helpfulVoteCount: true,
            },
          },
          reviewPhotos: true,
          helpfulVotes: {
            select: { userId: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Calculate stats
    const allReviews = await db.review.findMany({
      where: { businessId, status: "PUBLISHED" },
      select: { rating: true, isVerified: true, isVerifiedBooking: true, sentimentScore: true },
    });

    // Calculate sentiment distribution
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    allReviews.forEach((r: any) => {
      if (r.sentimentScore !== null) {
        if (r.sentimentScore > 0.2) sentimentCounts.positive++;
        else if (r.sentimentScore < -0.2) sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      }
    });

    const stats = {
      averageRating: allReviews.length > 0
        ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
        : 0,
      totalReviews: allReviews.length,
      breakdown: {
        5: allReviews.filter((r: any) => r.rating === 5).length,
        4: allReviews.filter((r: any) => r.rating === 4).length,
        3: allReviews.filter((r: any) => r.rating === 3).length,
        2: allReviews.filter((r: any) => r.rating === 2).length,
        1: allReviews.filter((r: any) => r.rating === 1).length,
      },
      verifiedPercentage: allReviews.length > 0
        ? Math.round((allReviews.filter((r: any) => r.isVerified).length / allReviews.length) * 100)
        : 0,
      verifiedBookingPercentage: allReviews.length > 0
        ? Math.round((allReviews.filter((r: any) => r.isVerifiedBooking).length / allReviews.length) * 100)
        : 0,
      sentiment: sentimentCounts,
    };

    // Get AI summary if available
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { sentimentScore: true },
    });

    return NextResponse.json({
      reviews: reviews.map((r: any) => ({
        ...r,
        hasUserVoted: false, // Will be set by client based on userId
      })),
      stats,
      aiSummary: business?.sentimentScore !== null
        ? generateAISummary(allReviews, stats)
        : null,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

/**
 * Generate an AI-like summary of reviews
 * In production, this would use an actual AI model
 */
function generateAISummary(
  reviews: { rating: number; sentimentScore: number | null }[],
  stats: any
): {
  summary: string;
  highlights: string[];
  improvements: string[];
} {
  const avgRating = stats.averageRating;
  const total = stats.totalReviews;
  const verifiedPct = stats.verifiedBookingPercentage;

  let summary = "";
  if (avgRating >= 4.5) {
    summary = `Highly rated with an excellent ${avgRating.toFixed(1)}/5 rating based on ${total} reviews.`;
  } else if (avgRating >= 4.0) {
    summary = `Well-regarded with a solid ${avgRating.toFixed(1)}/5 rating from ${total} customers.`;
  } else if (avgRating >= 3.5) {
    summary = `Generally positive reception with a ${avgRating.toFixed(1)}/5 average across ${total} reviews.`;
  } else {
    summary = `Mixed reviews with a ${avgRating.toFixed(1)}/5 rating from ${total} customers.`;
  }

  if (verifiedPct > 50) {
    summary += ` ${verifiedPct}% of reviews are from verified bookings.`;
  }

  // In a real implementation, these would be extracted from review text using NLP
  const highlights = [];
  const improvements = [];

  if (avgRating >= 4.0) {
    highlights.push("Consistently high quality service");
    highlights.push("Customers appreciate the attention to detail");
  }
  if (stats.breakdown[5] > stats.breakdown[4]) {
    highlights.push("Strong majority of 5-star reviews");
  }

  if (stats.breakdown[1] + stats.breakdown[2] > total * 0.1) {
    improvements.push("Some customers reported areas for improvement");
  }

  return { summary, highlights, improvements };
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
