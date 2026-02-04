import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/events/:id/rsvp - RSVP to an event
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      // Mock mode: Get user from headers
      userId = req.headers.get("x-user-id");
    } else {
      // Production mode: Get user from NextAuth session
      const session = await auth();
      if (session?.user) {
        userId = session.user.id as string;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = id;
    const body = await req.json();
    const { status = "going", ticketCount = 1 } = body;

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.isCancelled) {
      return NextResponse.json({ error: "Event is cancelled" }, { status: 400 });
    }

    // Check if event is full
    if (event.maxAttendees) {
      const currentGoingCount = event.rsvps.filter((r: { status: string }) => r.status === "going").length;
      if (currentGoingCount >= event.maxAttendees && status === "going") {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
      }
    }

    // Check if user already has an RSVP
    const existingRsvp = await db.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingRsvp) {
      // Update existing RSVP
      const updatedRsvp = await db.eventRsvp.update({
        where: { id: existingRsvp.id },
        data: {
          status,
          ticketCount,
        },
      });

      // Update event attendee count
      const goingCount = await db.eventRsvp.count({
        where: {
          eventId,
          status: "going",
        },
      });

      await db.event.update({
        where: { id: eventId },
        data: {
          currentAttendees: goingCount,
        },
      });

      return NextResponse.json({
        message: "RSVP updated successfully",
        rsvp: updatedRsvp,
      });
    }

    // Create new RSVP
    const rsvp = await db.eventRsvp.create({
      data: {
        eventId,
        userId,
        status,
        ticketCount,
      },
    });

    // Update event attendee count
    if (status === "going") {
      await db.event.update({
        where: { id: eventId },
        data: {
          currentAttendees: event.currentAttendees + 1,
        },
      });
    }

    return NextResponse.json({
      message: "RSVP created successfully",
      rsvp,
    });
  } catch (error) {
    console.error("Error creating RSVP:", error);
    return NextResponse.json({ error: "Failed to create RSVP" }, { status: 500 });
  }
}

// DELETE /api/events/:id/rsvp - Cancel RSVP
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    } else {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id as string;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = id;

    // Find and delete RSVP
    const rsvp = await db.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    await db.eventRsvp.delete({
      where: { id: rsvp.id },
    });

    // Update event attendee count
    if (rsvp.status === "going") {
      const event = await db.event.findUnique({
        where: { id: eventId },
      });

      if (event) {
        await db.event.update({
          where: { id: eventId },
          data: {
            currentAttendees: Math.max(0, event.currentAttendees - 1),
          },
        });
      }
    }

    return NextResponse.json({
      message: "RSVP cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling RSVP:", error);
    return NextResponse.json({ error: "Failed to cancel RSVP" }, { status: 500 });
  }
}
