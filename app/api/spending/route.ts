import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/spending - Get user's spending entries
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) {
      where.category = category;
    }

    // Get spending entries
    const entries = await db.spendingEntry.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate totals
    const totalSpent = entries.reduce((sum: number, entry: { amount: number }) => sum + entry.amount, 0);

    // Group by category
    const byCategory = entries.reduce((acc: any, entry: { category: string; amount: number }) => {
      const cat = entry.category;
      if (!acc[cat]) {
        acc[cat] = { category: cat, total: 0, count: 0 };
      }
      acc[cat].total += entry.amount;
      acc[cat].count += 1;
      return acc;
    }, {});

    // Group by business
    const byBusiness = entries.reduce((acc: any, entry: { businessId: string; business: any; amount: number }) => {
      const bizId = entry.businessId;
      if (!acc[bizId]) {
        acc[bizId] = {
          business: entry.business,
          total: 0,
          count: 0,
        };
      }
      acc[bizId].total += entry.amount;
      acc[bizId].count += 1;
      return acc;
    }, {});

    // Group by month
    const byMonth = entries.reduce((acc: any, entry: { date: string | Date; amount: number }) => {
      const month = new Date(entry.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, total: 0, count: 0 };
      }
      acc[month].total += entry.amount;
      acc[month].count += 1;
      return acc;
    }, {});

    return NextResponse.json({
      entries,
      summary: {
        totalSpent,
        totalEntries: entries.length,
        byCategory: Object.values(byCategory),
        byBusiness: Object.values(byBusiness),
        byMonth: Object.values(byMonth).sort((a: any, b: any) =>
          a.month.localeCompare(b.month)
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching spending entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch spending entries" },
      { status: 500 }
    );
  }
}

// POST /api/spending - Create a new spending entry
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { businessId, amount, description, date } = body;

    // Validate required fields
    if (!businessId || !amount) {
      return NextResponse.json(
        { error: "Business ID and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get business to get its category
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { category: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Create spending entry
    const entry = await db.spendingEntry.create({
      data: {
        userId: session.user.id as string,
        businessId,
        amount: parseFloat(amount),
        category: business.category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            coverImage: true,
          },
        },
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error creating spending entry:", error);
    return NextResponse.json(
      { error: "Failed to create spending entry" },
      { status: 500 }
    );
  }
}
