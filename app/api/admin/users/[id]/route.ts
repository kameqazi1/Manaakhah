import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// Helper to check admin authorization
function checkAdminAuth(req: Request): boolean {
  if (isMockMode()) {
    const userRole = req.headers.get("x-user-role");
    return userRole === "ADMIN";
  }
  return false;
}

// GET /api/admin/users/:id - Get single user with details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's businesses
    const businesses = await db.business.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    // Get user's reviews
    const reviews = await db.review.findMany({
      where: { userId },
      select: {
        id: true,
        rating: true,
        status: true,
        businessId: true,
      },
    });

    return NextResponse.json({
      ...user,
      businesses,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/:id - Update user
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Allowed fields for admin to update
    const allowedFields = ["name", "email", "phone", "role"];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/:id - Delete user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Check if this is an admin user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // Delete user's reviews first
    await db.review.deleteMany({
      where: { userId },
    });

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
