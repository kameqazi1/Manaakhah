import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/community/stats - Get community impact statistics
export async function GET() {
  try {
    // Get total businesses
    const totalBusinesses = await db.business.count({
      where: {
        status: "PUBLISHED",
      },
    });

    // Get total users
    const totalUsers = await db.user.count();

    // Get businesses by category
    const businessesByCategory = await db.business.groupBy({
      by: ["category"],
      where: {
        status: "PUBLISHED",
      },
      _count: true,
    });

    // Get new businesses this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newBusinessesThisMonth = await db.business.count({
      where: {
        status: "PUBLISHED",
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get total reviews
    const totalReviews = await db.review.count();

    // Get total events
    const totalEvents = await db.event.count({
      where: {
        isCancelled: false,
      },
    });

    // Get top cities
    const topCities = await db.business.groupBy({
      by: ["city"],
      where: {
        status: "PUBLISHED",
      },
      _count: true,
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: 5,
    });

    // Calculate growth trend (compare to last month)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const businessesLastMonth = await db.business.count({
      where: {
        status: "PUBLISHED",
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
      },
    });

    const growthRate = businessesLastMonth > 0
      ? ((newBusinessesThisMonth - businessesLastMonth) / businessesLastMonth) * 100
      : 100;

    return NextResponse.json({
      stats: {
        totalBusinesses,
        totalUsers,
        totalReviews,
        totalEvents,
        newBusinessesThisMonth,
        growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
        businessesByCategory: businessesByCategory.map((b: { category: string; _count: number }) => ({
          category: b.category,
          count: b._count,
        })),
        topCities: topCities.map((c: { city: string; _count: number }) => ({
          city: c.city,
          count: c._count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch community stats" },
      { status: 500 }
    );
  }
}
