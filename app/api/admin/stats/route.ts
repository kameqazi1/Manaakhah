import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(req: Request) {
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

    // Get all statistics
    const businesses = await db.business.findMany({});
    const users = await db.user.findMany({});
    const reviews = await db.review.findMany({});
    const bookings = await db.booking.findMany({});
    const messages = await db.message.findMany({});
    const posts = await db.communityPost.findMany({});
    const scrapedBusinesses = await db.scrapedBusiness.findMany({});

    const stats = {
      totalBusinesses: businesses.length,
      pendingBusinesses: scrapedBusinesses.filter((b) => b.claimStatus === "PENDING_REVIEW").length,
      totalUsers: users.length,
      totalReviews: reviews.length,
      flaggedReviews: reviews.filter((r) => r.status === "FLAGGED").length,
      totalBookings: bookings.length,
      totalMessages: messages.length,
      communityPosts: posts.length,
      flaggedPosts: posts.filter((p) => p.status === "FLAGGED").length,
      usersByRole: {
        CONSUMER: users.filter((u) => u.role === "CONSUMER").length,
        BUSINESS_OWNER: users.filter((u) => u.role === "BUSINESS_OWNER").length,
        ADMIN: users.filter((u) => u.role === "ADMIN").length,
      },
      businessesByStatus: {
        PUBLISHED: businesses.filter((b) => b.status === "PUBLISHED").length,
        DRAFT: businesses.filter((b) => b.status === "DRAFT").length,
        PENDING_APPROVAL: businesses.filter((b) => b.status === "PENDING_APPROVAL").length,
        SUSPENDED: businesses.filter((b) => b.status === "SUSPENDED").length,
      },
      reviewsByStatus: {
        PUBLISHED: reviews.filter((r) => r.status === "PUBLISHED").length,
        PENDING: reviews.filter((r) => r.status === "PENDING").length,
        FLAGGED: reviews.filter((r) => r.status === "FLAGGED").length,
        REMOVED: reviews.filter((r) => r.status === "REMOVED").length,
      },
      bookingsByStatus: {
        PENDING: bookings.filter((b) => b.status === "PENDING").length,
        CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
        COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
        CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
        REJECTED: bookings.filter((b) => b.status === "REJECTED").length,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
