import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  categories: z.object({
    bookings: z.boolean().optional(),
    messages: z.boolean().optional(),
    reviews: z.boolean().optional(),
    deals: z.boolean().optional(),
    events: z.boolean().optional(),
    community: z.boolean().optional(),
    system: z.boolean().optional(),
  }).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  digestEnabled: z.boolean().optional(),
  digestFrequency: z.enum(["daily", "weekly"]).optional(),
});

// GET /api/notifications/preferences - Get notification preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notificationPrefs: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get digest settings
    const digest = await prisma.notificationDigest.findUnique({
      where: { userId: session.user.id },
    });

    // Default preferences
    const defaultPrefs = {
      email: true,
      push: true,
      sms: false,
      categories: {
        bookings: true,
        messages: true,
        reviews: true,
        deals: true,
        events: true,
        community: true,
        system: true,
      },
    };

    const preferences = user.notificationPrefs
      ? { ...defaultPrefs, ...(user.notificationPrefs as object) }
      : defaultPrefs;

    return NextResponse.json({
      preferences: {
        ...preferences,
        quietHoursEnabled: !!(user.quietHoursStart && user.quietHoursEnd),
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd,
        digestEnabled: digest?.isEnabled ?? false,
        digestFrequency: digest?.frequency ?? "daily",
      },
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = preferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      email,
      push,
      sms,
      categories,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      digestEnabled,
      digestFrequency,
    } = validationResult.data;

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    });

    const currentPrefs = (user?.notificationPrefs as object) || {};

    // Merge preferences
    const newPrefs = {
      ...currentPrefs,
      ...(email !== undefined && { email }),
      ...(push !== undefined && { push }),
      ...(sms !== undefined && { sms }),
      ...(categories && { categories: { ...(currentPrefs as any).categories, ...categories } }),
    };

    // Update user preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPrefs: newPrefs,
        quietHoursStart: quietHoursEnabled ? (quietHoursStart || null) : null,
        quietHoursEnd: quietHoursEnabled ? (quietHoursEnd || null) : null,
      },
    });

    // Update digest settings
    if (digestEnabled !== undefined || digestFrequency !== undefined) {
      const nextSendAt = new Date();
      if (digestFrequency === "weekly") {
        nextSendAt.setDate(nextSendAt.getDate() + 7);
      } else {
        nextSendAt.setDate(nextSendAt.getDate() + 1);
      }
      nextSendAt.setHours(9, 0, 0, 0); // 9 AM

      await prisma.notificationDigest.upsert({
        where: { userId: session.user.id },
        update: {
          isEnabled: digestEnabled ?? true,
          frequency: digestFrequency ?? "daily",
          nextSendAt,
        },
        create: {
          userId: session.user.id,
          isEnabled: digestEnabled ?? true,
          frequency: digestFrequency ?? "daily",
          nextSendAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
