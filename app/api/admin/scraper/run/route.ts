import { NextResponse } from "next/server";
import { runScraper, getImplementedSources } from "@/lib/scraper/scraper";
import type { ScraperConfig, DataSource } from "@/lib/scraper/types";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/scraper/run - Run web scraper
 *
 * Runs the specified scrapers and saves results to ScrapedBusiness table
 * for admin review.
 */
export async function POST(req: Request) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    // Extract configuration from request body
    const {
      sources,
      state,
      region,
      maxResults,
      minConfidence,
      skipGeocoding,
      skipDuplicateCheck,
      verbose,
    } = body;

    // Validate sources
    const implementedSources = getImplementedSources();
    const requestedSources: DataSource[] = sources || implementedSources;

    // Filter to only implemented sources
    const validSources = requestedSources.filter((s: DataSource) =>
      implementedSources.includes(s)
    );

    if (validSources.length === 0) {
      return NextResponse.json(
        {
          error: "No valid sources specified",
          implementedSources,
        },
        { status: 400 }
      );
    }

    // Build scraper configuration
    const config: ScraperConfig = {
      sources: validSources,
      state: state?.toUpperCase(),
      region,
      maxResults,
      minConfidence,
      skipGeocoding: skipGeocoding ?? false,
      skipDuplicateCheck: skipDuplicateCheck ?? false,
      verbose: verbose ?? false,
      rateLimit: 2000, // 2 seconds between sources
    };

    // Run scraper
    const results = await runScraper(config);

    // Aggregate stats across all sources
    let totalFound = 0;
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalGeocoded = 0;
    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const allErrors: Array<{ source: string; message: string }> = [];
    const allBusinesses: Array<{
      name: string;
      address: string;
      city: string;
      state: string;
      confidence: number;
      source: string;
    }> = [];

    for (const result of results) {
      totalFound += result.stats.found;
      totalImported += result.stats.imported;
      totalSkipped += result.stats.skipped;
      totalErrors += result.stats.errors;
      totalGeocoded += result.stats.geocoded;

      bySource[result.source] = result.stats.imported;

      // Track categories and build business list for UI
      for (const est of result.establishments) {
        const cat = est.category || "OTHER";
        byCategory[cat] = (byCategory[cat] || 0) + 1;

        allBusinesses.push({
          name: est.name,
          address: est.address,
          city: est.city,
          state: est.state,
          confidence: 70, // Default confidence
          source: result.source,
        });
      }

      for (const err of result.errors) {
        allErrors.push({ source: err.source, message: err.message });
      }
    }

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    // Calculate average confidence (default to 70 for certified sources)
    const avgConfidence = totalImported > 0 ? 70 : 0;

    return NextResponse.json({
      success: results.some((r) => r.success),
      businesses: allBusinesses,
      stats: {
        // Stats expected by the UI (scraper page)
        totalFound,
        totalSaved: totalImported,
        duplicatesSkipped: totalSkipped,
        lowConfidenceSkipped: 0,
        averageConfidence: avgConfidence,
        processingTime: totalDuration,
        bySource,
        byCategory,
        // Additional stats for other consumers
        totalImported,
        totalSkipped,
        totalErrors,
        totalGeocoded,
        duration: totalDuration,
      },
      errors: allErrors,
      message:
        totalImported > 0
          ? `Imported ${totalImported} establishments. Review in admin panel.`
          : "No new establishments found.",
    });
  } catch (error) {
    console.error("Error running scraper:", error);
    return NextResponse.json(
      {
        error: "Failed to run scraper",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/scraper/run - Get scraper status
 *
 * Returns information about implemented sources and pending review count.
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { getScraperStatus } = await import("@/lib/scraper/scraper");
    const status = await getScraperStatus();

    return NextResponse.json({
      implementedSources: status.implementedSources,
      pendingReview: status.pendingReview,
      approved: status.approved,
      rejected: status.rejected,
      lastScrapeAt: status.lastScrapeAt,
    });
  } catch (error) {
    console.error("Error getting scraper status:", error);
    return NextResponse.json(
      { error: "Failed to get scraper status" },
      { status: 500 }
    );
  }
}
