import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// DELETE /api/spending/[id] - Delete a spending entry
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if entry exists and belongs to user
    const entry = await db.spendingEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Spending entry not found" },
        { status: 404 }
      );
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this entry" },
        { status: 403 }
      );
    }

    // Delete the entry
    await db.spendingEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Spending entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting spending entry:", error);
    return NextResponse.json(
      { error: "Failed to delete spending entry" },
      { status: 500 }
    );
  }
}

// PUT /api/spending/[id] - Update a spending entry
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, description, date } = body;

    // Check if entry exists and belongs to user
    const entry = await db.spendingEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Spending entry not found" },
        { status: 404 }
      );
    }

    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this entry" },
        { status: 403 }
      );
    }

    // Update data
    const updateData: any = {};
    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: "Amount must be greater than 0" },
          { status: 400 }
        );
      }
      updateData.amount = parseFloat(amount);
    }
    if (description !== undefined) updateData.description = description || null;
    if (date !== undefined) updateData.date = new Date(date);

    // Update the entry
    const updatedEntry = await db.spendingEntry.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            coverImage: true,
          },
        },
      },
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error("Error updating spending entry:", error);
    return NextResponse.json(
      { error: "Failed to update spending entry" },
      { status: 500 }
    );
  }
}
