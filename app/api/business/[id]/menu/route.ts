import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const menuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional().nullable(),
  image: z.string().url().optional().nullable(),
  isHalal: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spiceLevel: z.number().int().min(0).max(5).optional().nullable(),
  calories: z.number().int().min(0).optional().nullable(),
  allergens: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// GET /api/business/[id]/menu - Get business menu
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    const menuCategories = await prisma.menuCategory.findMany({
      where: { businessId },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ menu: menuCategories });
  } catch (error) {
    console.error("Get menu error:", error);
    return NextResponse.json(
      { error: "Failed to get menu" },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/menu - Create menu category or item
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

    // Check if user has permission
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

    const canEdit = isOwner || (staffRole?.permissions as any)?.canEditBusiness;

    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body; // "category" or "item"

    if (type === "category") {
      const validationResult = menuCategorySchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      // Get the next order number
      const lastCategory = await prisma.menuCategory.findFirst({
        where: { businessId },
        orderBy: { order: "desc" },
      });

      const category = await prisma.menuCategory.create({
        data: {
          businessId,
          name: validationResult.data.name,
          description: validationResult.data.description,
          order: validationResult.data.order ?? (lastCategory?.order ?? 0) + 1,
          isActive: validationResult.data.isActive ?? true,
        },
        include: { items: true },
      });

      return NextResponse.json({ success: true, category });
    } else if (type === "item") {
      const validationResult = menuItemSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      // Verify category belongs to this business
      const category = await prisma.menuCategory.findFirst({
        where: {
          id: validationResult.data.categoryId,
          businessId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // Get the next order number
      const lastItem = await prisma.menuItem.findFirst({
        where: { categoryId: validationResult.data.categoryId },
        orderBy: { order: "desc" },
      });

      const item = await prisma.menuItem.create({
        data: {
          categoryId: validationResult.data.categoryId,
          name: validationResult.data.name,
          description: validationResult.data.description,
          price: validationResult.data.price,
          salePrice: validationResult.data.salePrice,
          image: validationResult.data.image,
          isHalal: validationResult.data.isHalal ?? true,
          isVegetarian: validationResult.data.isVegetarian ?? false,
          isVegan: validationResult.data.isVegan ?? false,
          isGlutenFree: validationResult.data.isGlutenFree ?? false,
          spiceLevel: validationResult.data.spiceLevel,
          calories: validationResult.data.calories,
          allergens: validationResult.data.allergens ?? [],
          isAvailable: validationResult.data.isAvailable ?? true,
          order: validationResult.data.order ?? (lastItem?.order ?? 0) + 1,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json(
      { error: "Type must be 'category' or 'item'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/menu - Update menu category or item
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

    // Check permission
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

    const canEdit = isOwner || (staffRole?.permissions as any)?.canEditBusiness;

    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "category") {
      const category = await prisma.menuCategory.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          order: data.order,
          isActive: data.isActive,
        },
        include: { items: true },
      });

      return NextResponse.json({ success: true, category });
    } else if (type === "item") {
      const item = await prisma.menuItem.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice,
          image: data.image,
          isHalal: data.isHalal,
          isVegetarian: data.isVegetarian,
          isVegan: data.isVegan,
          isGlutenFree: data.isGlutenFree,
          spiceLevel: data.spiceLevel,
          calories: data.calories,
          allergens: data.allergens,
          isAvailable: data.isAvailable,
          order: data.order,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json(
      { error: "Type must be 'category' or 'item'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update menu error:", error);
    return NextResponse.json(
      { error: "Failed to update menu" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id]/menu - Delete menu category or item
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

    // Check permission
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

    const canEdit = isOwner || (staffRole?.permissions as any)?.canEditBusiness;

    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    if (type === "category") {
      // This will also delete all items in the category due to cascade
      await prisma.menuCategory.delete({
        where: { id },
      });
    } else if (type === "item") {
      await prisma.menuItem.delete({
        where: { id },
      });
    } else {
      return NextResponse.json(
        { error: "Type must be 'category' or 'item'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
