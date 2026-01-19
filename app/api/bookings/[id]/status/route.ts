import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// PUT /api/bookings/:id/status - Update booking status
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { status, ownerNotes, rejectionReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const { id: bookingId } = await params;

    // Get the booking
    const bookings = await db.booking.findMany({
      where: { id: bookingId },
    });

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookings[0];

    // Get the business
    const business = await db.business.findUnique({
      where: { id: booking.businessId },
    });

    // Authorization check
    const isBusinessOwner = business?.ownerId === userId;
    const isCustomer = booking.customerId === userId;

    // Only business owner can confirm/reject
    if ((status === "CONFIRMED" || status === "REJECTED" || status === "COMPLETED") && !isBusinessOwner) {
      return NextResponse.json(
        { error: "Only business owner can update to this status" },
        { status: 403 }
      );
    }

    // Customer can only cancel their own bookings
    if (status === "CANCELLED" && !isCustomer && !isBusinessOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {
      status,
      statusHistory: [
        ...booking.statusHistory,
        { status, timestamp: new Date() },
      ],
    };

    if (ownerNotes) updateData.ownerNotes = ownerNotes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    if (status === "CONFIRMED") updateData.confirmedAt = new Date();
    if (status === "COMPLETED") updateData.completedAt = new Date();
    if (status === "CANCELLED") updateData.cancelledAt = new Date();

    // Update booking
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Booking status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
  }
}
