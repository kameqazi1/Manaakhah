import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/business/[id]/analytics - Get business analytics
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y
    const type = searchParams.get("type"); // overview, views, bookings, reviews, demographics

    // Check permission
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, subscriptionTier: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canViewAnalytics =
      isOwner || (staffRole?.permissions as any)?.canViewAnalytics;

    if (!canViewAnalytics) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const [
      viewsData,
      bookingsData,
      reviewsData,
      messagesData,
      demographicsData,
      conversionData,
    ] = await Promise.all([
      // Views by source
      prisma.businessView.groupBy({
        by: ["source"],
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Bookings by status
      prisma.booking.groupBy({
        by: ["status"],
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Reviews stats
      prisma.review.aggregate({
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Messages count
      prisma.conversation.count({
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
      }),

      // Demographics (device types from views)
      prisma.businessView.groupBy({
        by: ["deviceType"],
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Total views count
      prisma.businessView.count({
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Get total counts
    const totalViews = viewsData.reduce((sum: number, v: any) => sum + v._count.id, 0);
    const totalBookings = bookingsData.reduce((sum: number, b: any) => sum + b._count.id, 0);
    const completedBookings =
      bookingsData.find((b: any) => b.status === "COMPLETED")?._count.id || 0;

    // Calculate conversion rate
    const conversionRate =
      totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(2) : 0;

    // Get previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const [previousViews, previousBookings] = await Promise.all([
      prisma.businessView.count({
        where: {
          businessId,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          businessId,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
    ]);

    // Calculate growth
    const viewsGrowth =
      previousViews > 0
        ? (((totalViews - previousViews) / previousViews) * 100).toFixed(1)
        : null;
    const bookingsGrowth =
      previousBookings > 0
        ? (((totalBookings - previousBookings) / previousBookings) * 100).toFixed(1)
        : null;

    // Get analytics snapshots if available
    const snapshots = await prisma.analyticsSnapshot.findMany({
      where: {
        businessId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      period,
      overview: {
        totalViews,
        totalBookings,
        completedBookings,
        conversionRate: parseFloat(conversionRate as string),
        newReviews: reviewsData._count.id,
        averageRating: reviewsData._avg.rating?.toFixed(1) || null,
        newConversations: messagesData,
        viewsGrowth: viewsGrowth ? parseFloat(viewsGrowth) : null,
        bookingsGrowth: bookingsGrowth ? parseFloat(bookingsGrowth) : null,
      },
      viewsBySource: viewsData.map((v: any) => ({
        source: v.source,
        count: v._count.id,
        percentage: ((v._count.id / totalViews) * 100).toFixed(1),
      })),
      bookingsByStatus: bookingsData.map((b: any) => ({
        status: b.status,
        count: b._count.id,
      })),
      demographics: {
        byDevice: demographicsData
          .filter((d: any) => d.deviceType)
          .map((d: any) => ({
            device: d.deviceType,
            count: d._count.id,
          })),
      },
      trend: snapshots.map((s: any) => ({
        date: s.date,
        views: s.views,
        bookings: s.bookings,
        revenue: s.revenue,
      })),
      // Premium features check
      isPremium: business.subscriptionTier !== "FREE",
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/analytics - Record a view or action
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const session = await auth();
    const body = await req.json();
    const { source, action } = body;

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (action === "view") {
      // Get device type from user agent
      const userAgent = req.headers.get("user-agent") || "";
      let deviceType = "desktop";
      if (/mobile/i.test(userAgent)) {
        deviceType = "mobile";
      } else if (/tablet/i.test(userAgent)) {
        deviceType = "tablet";
      }

      await prisma.businessView.create({
        data: {
          businessId,
          userId: session?.user?.id || null,
          source: source || "PROFILE",
          deviceType,
          referrer: body.referrer,
        },
      });

      // Increment view count
      await prisma.business.update({
        where: { id: businessId },
        data: { viewCount: { increment: 1 } },
      });
    } else if (action === "click") {
      // Increment click count (phone, website, directions clicks)
      await prisma.business.update({
        where: { id: businessId },
        data: { clickCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record analytics error:", error);
    return NextResponse.json(
      { error: "Failed to record analytics" },
      { status: 500 }
    );
  }
}
