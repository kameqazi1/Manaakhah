import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendStaffInvitationEmail } from "@/lib/email";

const staffRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "staff", "scheduler", "receptionist"]),
  permissions: z.object({
    canEditBusiness: z.boolean().default(false),
    canManageBookings: z.boolean().default(false),
    canRespondToReviews: z.boolean().default(false),
    canManageMessages: z.boolean().default(false),
    canViewAnalytics: z.boolean().default(false),
    canManageDeals: z.boolean().default(false),
    canManageEvents: z.boolean().default(false),
    canManageStaff: z.boolean().default(false),
  }).optional(),
});

// Default permissions by role
const defaultPermissions = {
  manager: {
    canEditBusiness: true,
    canManageBookings: true,
    canRespondToReviews: true,
    canManageMessages: true,
    canViewAnalytics: true,
    canManageDeals: true,
    canManageEvents: true,
    canManageStaff: true,
  },
  staff: {
    canEditBusiness: false,
    canManageBookings: true,
    canRespondToReviews: false,
    canManageMessages: true,
    canViewAnalytics: false,
    canManageDeals: false,
    canManageEvents: false,
    canManageStaff: false,
  },
  scheduler: {
    canEditBusiness: false,
    canManageBookings: true,
    canRespondToReviews: false,
    canManageMessages: false,
    canViewAnalytics: false,
    canManageDeals: false,
    canManageEvents: false,
    canManageStaff: false,
  },
  receptionist: {
    canEditBusiness: false,
    canManageBookings: true,
    canRespondToReviews: false,
    canManageMessages: true,
    canViewAnalytics: false,
    canManageDeals: false,
    canManageEvents: false,
    canManageStaff: false,
  },
};

// GET /api/business/[id]/staff - List staff members
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Check if user has permission to view staff
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const userStaffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    if (!isOwner && !userStaffRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const canViewStaff =
      isOwner ||
      (userStaffRole?.permissions as any)?.canManageStaff ||
      (userStaffRole?.permissions as any)?.canViewAnalytics;

    if (!canViewStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const staffRoles = await prisma.staffRole.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      staff: staffRoles.map((sr: any) => ({
        id: sr.id,
        role: sr.role,
        permissions: sr.permissions,
        acceptedAt: sr.acceptedAt,
        createdAt: sr.createdAt,
        user: sr.user,
      })),
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json(
      { error: "Failed to get staff members" },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/staff - Invite a staff member
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const body = await req.json();

    // Validate input
    const validationResult = staffRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, role, permissions } = validationResult.data;

    // Check if user has permission to add staff
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const userStaffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageStaff =
      isOwner || (userStaffRole?.permissions as any)?.canManageStaff;

    if (!canManageStaff) {
      return NextResponse.json(
        { error: "You don't have permission to manage staff" },
        { status: 403 }
      );
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a placeholder user that will be activated when they sign up
      user = await prisma.user.create({
        data: {
          email,
          role: "STAFF",
        },
      });
    }

    // Check if already a staff member
    const existingStaffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
    });

    if (existingStaffRole) {
      return NextResponse.json(
        { error: "This user is already a staff member" },
        { status: 400 }
      );
    }

    // Don't allow adding the owner as staff
    if (user.id === business.ownerId) {
      return NextResponse.json(
        { error: "The business owner cannot be added as staff" },
        { status: 400 }
      );
    }

    // Create staff role
    const finalPermissions = permissions || defaultPermissions[role];

    const staffRole = await prisma.staffRole.create({
      data: {
        businessId,
        userId: user.id,
        role,
        permissions: finalPermissions,
        invitedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Send invitation email
    try {
      const inviterName = session.user.name || "A team member";
      await sendStaffInvitationEmail(
        email,
        inviterName,
        business.name,
        role
      );
    } catch (emailError) {
      // Log but don't fail the request - invitation record was created
      console.error("Failed to send staff invitation email:", emailError);
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "StaffRole",
        entityId: staffRole.id,
        details: {
          businessId,
          invitedEmail: email,
          role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      staffRole: {
        id: staffRole.id,
        role: staffRole.role,
        permissions: staffRole.permissions,
        user: staffRole.user,
      },
      message: `Staff invitation sent to ${email}`,
    });
  } catch (error) {
    console.error("Add staff error:", error);
    return NextResponse.json(
      { error: "Failed to add staff member" },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/staff - Update staff member role/permissions
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const body = await req.json();
    const { staffRoleId, role, permissions } = body;

    if (!staffRoleId) {
      return NextResponse.json(
        { error: "Staff role ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to update staff
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const userStaffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageStaff =
      isOwner || (userStaffRole?.permissions as any)?.canManageStaff;

    if (!canManageStaff) {
      return NextResponse.json(
        { error: "You don't have permission to manage staff" },
        { status: 403 }
      );
    }

    // Update staff role
    const updatedStaffRole = await prisma.staffRole.update({
      where: { id: staffRoleId },
      data: {
        role: role || undefined,
        permissions: permissions || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "StaffRole",
        entityId: staffRoleId,
        details: { role, permissions },
      },
    });

    return NextResponse.json({
      success: true,
      staffRole: updatedStaffRole,
    });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id]/staff - Remove a staff member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const staffRoleId = searchParams.get("staffRoleId");

    if (!staffRoleId) {
      return NextResponse.json(
        { error: "Staff role ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to remove staff
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const userStaffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageStaff =
      isOwner || (userStaffRole?.permissions as any)?.canManageStaff;

    if (!canManageStaff) {
      return NextResponse.json(
        { error: "You don't have permission to manage staff" },
        { status: 403 }
      );
    }

    // Delete staff role
    await prisma.staffRole.delete({
      where: { id: staffRoleId },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "StaffRole",
        entityId: staffRoleId,
        details: { businessId },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member removed successfully",
    });
  } catch (error) {
    console.error("Remove staff error:", error);
    return NextResponse.json(
      { error: "Failed to remove staff member" },
      { status: 500 }
    );
  }
}
