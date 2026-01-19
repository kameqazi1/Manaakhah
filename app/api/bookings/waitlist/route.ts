import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookings/waitlist - Get waitlist for a booking
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const date = searchParams.get("date");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Check if user is business owner/staff
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
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

    const canManageBookings =
      isOwner || (staffRole?.permissions as any)?.canManageBookings;

    if (!canManageBookings) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get waitlist entries
    const where: any = {
      booking: {
        businessId,
        status: "WAITLISTED",
      },
    };

    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      where.booking.appointmentDate = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    const waitlist = await prisma.waitlist.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({
      waitlist: waitlist.map((w) => ({
        id: w.id,
        position: w.position,
        notifiedAt: w.notifiedAt,
        expiresAt: w.expiresAt,
        createdAt: w.createdAt,
        booking: {
          id: w.booking.id,
          serviceType: w.booking.serviceType,
          appointmentDate: w.booking.appointmentDate,
          appointmentTime: w.booking.appointmentTime,
          partySize: w.booking.partySize,
          notes: w.booking.notes,
          customer: w.booking.customer,
        },
      })),
    });
  } catch (error) {
    console.error("Get waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to get waitlist" },
      { status: 500 }
    );
  }
}

// POST /api/bookings/waitlist - Add to waitlist
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user is the customer or business owner/staff
    const isCustomer = booking.customerId === session.user.id;
    const isOwner = booking.business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId: booking.businessId,
          userId: session.user.id,
        },
      },
    });

    const canManage =
      isCustomer || isOwner || (staffRole?.permissions as any)?.canManageBookings;

    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already on waitlist
    const existingWaitlist = await prisma.waitlist.findUnique({
      where: { bookingId },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "Already on waitlist" },
        { status: 400 }
      );
    }

    // Get the next position
    const lastPosition = await prisma.waitlist.findFirst({
      where: {
        booking: {
          businessId: booking.businessId,
          appointmentDate: booking.appointmentDate,
        },
      },
      orderBy: { position: "desc" },
    });

    const position = (lastPosition?.position || 0) + 1;

    // Set expiration (24 hours by default)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        bookingId,
        position,
        expiresAt,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "WAITLISTED" },
    });

    return NextResponse.json({
      success: true,
      waitlist: {
        id: waitlistEntry.id,
        position: waitlistEntry.position,
        expiresAt: waitlistEntry.expiresAt,
      },
      message: `You are #${position} on the waitlist`,
    });
  } catch (error) {
    console.error("Add to waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/waitlist - Notify next in line or move position
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { waitlistId, action } = body; // action: notify, confirm, reorder

    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: {
        booking: {
          include: {
            business: { select: { ownerId: true, name: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Check permission
    const isOwner = waitlistEntry.booking.business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId: waitlistEntry.booking.businessId,
          userId: session.user.id,
        },
      },
    });

    const canManage =
      isOwner || (staffRole?.permissions as any)?.canManageBookings;

    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "notify") {
      // Notify the customer that a spot is available
      await prisma.notification.create({
        data: {
          userId: waitlistEntry.booking.customerId,
          type: "WAITLIST_AVAILABLE",
          title: "Spot Available!",
          message: `A spot has opened up for your booking at ${waitlistEntry.booking.business.name}. Confirm within 2 hours to secure it.`,
          link: `/bookings/${waitlistEntry.booking.id}`,
          data: {
            waitlistId: waitlistEntry.id,
            bookingId: waitlistEntry.booking.id,
          },
        },
      });

      // Set new expiration (2 hours to confirm)
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + 2);

      await prisma.waitlist.update({
        where: { id: waitlistId },
        data: {
          notifiedAt: new Date(),
          expiresAt: newExpiry,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Customer notified",
      });
    } else if (action === "confirm") {
      // Confirm the booking from waitlist
      await prisma.booking.update({
        where: { id: waitlistEntry.booking.id },
        data: { status: "CONFIRMED" },
      });

      // Delete waitlist entry
      await prisma.waitlist.delete({
        where: { id: waitlistId },
      });

      // Update positions for remaining entries
      await prisma.waitlist.updateMany({
        where: {
          position: { gt: waitlistEntry.position },
          booking: {
            businessId: waitlistEntry.booking.businessId,
            appointmentDate: waitlistEntry.booking.appointmentDate,
          },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Booking confirmed from waitlist",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/waitlist - Remove from waitlist
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const waitlistId = searchParams.get("id");

    if (!waitlistId) {
      return NextResponse.json(
        { error: "Waitlist ID is required" },
        { status: 400 }
      );
    }

    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: {
        booking: {
          include: {
            business: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Check permission
    const isCustomer = waitlistEntry.booking.customerId === session.user.id;
    const isOwner = waitlistEntry.booking.business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId: waitlistEntry.booking.businessId,
          userId: session.user.id,
        },
      },
    });

    const canManage =
      isCustomer ||
      isOwner ||
      (staffRole?.permissions as any)?.canManageBookings;

    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete waitlist entry
    await prisma.waitlist.delete({
      where: { id: waitlistId },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: waitlistEntry.booking.id },
      data: { status: "CANCELLED" },
    });

    // Update positions for remaining entries
    await prisma.waitlist.updateMany({
      where: {
        position: { gt: waitlistEntry.position },
        booking: {
          businessId: waitlistEntry.booking.businessId,
          appointmentDate: waitlistEntry.booking.appointmentDate,
        },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Removed from waitlist",
    });
  } catch (error) {
    console.error("Remove from waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to remove from waitlist" },
      { status: 500 }
    );
  }
}
