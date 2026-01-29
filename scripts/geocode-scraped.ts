/**
 * Geocode Scraped Businesses
 *
 * Adds latitude/longitude coordinates to ScrapedBusiness entries that lack them.
 * Uses Nominatim (OpenStreetMap) with proper rate limiting (1 request/second).
 *
 * Usage: npx tsx scripts/geocode-scraped.ts [--limit N] [--dry-run]
 *
 * Options:
 *   --limit N   Process at most N businesses (default: 100)
 *   --dry-run   Show what would be updated without making changes
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION
// =============================================================================

// Nominatim rate limit: 1 request per second (as per OSM usage policy)
const RATE_LIMIT_MS = 1100;

// User-Agent is required by Nominatim
const USER_AGENT = "Manaakhah/1.0 (Muslim business directory - manaakhah.vercel.app)";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 */
async function geocodeWithNominatim(
  address: string,
  city: string,
  state: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state}, USA`;
    const query = encodeURIComponent(fullAddress);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      console.error(`  Nominatim error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error(`  Geocoding error:`, error);
    return null;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 && args[limitArg + 1] ? parseInt(args[limitArg + 1], 10) : 100;
  const dryRun = args.includes("--dry-run");

  console.log("=== Geocode Scraped Businesses ===\n");
  console.log(`Options:`);
  console.log(`  Limit: ${limit} businesses`);
  console.log(`  Dry run: ${dryRun ? "Yes" : "No"}`);
  console.log(`  Rate limit: ${RATE_LIMIT_MS}ms between requests\n`);

  // Find ScrapedBusiness entries without coordinates
  const toGeocode = await prisma.scrapedBusiness.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
      NOT: [
        { address: "Address not provided" },
        { address: "" },
        { city: "" },
        { city: "Unknown" },
      ],
    },
    take: limit,
    orderBy: { scrapedAt: "desc" },
  });

  console.log(`Found ${toGeocode.length} businesses to geocode\n`);

  if (toGeocode.length === 0) {
    console.log("No businesses need geocoding. Done!");
    await prisma.$disconnect();
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < toGeocode.length; i++) {
    const business = toGeocode[i];
    console.log(`[${i + 1}/${toGeocode.length}] ${business.name}`);
    console.log(`  Address: ${business.address}, ${business.city}, ${business.state}`);

    // Skip if address looks invalid
    if (!business.address || business.address.length < 5 || !business.city) {
      console.log(`  Skipping: Invalid address`);
      skipCount++;
      continue;
    }

    const coords = await geocodeWithNominatim(
      business.address,
      business.city,
      business.state
    );

    if (coords) {
      console.log(`  Found: ${coords.lat}, ${coords.lng}`);

      if (!dryRun) {
        await prisma.scrapedBusiness.update({
          where: { id: business.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        });
        console.log(`  Updated!`);
      } else {
        console.log(`  [DRY RUN] Would update`);
      }

      successCount++;
    } else {
      console.log(`  Not found`);
      failCount++;
    }

    // Rate limiting
    if (i < toGeocode.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n=== Geocoding Complete ===`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Total processed: ${successCount + failCount + skipCount}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
