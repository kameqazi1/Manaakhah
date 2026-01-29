#!/usr/bin/env npx tsx
/**
 * Zabihah.com Scraper Script
 *
 * Standalone script to scrape halal restaurants from Zabihah.com
 *
 * Usage:
 *   npx tsx scripts/scrape-zabihah.ts [options]
 *
 * Options:
 *   --region=NAME    Filter by city name (e.g., --region="New York")
 *   --state=XX       Filter by state (e.g., --state=NY)
 *   --max-results=N  Limit results per city
 *   --dry-run        Don't save to database, just show what would be scraped
 *   --verbose        Enable verbose logging
 *
 * Examples:
 *   npx tsx scripts/scrape-zabihah.ts --region="New York" --dry-run --verbose
 *   npx tsx scripts/scrape-zabihah.ts --state=CA --max-results=10
 */

import "dotenv/config";
import { createZabihahScraper } from "../lib/scraper/sources/zabihah";
import type { ScraperConfig } from "../lib/scraper/types";

// Parse command line arguments
function parseArgs(): ScraperConfig & { dryRun: boolean } {
  const args = process.argv.slice(2);
  const config: ScraperConfig & { dryRun: boolean } = {
    sources: ["zabihah"],
    dryRun: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--region=")) {
      config.region = arg.replace("--region=", "");
    } else if (arg.startsWith("--state=")) {
      config.state = arg.replace("--state=", "").toUpperCase();
    } else if (arg.startsWith("--max-results=")) {
      config.maxResults = parseInt(arg.replace("--max-results=", ""), 10);
    } else if (arg === "--dry-run") {
      config.dryRun = true;
    } else if (arg === "--verbose") {
      config.verbose = true;
    }
  }

  return config;
}

async function main() {
  console.log("=== Zabihah.com Scraper ===\n");
  console.log("This script uses Puppeteer to scrape Zabihah.com listings.");
  console.log("Uses geolocation spoofing to browse different US cities.");
  console.log("Data will be saved to the ScrapedBusiness table for admin review.\n");

  const config = parseArgs();

  if (config.region) {
    console.log(`City filter: ${config.region}`);
  }
  if (config.state) {
    console.log(`State filter: ${config.state}`);
  }
  if (config.maxResults) {
    console.log(`Max results per city: ${config.maxResults}`);
  }
  console.log(`Mode: ${config.dryRun ? "DRY RUN" : "LIVE"}\n`);

  if (config.dryRun) {
    console.log("\n=== DRY RUN MODE ===");
    console.log("Not saving to database, just showing what would be scraped.\n");
  }

  // Create scraper and run
  const scraper = createZabihahScraper(config.verbose);

  try {
    const establishments = await scraper.scrape(config);

    console.log(`\nFound ${establishments.length} establishments:\n`);

    for (const est of establishments) {
      console.log(`${est.name}`);
      console.log(`  Address: ${est.address}`);
      console.log(`  City: ${est.city}, ${est.state}`);
      if (est.region) console.log(`  Region: ${est.region}`);
      if (est.phone) console.log(`  Phone: ${est.phone}`);
      if (est.website) console.log(`  Website: ${est.website}`);
      if (est.description) console.log(`  Description: ${est.description.substring(0, 100)}...`);
      console.log();
    }

    if (!config.dryRun && establishments.length > 0) {
      console.log("Saving to database...");
      // Import the save function
      const { saveScrapedEstablishments } = await import(
        "../lib/scraper/scraper"
      );
      const result = await saveScrapedEstablishments(establishments, "zabihah");
      console.log(`Saved ${result.imported} establishments.`);
      console.log(`Skipped ${result.skipped} duplicates.`);
      if (result.errors > 0) {
        console.log(`Encountered ${result.errors} errors.`);
      }
    }
  } catch (error) {
    console.error("Error running scraper:", error);
    process.exit(1);
  }
}

main().catch(console.error);
