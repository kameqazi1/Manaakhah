import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { getMockSession } from "@/lib/mock-auth";
import { z } from "zod";

const createBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "HALAL_FOOD",
    "RESTAURANT",
    "GROCERY",
    "MASJID",
    "AUTO_REPAIR",
    "PLUMBING",
    "ELECTRICAL",
    "HANDYMAN",
    "TUTORING",
    "LEGAL_SERVICES",
    "ACCOUNTING",
    "HEALTH_WELLNESS",
    "BARBER_SALON",
    "CHILDCARE",
    "COMMUNITY_AID",
    "OTHER",
  ]),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().default("CA"),
  zipCode: z.string().min(5, "Zip code is required"),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  services: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  hours: z.record(z.string(), z.any()).optional(),
  prayerTimes: z.record(z.string(), z.any()).optional(),
  jummahTime: z.string().optional(),
  aidServices: z.array(z.string()).default([]),
  externalUrl: z.string().url().optional().or(z.literal("")),
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/businesses - List all businesses with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags")?.split(",") || [];
    const status = searchParams.get("status") || "PUBLISHED";

    // Location-based filtering
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");

    // Bounds-based filtering (for map viewport queries)
    const ne_lat = searchParams.get("ne_lat");
    const ne_lng = searchParams.get("ne_lng");
    const sw_lat = searchParams.get("sw_lat");
    const sw_lng = searchParams.get("sw_lng");

    const where: any = {
      status: status as any,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            in: tags,
          },
        },
      };
    }

    // Bounds-based filtering (takes precedence over radius if all 4 params present)
    if (ne_lat && ne_lng && sw_lat && sw_lng) {
      where.latitude = {
        gte: parseFloat(sw_lat),
        lte: parseFloat(ne_lat),
      };
      where.longitude = {
        gte: parseFloat(sw_lng),
        lte: parseFloat(ne_lng),
      };
    }

    const businesses = await db.business.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: {
          orderBy: { order: "asc" },
          take: 1,
        },
        tags: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Calculate average rating and distance for each business
    let businessesWithRating = businesses.map((business: any) => {
      const avgRating =
        business.reviews.length > 0
          ? business.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            business.reviews.length
          : 0;

      const businessData: any = {
        ...business,
        averageRating: avgRating,
        reviewCount: business.reviews.length,
      };

      // Add distance if location params provided
      if (lat && lng && business.latitude && business.longitude) {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          business.latitude,
          business.longitude
        );
        businessData.distance = distance;
      }

      return businessData;
    });

    // Filter by radius if provided (skip if bounds filtering was used)
    if (lat && lng && radius && !(ne_lat && ne_lng && sw_lat && sw_lng)) {
      const maxRadius = parseFloat(radius);
      businessesWithRating = businessesWithRating.filter(
        (b: any) => !b.distance || b.distance <= maxRadius
      );
    }

    // Sort by distance if location provided
    if (lat && lng) {
      businessesWithRating.sort((a: any, b: any) => {
        const distA = a.distance || Infinity;
        const distB = b.distance || Infinity;
        return distA - distB;
      });
    }

    return NextResponse.json(businessesWithRating);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create new business
export async function POST(req: Request) {
  try {
    // Get session based on mode
    let session: any = null;

    if (isMockMode()) {
      // In mock mode, check localStorage session (server-side won't have it)
      // We'll get userId from request headers instead
      const userId = req.headers.get("x-user-id");
      const userRole = req.headers.get("x-user-role");

      if (!userId || !userRole) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      session = {
        user: {
          id: userId,
          role: userRole,
        },
      };
    } else {
      // Real mode would use NextAuth here
      return NextResponse.json(
        { error: "Real mode authentication not yet configured" },
        { status: 501 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "BUSINESS_OWNER" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Only business owners can create listings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createBusinessSchema.parse(body);

    // Generate slug from business name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    let uniqueSlug = slug;
    let counter = 1;
    while (await db.business.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const business = await db.business.create({
      data: {
        ownerId: session.user.id,
        name: validatedData.name,
        slug: uniqueSlug,
        description: validatedData.description,
        category: validatedData.category,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        phone: validatedData.phone,
        email: validatedData.email || null,
        website: validatedData.website || null,
        serviceList: validatedData.services,
        hours: validatedData.hours || null,
        prayerTimes: validatedData.prayerTimes || null,
        jummahTime: validatedData.jummahTime || null,
        aidServices: validatedData.aidServices,
        externalUrl: validatedData.externalUrl || null,
        status: "PENDING_REVIEW",
      },
    });

    // Create tags (only in real mode with Prisma)
    if (!isMockMode() && validatedData.tags.length > 0) {
      // This would need businessTagRelation model
      // Skipping for mock mode as tags are stored directly in business
    }

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
