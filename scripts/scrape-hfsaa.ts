#!/usr/bin/env npx tsx
/**
 * HFSAA Scraper Script
 *
 * Standalone script to scrape HFSAA (Halal Food Standards Alliance of America)
 * certified business listings.
 *
 * Usage:
 *   npx tsx scripts/scrape-hfsaa.ts
 *   npx tsx scripts/scrape-hfsaa.ts --region="Bay Area"
 *   npx tsx scripts/scrape-hfsaa.ts --state=CA --verbose
 *   npx tsx scripts/scrape-hfsaa.ts --dry-run
 *
 * Options:
 *   --region=<name>     Filter by region (e.g., "Bay Area", "Chicago")
 *   --state=<code>      Filter by state (2-letter abbreviation)
 *   --max=<number>      Max results
 *   --dry-run           Don't save to database, just show results
 *   --verbose           Show detailed output
 *   --skip-geocoding    Skip geocoding addresses
 *   --help              Show help
 */

import "dotenv/config";
import { runScraper, getScraperSource } from "../lib/scraper/scraper";
import type { ScraperConfig } from "../lib/scraper/types";

// =============================================================================
// CLI PARSING
// =============================================================================

function parseArgs(): {
  region?: string;
  state?: string;
  maxResults?: number;
  dryRun: boolean;
  verbose: boolean;
  skipGeocoding: boolean;
  showHelp: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    region: undefined as string | undefined,
    state: undefined as string | undefined,
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
    } else if (arg.startsWith("--region=")) {
      result.region = arg.split("=")[1];
    } else if (arg.startsWith("--state=")) {
      result.state = arg.split("=")[1].toUpperCase();
    } else if (arg.startsWith("--max=")) {
      result.maxResults = parseInt(arg.split("=")[1], 10);
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
HFSAA Scraper Script

Scrapes HFSAA certified business listings using Puppeteer.

Usage:
  npx tsx scripts/scrape-hfsaa.ts [options]

Options:
  --region=<name>     Filter by region (e.g., "Bay Area", "Chicago")
  --state=<code>      Filter by state (2-letter abbreviation)
  --max=<number>      Max results
  --dry-run           Don't save to database, just show results
  --verbose           Show detailed output
  --skip-geocoding    Skip geocoding addresses
  --help              Show this help message

Available Regions:
  - Bay Area (CA)
  - Southern California (CA)
  - Chicago (IL)
  - Houston (TX)
  - Dallas/Fort Worth (TX)
  - Atlanta (GA)
  - New York Metro (NY)
  - New Jersey (NJ)
  - Michigan (MI)
  - Ohio (OH)
  - Virginia/DC (VA)
  - Pennsylvania (PA)
  - Florida (FL)
  - North Carolina (NC)
  - Tennessee (TN)
  - Arizona (AZ)

Examples:
  npx tsx scripts/scrape-hfsaa.ts                    # Scrape all regions
  npx tsx scripts/scrape-hfsaa.ts --region="Bay Area"
  npx tsx scripts/scrape-hfsaa.ts --state=CA --verbose
  npx tsx scripts/scrape-hfsaa.ts --dry-run --max=10
`);
}

// =============================================================================
// DRY RUN
// =============================================================================

async function dryRun(config: ScraperConfig): Promise<void> {
  console.log("\n=== DRY RUN MODE ===");
  console.log("Not saving to database, just showing what would be scraped.\n");

  const scraper = getScraperSource("hfsaa", config.verbose);
  const establishments = await scraper.scrape(config);

  console.log(`\nFound ${establishments.length} establishments:\n`);

  for (const est of establishments) {
    console.log(`${est.name}`);
    console.log(`  Address: ${est.address}`);
    console.log(`  City: ${est.city}, ${est.state}`);
    console.log(`  Region: ${est.region || "N/A"}`);
    if (est.phone) console.log(`  Phone: ${est.phone}`);
    if (est.website) console.log(`  Website: ${est.website}`);
    console.log();
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

  console.log("=== HFSAA (Halal Food Standards Alliance of America) Scraper ===\n");
  console.log("This script uses Puppeteer to scrape HFSAA certified listings.");
  console.log("Data will be saved to the ScrapedBusiness table for admin review.\n");

  if (args.region) console.log(`Region filter: ${args.region}`);
  if (args.state) console.log(`State filter: ${args.state}`);
  if (args.maxResults) console.log(`Max results: ${args.maxResults}`);
  if (args.dryRun) console.log("Mode: DRY RUN");
  console.log();

  const config: ScraperConfig = {
    sources: ["hfsaa"],
    region: args.region,
    state: args.state,
    maxResults: args.maxResults,
    verbose: args.verbose,
    skipGeocoding: args.skipGeocoding,
    rateLimit: 2000,
  };

  if (args.dryRun) {
    await dryRun(config);
    return;
  }

  // Run scraper
  const results = await runScraper(config);

  // Summary
  const result = results[0];
  if (result) {
    console.log("\n=== Scraping Complete ===");
    console.log(`Found: ${result.stats.found}`);
    console.log(`Imported: ${result.stats.imported}`);
    console.log(`Skipped: ${result.stats.skipped}`);
    console.log(`Errors: ${result.stats.errors}`);
    console.log(`Geocoded: ${result.stats.geocoded}`);
    console.log(`Geocode failed: ${result.stats.geocodeFailed}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);

    if (result.errors.length > 0) {
      console.log("\nError details:");
      for (const err of result.errors) {
        console.log(`  - ${err.message}`);
      }
    }

    console.log(`\nReview in admin panel: /admin/businesses/review-queue`);
  }
}

main().catch((error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});
