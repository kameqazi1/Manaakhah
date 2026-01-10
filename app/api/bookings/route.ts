import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/bookings - Get user's bookings
export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "customer";
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    const where: any = {};

    if (role === "customer" || userRole === "CONSUMER") {
      where.customerId = userId;
    } else if (role === "business" || userRole === "BUSINESS_OWNER") {
      // Get businesses owned by this user
      const businesses = await db.business.findMany({
        where: { ownerId: userId },
      });
      const businessIds = businesses.map((b) => b.id);

      if (businessIds.length === 0) {
        return NextResponse.json({ bookings: [] });
      }

      // Filter bookings by business IDs
      const allBookings = await db.booking.findMany({
        include: {
          business: true,
          customer: true,
        },
        orderBy: { appointmentDate: "desc" },
      });

      const filteredBookings = allBookings.filter((b) => businessIds.includes(b.businessId));

      return NextResponse.json({ bookings: filteredBookings });
    }

    if (status) where.status = status;

    if (upcoming) {
      // Filter for future appointments in mock mode
      const allBookings = await db.booking.findMany({
        where,
        include: {
          business: true,
          customer: true,
        },
        orderBy: { appointmentDate: "desc" },
      });

      const futureBookings = allBookings.filter(
        (b) => new Date(b.appointmentDate) > new Date()
      );

      return NextResponse.json({ bookings: futureBookings });
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        business: true,
        customer: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(req: Request) {
  try {
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessId,
      serviceType,
      appointmentDate,
      appointmentTime,
      duration,
      notes,
    } = body;

    // Validation
    if (!businessId || !serviceType || !appointmentDate || !appointmentTime || !duration) {
      return NextResponse.json(
        { error: "businessId, serviceType, appointmentDate, appointmentTime, and duration are required" },
        { status: 400 }
      );
    }

    // Check if appointment is in the future
    const aptDate = new Date(appointmentDate);
    if (aptDate < new Date()) {
      return NextResponse.json(
        { error: "Appointment must be in the future" },
        { status: 400 }
      );
    }

    // Check if user is trying to book their own business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (business?.ownerId === userId) {
      return NextResponse.json(
        { error: "You cannot book your own business" },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        businessId,
        customerId: userId,
        serviceType,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        duration: parseInt(duration),
        notes: notes || null,
        status: "PENDING",
        statusHistory: [
          { status: "PENDING", timestamp: new Date() },
        ],
      },
    });

    return NextResponse.json({
      message: "Booking request submitted successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
