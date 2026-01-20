import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeMuslimBusinesses } from "@/lib/scraper/scraper";
import { ScraperConfig, DataSource, BusinessCategory, BusinessTag, VerificationLevel } from "@/lib/scraper/types";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// POST /api/admin/scraper/run - Run web scraper with enhanced configuration
export async function POST(req: Request) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    // Extract configuration from request body
    const {
      searchQuery,
      keywords,
      excludeKeywords,
      city,
      state,
      zipCode,
      radius,
      categories,
      tags,
      sources,
      minConfidence,
      maxResultsPerSource,
      verificationLevel,
      onlyWithPhotos,
      onlyWithReviews,
      onlyWithWebsite,
      onlyWithPhone,
      deduplicateByName,
      deduplicateByAddress,
      deduplicateByPhone,
      similarityThreshold,
      // Legacy fields for backwards compatibility
      category,
      source,
    } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build scraper configuration
    const config: ScraperConfig = {
      searchQuery,
      keywords: keywords || [],
      excludeKeywords: excludeKeywords || [],
      city: city || "Fremont",
      state: state || "CA",
      zipCode: zipCode || "94536",
      radius: radius || 10,

      // Handle legacy 'source' field or new 'sources' array
      sources: sources || (source ? [mapLegacySource(source)] : ["google_places"]),

      // Handle legacy 'category' field or new 'categories' array
      categories: categories || (category ? [category as BusinessCategory] : undefined),

      tags: tags as BusinessTag[] | undefined,
      minConfidence: minConfidence || 0,
      maxResultsPerSource: maxResultsPerSource || 20,
      verificationLevel: verificationLevel as VerificationLevel[] | undefined,

      // Quality filters
      onlyWithPhotos: onlyWithPhotos || false,
      onlyWithReviews: onlyWithReviews || false,
      onlyWithWebsite: onlyWithWebsite || false,
      onlyWithPhone: onlyWithPhone || false,

      // Deduplication
      deduplicateByName: deduplicateByName !== false,
      deduplicateByAddress: deduplicateByAddress !== false,
      deduplicateByPhone: deduplicateByPhone !== false,
      similarityThreshold: similarityThreshold || 0.85,

      // Rate limiting
      rateLimit: 500, // 500ms between sources
      maxRetries: 2,
      timeout: 30000,
    };

    // Run scraper
    const results = await scrapeMuslimBusinesses(config);

    // Save scraped businesses to database
    const savedBusinesses = [];
    const saveErrors: string[] = [];

    for (const business of results.businesses) {
      try {
        // Check for duplicates in database
        const existingBusinesses = await db.scrapedBusiness.findMany({
          where: {
            OR: [
              { name: business.name, address: business.address },
              business.phone ? { phone: business.phone } : {},
            ].filter(obj => Object.keys(obj).length > 0),
          },
        });

        if (existingBusinesses && existingBusinesses.length > 0) {
          saveErrors.push(`Database duplicate: ${business.name} already exists`);
          continue;
        }

        const saved = await db.scrapedBusiness.create({
          data: {
            name: business.name,
            category: business.category,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zipCode,
            latitude: business.latitude || null,
            longitude: business.longitude || null,
            phone: business.phone || null,
            email: business.email || null,
            website: business.website || null,
            description: business.description || null,
            sourceUrl: business.sourceUrl,
            scrapedAt: new Date(),
            claimStatus: "PENDING_REVIEW",
            metadata: {
              source: business.source,
              sourceId: business.sourceId,
              confidence: business.confidence,
              signals: business.signals,
              tags: business.tags,
              suggestedTags: business.suggestedTags,
              verificationLevel: business.verificationLevel,
              averageRating: business.averageRating,
              totalReviews: business.totalReviews,
              services: business.services,
              cuisineTypes: business.cuisineTypes,
              priceRange: business.priceRange,
            },
          },
        });

        savedBusinesses.push({
          ...saved,
          confidence: business.confidence,
          tags: business.tags,
          source: business.source,
        });
      } catch (error) {
        saveErrors.push(`Failed to save ${business.name}: ${error}`);
      }
    }

    // Combine scraper errors with save errors
    const allErrors = [
      ...results.errors.map(e => ({ source: e.source, message: e.message })),
      ...saveErrors.map(e => ({ source: "database", message: e })),
    ];

    return NextResponse.json({
      success: results.success,
      businesses: savedBusinesses,
      errors: allErrors,
      stats: {
        totalFound: results.stats.totalFound,
        totalSaved: savedBusinesses.length,
        duplicatesSkipped: results.stats.duplicatesSkipped + (results.businesses.length - savedBusinesses.length),
        lowConfidenceSkipped: results.stats.lowConfidenceSkipped,
        averageConfidence: results.stats.averageConfidence,
        processingTime: results.stats.processingTime,
        bySource: results.stats.bySource,
        byCategory: results.stats.byCategory,
      },
    });
  } catch (error) {
    console.error("Error running scraper:", error);
    return NextResponse.json(
      { error: "Failed to run scraper" },
      { status: 500 }
    );
  }
}

/**
 * Map legacy source names to new DataSource type
 */
function mapLegacySource(source: string): DataSource {
  const mapping: Record<string, DataSource> = {
    google: "google_places",
    yelp: "yelp",
    zabihah: "zabihah",
    manual: "manual",
  };
  return mapping[source] || "google_places";
}
