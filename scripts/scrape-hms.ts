/**
 * HMS (Halal Monitoring Services) Scraper for Manaakhah
 *
 * This script uses Puppeteer to scrape HMS certified business listings
 * that use scroll-based lazy loading.
 *
 * Usage: npx tsx scripts/scrape-hms.ts
 *
 * Note: This is a standalone CLI script, not intended to run in serverless.
 */

import "dotenv/config";
import { PrismaClient, BusinessCategory } from "@prisma/client";
import puppeteer, { Browser } from "puppeteer";

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * HMS certified business listing pages
 */
const HMS_PAGES = [
  {
    url: "https://www.halalmonitoring.com/certified",
    category: "general",
    region: "National",
  },
  // Add more specific category pages if available
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique slug from business name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Parse address into components
 */
function parseAddress(fullAddress: string): {
  address: string;
  city: string;
  state: string;
  postalCode: string;
} {
  const result = {
    address: fullAddress.trim(),
    city: "",
    state: "",
    postalCode: "",
  };

  // Extract ZIP code
  const zipMatch = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    result.postalCode = zipMatch[1];
  }

  // Split by comma
  const parts = fullAddress.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    result.address = parts[0];
    result.city = parts[1];
    const stateMatch = parts[2].match(/([A-Z]{2})\s*(\d{5})?/);
    if (stateMatch) {
      result.state = stateMatch[1];
    }
  } else if (parts.length === 2) {
    result.address = parts[0];
    const cityStateMatch = parts[1].match(/^(.+?)\s+([A-Z]{2})\s*(\d{5})?/);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
      result.state = cityStateMatch[2];
    } else {
      result.city = parts[1].replace(/\d{5}(-\d{4})?/, "").trim();
    }
  }

  return result;
}

/**
 * Map category to BusinessCategory enum
 */
function mapCategory(category: string): BusinessCategory {
  const categoryMap: Record<string, BusinessCategory> = {
    restaurants: "RESTAURANT",
    restaurant: "RESTAURANT",
    butcher: "BUTCHER",
    butcheries: "BUTCHER",
    "meat shop": "BUTCHER",
    grocery: "GROCERY",
    groceries: "GROCERY",
    bakery: "BAKERY",
    bakeries: "BAKERY",
    catering: "CATERING",
    "food truck": "FOOD_TRUCK",
    market: "GROCERY",
    general: "HALAL_FOOD",
  };

  return categoryMap[category.toLowerCase()] || "HALAL_FOOD";
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// SCRAPING FUNCTIONS
// =============================================================================

/**
 * Scrape HMS certified listings using scroll-based lazy loading
 */
async function scrapeHMSPage(
  browser: Browser,
  pageConfig: { url: string; category: string; region: string }
): Promise<number> {
  console.log(`\n--- Scraping HMS: ${pageConfig.region} ---`);
  console.log(`URL: ${pageConfig.url}`);

  const page = await browser.newPage();
  let savedCount = 0;

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(pageConfig.url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for initial content
    await sleep(2000);

    // Scroll to load all lazy-loaded content
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;

    console.log("  Scrolling to load all content...");

    while (scrollAttempts < maxScrollAttempts) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await sleep(1500);

      // Check if page height increased
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        // No new content loaded, we're done
        break;
      }

      previousHeight = currentHeight;
      scrollAttempts++;
      console.log(`  Scroll ${scrollAttempts}: height = ${currentHeight}`);
    }

    console.log("  Extracting establishments...");

    // Extract establishments from the DOM
    const establishments = await page.evaluate(() => {
      const results: Array<{
        name: string;
        address: string;
        phone?: string;
        website?: string;
        description?: string;
        category: string;
      }> = [];

      // Try multiple selector patterns
      const selectors = [
        ".certified-business",
        ".business-card",
        ".listing-item",
        ".establishment",
        "table tbody tr",
        ".card",
        "[class*='listing']",
        "[class*='business']",
      ];

      for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
          items.forEach((item) => {
            // Try to find name element
            const nameEl = item.querySelector(
              "h2, h3, h4, .name, .title, .business-name, td:first-child, strong"
            );
            // Try to find address element
            const addressEl = item.querySelector(
              ".address, .location, p, td:nth-child(2), [class*='address']"
            );
            // Try to find phone
            const phoneEl = item.querySelector(
              ".phone, a[href^='tel'], td:nth-child(3), [class*='phone']"
            );
            // Try to find website
            const websiteEl = item.querySelector(
              "a[href^='http']:not([href*='tel']):not([href*='mailto'])"
            );
            // Try to find description
            const descEl = item.querySelector(
              ".description, .bio, p:not(.address)"
            );

            const name = nameEl?.textContent?.trim() || "";
            const address = addressEl?.textContent?.trim() || "";

            // Skip header rows and empty items
            if (
              name &&
              name.length > 2 &&
              !name.toLowerCase().includes("name") &&
              !name.toLowerCase().includes("establishment") &&
              !name.toLowerCase().includes("business")
            ) {
              results.push({
                name,
                address,
                phone: phoneEl?.textContent?.trim() || undefined,
                website: (websiteEl as HTMLAnchorElement)?.href || undefined,
                description: descEl?.textContent?.trim() || undefined,
                category: "general",
              });
            }
          });
          break; // Found matches, stop trying other selectors
        }
      }

      return results;
    });

    console.log(`  Found ${establishments.length} establishments`);

    // Save to database
    for (const est of establishments) {
      try {
        const parsed = parseAddress(est.address);
        const category = mapCategory(pageConfig.category);

        // Check for duplicate
        const existing = await prisma.scrapedBusiness.findFirst({
          where: {
            OR: [
              { name: { equals: est.name, mode: "insensitive" } },
              ...(est.phone ? [{ phone: est.phone }] : []),
            ],
          },
        });

        if (existing) {
          console.log(`  Skipping duplicate: ${est.name}`);
          continue;
        }

        // Also check Business table
        const existingBusiness = await prisma.business.findFirst({
          where: {
            name: { contains: est.name, mode: "insensitive" },
          },
        });

        if (existingBusiness) {
          console.log(`  Skipping (exists in Business table): ${est.name}`);
          continue;
        }

        // Save to ScrapedBusiness table
        await prisma.scrapedBusiness.create({
          data: {
            name: est.name,
            category,
            address: parsed.address || "Address not provided",
            city: parsed.city || "Unknown",
            state: parsed.state || "Unknown",
            zipCode: parsed.postalCode || "",
            phone: est.phone || null,
            website: est.website || null,
            description: est.description || `HMS certified halal establishment`,
            sourceUrl: pageConfig.url,
            claimStatus: "PENDING_REVIEW",
            scrapedAt: new Date(),
            metadata: {
              source: "hms",
              region: pageConfig.region,
              certificationBody: "HMS",
              tags: ["HALAL_VERIFIED"],
              confidence: 85,
            },
          },
        });

        savedCount++;
        console.log(`  Saved: ${est.name}`);
      } catch (error) {
        console.error(`  Error saving ${est.name}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scraping ${pageConfig.url}:`, error);
  } finally {
    await page.close();
  }

  return savedCount;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("=== HMS (Halal Monitoring Services) Scraper for Manaakhah ===\n");
  console.log("This script uses Puppeteer to scrape HMS certified listings.");
  console.log("Uses scroll-based lazy loading to get all results.");
  console.log("Data will be saved to the ScrapedBusiness table for admin review.\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalSaved = 0;

  try {
    for (const pageConfig of HMS_PAGES) {
      const saved = await scrapeHMSPage(browser, pageConfig);
      totalSaved += saved;

      // Rate limiting between pages
      await sleep(2000);
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log(`\n=== Scraping Complete ===`);
  console.log(`Total establishments saved: ${totalSaved}`);
  console.log(`Review in admin panel: /admin/businesses/review-queue`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
