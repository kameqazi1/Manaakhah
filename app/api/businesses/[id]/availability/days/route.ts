import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/businesses/[id]/availability/days - Get days business is open
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    const availability = await db.businessAvailability.findMany({
      where: {
        businessId,
        isAvailable: true,
      },
      select: {
        dayOfWeek: true,
      },
    });

    const days = availability.map((a: { dayOfWeek: number }) => a.dayOfWeek);

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Error fetching availability days:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
