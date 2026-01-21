import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/businesses/[id]/services - Get services for a business
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";

    const services = await db.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

// POST /api/businesses/[id]/services - Create a new service
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, priceType, duration, category, isFeatured, sortOrder } = body;

    // Validation
    if (!name || price === undefined || !duration) {
      return NextResponse.json(
        { error: "name, price, and duration are required" },
        { status: 400 }
      );
    }

    if (duration < 1 || duration > 480) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 480 minutes" },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: "Price cannot be negative" },
        { status: 400 }
      );
    }

    const service = await db.service.create({
      data: {
        businessId,
        name,
        description: description || null,
        price: parseFloat(price),
        priceType: priceType || "fixed",
        duration: parseInt(duration),
        category: category || null,
        isFeatured: isFeatured || false,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

// PUT /api/businesses/[id]/services - Update a service (serviceId in body)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { serviceId, name, description, price, priceType, duration, category, isFeatured, isActive, sortOrder } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    // Verify service belongs to this business
    const existingService = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService || existingService.businessId !== businessId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const service = await db.service.update({
      where: { id: serviceId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceType !== undefined && { priceType }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(category !== undefined && { category }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/businesses/[id]/services - Delete a service (serviceId in query)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId query param is required" }, { status: 400 });
    }

    // Verify user owns this business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify service belongs to this business
    const existingService = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService || existingService.businessId !== businessId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await db.service.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
