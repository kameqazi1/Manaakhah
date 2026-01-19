import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/me - Get current user profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        bio: true,
        location: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        trustScore: true,
        karmaPoints: true,
        isVerifiedReviewer: true,
        reviewCount: true,
        helpfulVoteCount: true,
        preferredLanguage: true,
        timezone: true,
        notificationPrefs: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        // Include counts
        _count: {
          select: {
            reviews: true,
            businesses: true,
            savedBusinesses: true,
            followedBusinesses: true,
            followedUsers: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          reviews: user._count.reviews,
          businesses: user._count.businesses,
          savedBusinesses: user._count.savedBusinesses,
          following: user._count.followedUsers + user._count.followedBusinesses,
          followers: user._count.followers,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/me - Update current user profile
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      bio,
      location,
      image,
      preferredLanguage,
      timezone,
      notificationPrefs,
      quietHoursStart,
      quietHoursEnd,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        bio: bio !== undefined ? bio : undefined,
        location: location !== undefined ? location : undefined,
        image: image !== undefined ? image : undefined,
        preferredLanguage: preferredLanguage !== undefined ? preferredLanguage : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        notificationPrefs: notificationPrefs !== undefined ? notificationPrefs : undefined,
        quietHoursStart: quietHoursStart !== undefined ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnd !== undefined ? quietHoursEnd : undefined,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        bio: true,
        location: true,
        role: true,
        preferredLanguage: true,
        timezone: true,
        notificationPrefs: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: session.user.id,
        details: { updated: Object.keys(body) },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
