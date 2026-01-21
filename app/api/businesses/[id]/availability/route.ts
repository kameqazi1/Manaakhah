import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTimeSlots } from "@/lib/availability";
import { startOfDay, endOfDay, format } from "date-fns";

// GET /api/businesses/[id]/availability?date=YYYY-MM-DD&duration=60
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const durationStr = searchParams.get("duration");

    if (!dateStr) {
      return NextResponse.json({ error: "date query param is required (YYYY-MM-DD)" }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const serviceDuration = durationStr ? parseInt(durationStr) : 60;
    const dayOfWeek = date.getDay();

    // Get business availability for this day of week
    const availability = await db.businessAvailability.findUnique({
      where: {
        businessId_dayOfWeek: { businessId, dayOfWeek },
      },
    });

    if (!availability || !availability.isAvailable) {
      return NextResponse.json({
        slots: [],
        message: "Business is closed on this day",
        dayOfWeek,
        isOpen: false,
      });
    }

    // Check for exception on this specific date
    const exception = await db.availabilityException.findUnique({
      where: {
        businessId_date: { businessId, date: startOfDay(date) },
      },
    });

    if (exception && !exception.isAvailable) {
      return NextResponse.json({
        slots: [],
        message: exception.reason || "Business is closed on this date",
        isOpen: false,
        exception: {
          reason: exception.reason,
        },
      });
    }

    // If exception exists with modified hours, use those instead
    const effectiveAvailability = exception?.isAvailable && exception.startTime && exception.endTime
      ? {
          startTime: exception.startTime,
          endTime: exception.endTime,
          slotDuration: availability.slotDuration,
          bufferTime: availability.bufferTime,
          isAvailable: true,
        }
      : {
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: availability.slotDuration,
          bufferTime: availability.bufferTime,
          isAvailable: availability.isAvailable,
        };

    // Get existing bookings for this date
    const existingBookings = await db.booking.findMany({
      where: {
        businessId,
        appointmentDate: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        appointmentTime: true,
        duration: true,
      },
    });

    // Generate available time slots
    const slots = generateTimeSlots(
      effectiveAvailability,
      existingBookings,
      date,
      serviceDuration
    );

    return NextResponse.json({
      slots,
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek,
      isOpen: true,
      hours: {
        start: effectiveAvailability.startTime,
        end: effectiveAvailability.endTime,
      },
      serviceDuration,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
