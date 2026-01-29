/**
 * Scraper Orchestrator
 *
 * Main entry point for running web scrapers. Orchestrates multiple sources,
 * handles geocoding, confidence scoring, and saving to database.
 */

import { db } from "@/lib/db";
import type {
  DataSource,
  ScraperConfig,
  ScrapedEstablishment,
  ScraperResult,
  ScraperError,
  ScraperStats,
} from "./types";
import {
  getScraperSource,
  getImplementedSources,
  isSourceImplemented,
} from "./sources";
import {
  analyzeMuslimSignals,
  calculateConfidenceScore,
} from "./signals";
import {
  geocodeAddress,
  checkForDuplicateInDatabase,
  sleep,
  mapCategory,
  generateUniqueSlug,
  createLogger,
} from "./utils";

// =============================================================================
// FILTER PRESETS
// =============================================================================

/**
 * Preset filter configurations for common use cases
 */
export const FILTER_PRESETS = [
  {
    id: "halal_restaurants",
    name: "Halal Restaurants",
    description: "Find halal-certified restaurants and eateries",
    config: {
      sources: ["hfsaa", "hms"] as DataSource[],
      minConfidence: 60,
    },
    icon: "🍽️",
  },
  {
    id: "halal_markets",
    name: "Halal Markets & Butchers",
    description: "Halal meat markets and grocery stores",
    config: {
      sources: ["hfsaa", "hms"] as DataSource[],
      minConfidence: 70,
    },
    icon: "🥩",
  },
  {
    id: "all_sources",
    name: "All Sources",
    description: "Scrape from all available certification directories",
    config: {
      sources: getImplementedSources(),
    },
    icon: "🔍",
  },
] as const;

// =============================================================================
// MAIN SCRAPER FUNCTION
// =============================================================================

/**
 * Main scraper orchestration function
 *
 * Runs specified scrapers and saves results to ScrapedBusiness table
 * for admin review.
 */
export async function runScraper(
  config: ScraperConfig
): Promise<ScraperResult[]> {
  const logger = createLogger(config.verbose);
  const results: ScraperResult[] = [];

  logger.info("Starting scraper run...");
  logger.info(`Sources: ${config.sources.join(", ")}`);

  for (const source of config.sources) {
    if (!isSourceImplemented(source)) {
      logger.warn(`Skipping unimplemented source: ${source}`);
      results.push({
        success: false,
        source,
        establishments: [],
        stats: createEmptyStats(),
        errors: [
          {
            source,
            message: `Scraper for ${source} is not yet implemented`,
            retryable: false,
          },
        ],
        duration: 0,
      });
      continue;
    }

    const startTime = Date.now();
    logger.info(`\n=== Scraping: ${source.toUpperCase()} ===`);

    try {
      // Get scraper instance
      const scraper = getScraperSource(source, config.verbose);

      // Run scraper
      const establishments = await scraper.scrape(config);
      logger.info(`Found ${establishments.length} establishments from ${source}`);

      // Process and save establishments
      const { stats, errors } = await processEstablishments(
        establishments,
        source,
        config,
        logger
      );

      results.push({
        success: true,
        source,
        establishments,
        stats,
        errors,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      logger.error(`Error scraping ${source}:`, error);

      results.push({
        success: false,
        source,
        establishments: [],
        stats: createEmptyStats(),
        errors: [
          {
            source,
            message: error instanceof Error ? error.message : String(error),
            retryable: true,
          },
        ],
        duration: Date.now() - startTime,
      });
    }

    // Rate limit between sources
    if (config.rateLimit) {
      await sleep(config.rateLimit);
    }
  }

  // Summary
  const totalFound = results.reduce((sum, r) => sum + r.stats.found, 0);
  const totalImported = results.reduce((sum, r) => sum + r.stats.imported, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  logger.info("\n=== Scraper Summary ===");
  logger.info(`Total found: ${totalFound}`);
  logger.info(`Total imported: ${totalImported}`);
  logger.info(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);

  return results;
}

// =============================================================================
// PROCESSING FUNCTIONS
// =============================================================================

/**
 * Process scraped establishments:
 * - Analyze Muslim signals for confidence scoring
 * - Geocode addresses if needed
 * - Check for duplicates
 * - Save to ScrapedBusiness table
 */
async function processEstablishments(
  establishments: ScrapedEstablishment[],
  source: DataSource,
  config: ScraperConfig,
  logger: ReturnType<typeof createLogger>
): Promise<{ stats: ScraperStats; errors: ScraperError[] }> {
  const stats: ScraperStats = createEmptyStats();
  const errors: ScraperError[] = [];

  stats.found = establishments.length;

  for (const establishment of establishments) {
    try {
      // Check for duplicates in database
      if (!config.skipDuplicateCheck) {
        const duplicateCheck = await checkForDuplicateInDatabase({
          name: establishment.name,
          address: establishment.address,
          city: establishment.city,
          state: establishment.state,
          phone: establishment.phone,
        });

        if (duplicateCheck.isDuplicate) {
          stats.skipped++;
          logger.debug(`  Skipped duplicate: ${establishment.name}`);
          continue;
        }
      }

      // Analyze Muslim signals
      const signalAnalysis = analyzeMuslimSignals(
        establishment.description || "",
        establishment.name
      );

      // Calculate confidence score
      const confidence = calculateConfidenceScore(
        signalAnalysis,
        establishment.certificationBody
      );

      // Skip low confidence if threshold set
      if (config.minConfidence && confidence < config.minConfidence) {
        stats.skipped++;
        logger.debug(`  Skipped low confidence (${confidence}): ${establishment.name}`);
        continue;
      }

      // Geocode if needed
      let latitude = establishment.latitude;
      let longitude = establishment.longitude;

      if (!config.skipGeocoding && (!latitude || !longitude)) {
        const geocodeResult = await geocodeAddress(
          establishment.address,
          establishment.city,
          establishment.state,
          establishment.postalCode
        );

        if (geocodeResult) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          stats.geocoded++;
          logger.debug(`  Geocoded: ${establishment.name}`);
        } else {
          stats.geocodeFailed++;
          logger.debug(`  Geocode failed: ${establishment.name}`);
        }

        // Rate limit geocoding (Nominatim requires 1 req/sec)
        await sleep(1100);
      }

      // Map category
      const category = mapCategory(establishment.category);

      // Save to database
      await saveToDatabase({
        establishment,
        source,
        confidence,
        signals: signalAnalysis.signals,
        latitude,
        longitude,
        category,
      });

      stats.imported++;
      logger.debug(`  Saved: ${establishment.name}`);
    } catch (error) {
      stats.errors++;
      errors.push({
        source,
        message: `Error processing "${establishment.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        retryable: false,
      });
    }
  }

  return { stats, errors };
}

/**
 * Save establishment to ScrapedBusiness table
 */
async function saveToDatabase(params: {
  establishment: ScrapedEstablishment;
  source: DataSource;
  confidence: number;
  signals: Array<{ keyword: string; weight: number; category: string; context: string }>;
  latitude?: number;
  longitude?: number;
  category: string;
}): Promise<void> {
  const { establishment, source, confidence, signals, latitude, longitude, category } = params;

  // Generate unique slug
  const slug = await generateUniqueSlug(establishment.name, async (testSlug) => {
    const existing = await db.scrapedBusiness.findFirst({
      where: { name: testSlug }, // Using name as a proxy for slug check
      select: { id: true },
    });
    return !!existing;
  });

  await db.scrapedBusiness.create({
    data: {
      name: establishment.name,
      address: establishment.address,
      city: establishment.city,
      state: establishment.state,
      zipCode: establishment.postalCode || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      phone: establishment.phone || null,
      email: establishment.email || null,
      website: establishment.website || null,
      category: category as any, // Cast to BusinessCategory enum
      description: establishment.description || null,
      sourceUrl: establishment.sourceUrl,
      claimStatus: "PENDING_REVIEW",
      metadata: {
        source,
        confidence,
        signals,
        certificationBody: establishment.certificationBody || null,
        certificationExpiry: establishment.certificationExpiry || null,
        region: establishment.region || null,
        originalCategory: establishment.category,
      },
    },
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create empty stats object
 */
function createEmptyStats(): ScraperStats {
  return {
    found: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    geocoded: 0,
    geocodeFailed: 0,
  };
}

/**
 * Run a quick scrape for a single source (for testing/debugging)
 */
export async function quickScrape(
  source: DataSource,
  options: {
    region?: string;
    state?: string;
    maxResults?: number;
    verbose?: boolean;
  } = {}
): Promise<ScrapedEstablishment[]> {
  if (!isSourceImplemented(source)) {
    throw new Error(`Scraper for ${source} is not yet implemented`);
  }

  const scraper = getScraperSource(source, options.verbose);

  return scraper.scrape({
    sources: [source],
    region: options.region,
    state: options.state,
    maxResults: options.maxResults,
    verbose: options.verbose,
  });
}

/**
 * Save scraped establishments to database
 *
 * Used by standalone CLI scripts to save results to ScrapedBusiness table.
 */
export async function saveScrapedEstablishments(
  establishments: ScrapedEstablishment[],
  source: DataSource,
  options: {
    skipGeocoding?: boolean;
    skipDuplicateCheck?: boolean;
    minConfidence?: number;
    verbose?: boolean;
  } = {}
): Promise<{ imported: number; skipped: number; errors: number }> {
  const logger = createLogger(options.verbose);
  const config: ScraperConfig = {
    sources: [source],
    skipGeocoding: options.skipGeocoding,
    skipDuplicateCheck: options.skipDuplicateCheck,
    minConfidence: options.minConfidence,
  };

  const { stats } = await processEstablishments(
    establishments,
    source,
    config,
    logger
  );

  return {
    imported: stats.imported,
    skipped: stats.skipped,
    errors: stats.errors,
  };
}

/**
 * Get scraper status and statistics
 */
export async function getScraperStatus(): Promise<{
  implementedSources: DataSource[];
  pendingReview: number;
  approved: number;
  rejected: number;
  lastScrapeAt: Date | null;
}> {
  const [pendingCount, approvedCount, rejectedCount, lastScraped] = await Promise.all([
    db.scrapedBusiness.count({
      where: { claimStatus: "PENDING_REVIEW" },
    }),
    db.scrapedBusiness.count({
      where: { claimStatus: "APPROVED" },
    }),
    db.scrapedBusiness.count({
      where: { claimStatus: "REJECTED" },
    }),
    db.scrapedBusiness.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    }),
  ]);

  return {
    implementedSources: getImplementedSources(),
    pendingReview: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    lastScrapeAt: lastScraped?.scrapedAt || null,
  };
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export {
  getScraperSource,
  getImplementedSources,
  isSourceImplemented,
  scrapeSource,
  getSourceMetadata,
} from "./sources";

export {
  analyzeMuslimSignals,
  calculateConfidenceScore,
  getBaseConfidenceForCertification,
} from "./signals";

export {
  geocodeAddress,
  normalizePhone,
  normalizeWebsite,
  parseAddress,
  slugify,
  generateUniqueSlug,
  mapCategory,
} from "./utils";

export {
  importFromCSV,
  importFromJSON,
  parseCSV,
  validateCSVData,
} from "./import";
export type { CSVImportRow, JSONImportData } from "./import";
