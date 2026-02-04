import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/events - Get all events
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const upcoming = searchParams.get("upcoming") === "true";

    const where: any = {
      isCancelled: false,
    };

    if (businessId) {
      where.businessId = businessId;
    }

    if (upcoming) {
      where.startTime = {
        gte: new Date(),
      };
    }

    const events = await db.event.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        rsvps: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
