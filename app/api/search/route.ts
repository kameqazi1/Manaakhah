import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search - Enhanced search with NLP-like features
export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const priceRange = searchParams.get("priceRange");
    const verified = searchParams.get("verified") === "true";
    const openNow = searchParams.get("openNow") === "true";
    const lat = parseFloat(searchParams.get("lat") || "37.5485");
    const lng = parseFloat(searchParams.get("lng") || "-121.9886");
    const radius = parseFloat(searchParams.get("radius") || "10"); // miles
    const sortBy = searchParams.get("sortBy") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Parse natural language query
    const parsedQuery = parseNaturalLanguageQuery(query);

    // Build search conditions
    const where: any = {
      status: "PUBLISHED",
    };

    // Text search
    if (parsedQuery.searchTerms.length > 0) {
      where.OR = [
        { name: { contains: parsedQuery.searchTerms.join(" "), mode: "insensitive" } },
        { description: { contains: parsedQuery.searchTerms.join(" "), mode: "insensitive" } },
        { services: { hasSome: parsedQuery.searchTerms } },
      ];
    }

    // Category filter
    if (category || parsedQuery.category) {
      where.category = category || parsedQuery.category;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: { in: tags },
        },
      };
    }

    // Apply parsed intent tags
    if (parsedQuery.tags.length > 0) {
      where.tags = {
        some: {
          tag: { in: parsedQuery.tags },
        },
      };
    }

    // Price range filter
    if (priceRange || parsedQuery.priceRange) {
      where.priceRange = priceRange || parsedQuery.priceRange;
    }

    // Verified only
    if (verified) {
      where.verificationStatus = "APPROVED";
    }

    // Location-based search with radius
    const radiusInDegrees = radius / 69; // Approximate miles to degrees

    where.latitude = {
      gte: lat - radiusInDegrees,
      lte: lat + radiusInDegrees,
    };
    where.longitude = {
      gte: lng - radiusInDegrees,
      lte: lng + radiusInDegrees,
    };

    // Build order by
    let orderBy: any = [];
    if (sortBy === "distance") {
      // Will calculate distance in post-processing
      orderBy = [{ averageRating: "desc" }];
    } else if (sortBy === "rating") {
      orderBy = [{ averageRating: "desc" }, { totalReviews: "desc" }];
    } else if (sortBy === "reviews") {
      orderBy = [{ totalReviews: "desc" }];
    } else if (sortBy === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else {
      // relevance - prioritize verified, high-rated businesses
      orderBy = [
        { verificationStatus: "asc" }, // APPROVED comes before PENDING
        { averageRating: "desc" },
        { totalReviews: "desc" },
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          photos: { take: 1 },
          tags: true,
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.business.count({ where }),
    ]);

    // Calculate distance and filter by exact radius
    const resultsWithDistance = businesses
      .map((b: any) => ({
        ...b,
        distance: calculateDistance(lat, lng, b.latitude, b.longitude),
        reviewCount: b._count.reviews,
      }))
      .filter((b: any) => b.distance <= radius);

    // Sort by distance if requested
    if (sortBy === "distance") {
      resultsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
    }

    // Check open now status
    const results = resultsWithDistance.map((b: any) => ({
      ...b,
      isOpen: openNow ? isBusinessOpen(b.hours) : undefined,
    }));

    // Track search for trending
    if (query) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.trendingSearch.upsert({
        where: {
          query_date_city: {
            query: query.toLowerCase(),
            date: today,
            city: searchParams.get("city") || "Fremont",
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          query: query.toLowerCase(),
          date: today,
          city: searchParams.get("city") || "Fremont",
          category: parsedQuery.category,
          count: 1,
        },
      });
    }

    // Save search if user is logged in and query is meaningful
    if (session?.user?.id && query.length >= 3) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return NextResponse.json({
      businesses: results,
      parsed: {
        terms: parsedQuery.searchTerms,
        intent: parsedQuery.intent,
        category: parsedQuery.category,
        tags: parsedQuery.tags,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

/**
 * Parse natural language search query
 */
function parseNaturalLanguageQuery(query: string): {
  searchTerms: string[];
  intent: string;
  category: string | null;
  tags: string[];
  priceRange: string | null;
} {
  const lowerQuery = query.toLowerCase();
  const searchTerms: string[] = [];
  let intent = "browse";
  let category: string | null = null;
  const tags: string[] = [];
  let priceRange: string | null = null;

  // Detect intent
  if (lowerQuery.includes("near me") || lowerQuery.includes("nearby")) {
    intent = "nearby";
  } else if (lowerQuery.includes("best") || lowerQuery.includes("top")) {
    intent = "best";
  } else if (lowerQuery.includes("cheap") || lowerQuery.includes("affordable") || lowerQuery.includes("budget")) {
    intent = "budget";
    priceRange = "BUDGET";
  } else if (lowerQuery.includes("halal")) {
    intent = "halal";
    tags.push("HALAL_VERIFIED");
  }

  // Detect category from query
  const categoryMappings: Record<string, string> = {
    restaurant: "RESTAURANT",
    food: "RESTAURANT",
    eat: "RESTAURANT",
    dine: "RESTAURANT",
    grocery: "GROCERY",
    market: "GROCERY",
    store: "GROCERY",
    masjid: "MASJID",
    mosque: "MASJID",
    prayer: "MASJID",
    barber: "BARBER_SALON",
    haircut: "BARBER_SALON",
    salon: "BARBER_SALON",
    mechanic: "AUTO_REPAIR",
    car: "AUTO_REPAIR",
    auto: "AUTO_REPAIR",
    lawyer: "LEGAL_SERVICES",
    legal: "LEGAL_SERVICES",
    doctor: "HEALTH_WELLNESS",
    dentist: "DENTAL",
    gym: "FITNESS",
    catering: "CATERING",
  };

  for (const [keyword, cat] of Object.entries(categoryMappings)) {
    if (lowerQuery.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Detect tags from query
  const tagMappings: Record<string, string> = {
    "muslim owned": "MUSLIM_OWNED",
    "muslim-owned": "MUSLIM_OWNED",
    "family owned": "FAMILY_OWNED",
    "family-owned": "FAMILY_OWNED",
    "sisters only": "SISTERS_FRIENDLY",
    "women only": "SISTERS_FRIENDLY",
    "brothers only": "BROTHERS_ONLY",
    "kid friendly": "KID_FRIENDLY",
    "kids": "KID_FRIENDLY",
    "family": "KID_FRIENDLY",
    "zabiha": "ZABIHA_CERTIFIED",
    "delivery": "DELIVERY",
    "parking": "PARKING_AVAILABLE",
    "wifi": "WIFI_AVAILABLE",
    "halal": "HALAL_VERIFIED",
  };

  for (const [phrase, tag] of Object.entries(tagMappings)) {
    if (lowerQuery.includes(phrase)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  // Extract meaningful search terms
  const stopWords = new Set([
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
    "near", "me", "nearby", "best", "top", "good", "find", "looking",
    "want", "need", "where", "can", "i", "get", "some",
  ]);

  const words = query.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (!stopWords.has(word) && word.length > 2) {
      searchTerms.push(word);
    }
  }

  return {
    searchTerms,
    intent,
    category,
    tags,
    priceRange,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
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

/**
 * Check if business is currently open
 */
function isBusinessOpen(hours: any): boolean {
  if (!hours) return false;

  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const todayHours = hours[day];
  if (!todayHours || todayHours.closed) return false;

  // Parse hours like "9:00 AM - 9:00 PM"
  try {
    const [openStr, closeStr] = todayHours.hours.split(" - ");
    const openTime = parseTime(openStr);
    const closeTime = parseTime(closeStr);

    return currentTime >= openTime && currentTime <= closeTime;
  } catch {
    return false;
  }
}

function parseTime(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 100 + minutes;
}

// POST /api/search - Save a search
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, query, filters, alertEnabled } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: "Name and query are required" },
        { status: 400 }
      );
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name,
        query,
        filters: filters || {},
        alertEnabled: alertEnabled || false,
      },
    });

    return NextResponse.json({ success: true, savedSearch });
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    );
  }
}
