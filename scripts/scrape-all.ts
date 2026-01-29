#!/usr/bin/env npx tsx
/**
 * Scrape All Sources
 *
 * Runs all implemented scrapers and saves results to ScrapedBusiness table.
 *
 * Usage:
 *   npx tsx scripts/scrape-all.ts
 *   npx tsx scripts/scrape-all.ts --sources=hfsaa,hms
 *   npx tsx scripts/scrape-all.ts --state=CA --verbose
 *   npx tsx scripts/scrape-all.ts --dry-run
 *
 * Options:
 *   --sources=<list>    Comma-separated list of sources (default: all implemented)
 *   --state=<code>      Filter by state (2-letter abbreviation)
 *   --region=<name>     Filter by region name
 *   --max=<number>      Max results per source
 *   --dry-run           Don't save to database, just show what would be scraped
 *   --verbose           Show detailed output
 *   --skip-geocoding    Skip geocoding addresses
 *   --help              Show this help message
 */

import "dotenv/config";
import {
  runScraper,
  getImplementedSources,
  getScraperSource,
} from "../lib/scraper/scraper";
import type { DataSource, ScraperConfig } from "../lib/scraper/types";

// =============================================================================
// CLI PARSING
// =============================================================================

function parseArgs(): {
  sources: DataSource[];
  state?: string;
  region?: string;
  maxResults?: number;
  dryRun: boolean;
  verbose: boolean;
  skipGeocoding: boolean;
  showHelp: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    sources: [] as DataSource[],
    state: undefined as string | undefined,
    region: undefined as string | undefined,
    maxResults: undefined as number | undefined,
    dryRun: false,
    verbose: false,
    skipGeocoding: false,
    showHelp: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      result.showHelp = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      result.verbose = true;
    } else if (arg === "--skip-geocoding") {
      result.skipGeocoding = true;
    } else if (arg.startsWith("--sources=")) {
      const sourcesStr = arg.split("=")[1];
      result.sources = sourcesStr.split(",").map((s) => s.trim() as DataSource);
    } else if (arg.startsWith("--state=")) {
      result.state = arg.split("=")[1].toUpperCase();
    } else if (arg.startsWith("--region=")) {
      result.region = arg.split("=")[1];
    } else if (arg.startsWith("--max=")) {
      result.maxResults = parseInt(arg.split("=")[1], 10);
    }
  }

  // Default to all implemented sources if none specified
  if (result.sources.length === 0) {
    result.sources = getImplementedSources();
  }

  return result;
}

function showHelp(): void {
  console.log(`
Scrape All Sources

Runs all implemented scrapers and saves results to ScrapedBusiness table.

Usage:
  npx tsx scripts/scrape-all.ts [options]

Options:
  --sources=<list>    Comma-separated list of sources (default: all implemented)
  --state=<code>      Filter by state (2-letter abbreviation)
  --region=<name>     Filter by region name
  --max=<number>      Max results per source
  --dry-run           Don't save to database, just show what would be scraped
  --verbose           Show detailed output
  --skip-geocoding    Skip geocoding addresses
  --help              Show this help message

Examples:
  npx tsx scripts/scrape-all.ts
  npx tsx scripts/scrape-all.ts --sources=hfsaa,hms
  npx tsx scripts/scrape-all.ts --state=CA --verbose
  npx tsx scripts/scrape-all.ts --dry-run --region="Bay Area"

Implemented Sources:
${getImplementedSources().map((s) => `  - ${s}`).join("\n")}
`);
}

// =============================================================================
// DRY RUN
// =============================================================================

async function dryRun(config: ScraperConfig): Promise<void> {
  console.log("\n=== DRY RUN MODE ===");
  console.log("Not saving to database, just showing what would be scraped.\n");

  for (const source of config.sources) {
    console.log(`\n--- Source: ${source.toUpperCase()} ---`);

    try {
      const scraper = getScraperSource(source, config.verbose);
      const establishments = await scraper.scrape(config);

      console.log(`Found ${establishments.length} establishments:\n`);

      for (const est of establishments.slice(0, 10)) {
        console.log(`  ${est.name}`);
        console.log(`    Address: ${est.address}, ${est.city}, ${est.state}`);
        if (est.phone) console.log(`    Phone: ${est.phone}`);
        if (est.website) console.log(`    Website: ${est.website}`);
        console.log();
      }

      if (establishments.length > 10) {
        console.log(`  ... and ${establishments.length - 10} more\n`);
      }
    } catch (error) {
      console.error(`Error scraping ${source}:`, error instanceof Error ? error.message : error);
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.showHelp) {
    showHelp();
    process.exit(0);
  }

  console.log("=== Manaakhah Multi-Source Scraper ===\n");
  console.log(`Sources: ${args.sources.join(", ")}`);
  if (args.state) console.log(`State filter: ${args.state}`);
  if (args.region) console.log(`Region filter: ${args.region}`);
  if (args.maxResults) console.log(`Max results: ${args.maxResults}`);
  if (args.dryRun) console.log("Mode: DRY RUN");
  console.log();

  const config: ScraperConfig = {
    sources: args.sources,
    state: args.state,
    region: args.region,
    maxResults: args.maxResults,
    verbose: args.verbose,
    skipGeocoding: args.skipGeocoding,
    rateLimit: 2000,
  };

  if (args.dryRun) {
    await dryRun(config);
    return;
  }

  // Run full scraper
  const results = await runScraper(config);

  // Summary
  console.log("\n=== Final Summary ===");

  let totalFound = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`\n${result.source.toUpperCase()}:`);
    console.log(`  Found: ${result.stats.found}`);
    console.log(`  Imported: ${result.stats.imported}`);
    console.log(`  Skipped: ${result.stats.skipped}`);
    console.log(`  Errors: ${result.stats.errors}`);
    console.log(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);

    totalFound += result.stats.found;
    totalImported += result.stats.imported;
    totalSkipped += result.stats.skipped;
    totalErrors += result.stats.errors;

    if (result.errors.length > 0) {
      console.log("  Error details:");
      for (const err of result.errors.slice(0, 5)) {
        console.log(`    - ${err.message}`);
      }
      if (result.errors.length > 5) {
        console.log(`    ... and ${result.errors.length - 5} more errors`);
      }
    }
  }

  console.log("\n--- Totals ---");
  console.log(`Total found: ${totalFound}`);
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`\nReview in admin panel: /admin/businesses/review-queue`);
}

main().catch((error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});
