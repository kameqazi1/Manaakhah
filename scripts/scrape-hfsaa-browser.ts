/**
 * HFSAA Browser-Based Scraper for Manaakhah
 *
 * This script uses Puppeteer to scrape HFSAA pages with Elfsight widgets
 * that require JavaScript execution.
 *
 * Usage: npx tsx scripts/scrape-hfsaa-browser.ts
 *
 * Note: This is a standalone CLI script, not intended to run in serverless.
 */

import "dotenv/config";
import { PrismaClient, BusinessCategory } from "@prisma/client";
import puppeteer, { Browser, Page } from "puppeteer";

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION
// =============================================================================

interface RegionalChapter {
  region: string;
  url: string;
  defaultState: string;
  defaultCity: string;
}

/**
 * HFSAA Regional Chapter URLs with Elfsight widgets
 */
const REGIONAL_CHAPTERS: RegionalChapter[] = [
  // Midwest
  { region: "Chicago", url: "https://www.hfsaa.org/chicago", defaultState: "IL", defaultCity: "Chicago" },
  { region: "Detroit", url: "https://www.hfsaa.org/detroit", defaultState: "MI", defaultCity: "Detroit" },
  { region: "Indianapolis", url: "https://www.hfsaa.org/indianapolis", defaultState: "IN", defaultCity: "Indianapolis" },
  { region: "Columbus", url: "https://www.hfsaa.org/columbus", defaultState: "OH", defaultCity: "Columbus" },
  // Northeast
  { region: "New York", url: "https://www.hfsaa.org/newyork", defaultState: "NY", defaultCity: "New York" },
  { region: "New Jersey", url: "https://www.hfsaa.org/newjersey", defaultState: "NJ", defaultCity: "Newark" },
  { region: "Pennsylvania", url: "https://www.hfsaa.org/pennsylvania", defaultState: "PA", defaultCity: "Philadelphia" },
  // West
  { region: "Bay Area", url: "https://www.hfsaa.org/bayarea", defaultState: "CA", defaultCity: "Fremont" },
  { region: "Los Angeles", url: "https://www.hfsaa.org/losangeles", defaultState: "CA", defaultCity: "Los Angeles" },
  { region: "Seattle", url: "https://www.hfsaa.org/seattle", defaultState: "WA", defaultCity: "Seattle" },
  // Southeast
  { region: "Atlanta", url: "https://www.hfsaa.org/atlanta", defaultState: "GA", defaultCity: "Atlanta" },
  { region: "Florida", url: "https://www.hfsaa.org/florida", defaultState: "FL", defaultCity: "Miami" },
  // South
  { region: "Texas", url: "https://www.hfsaa.org/texas", defaultState: "TX", defaultCity: "Houston" },
  { region: "Dallas", url: "https://www.hfsaa.org/dallas", defaultState: "TX", defaultCity: "Dallas" },
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
function parseAddress(
  fullAddress: string,
  defaults: { state: string; city: string }
): { address: string; city: string; state: string; postalCode: string } {
  const result = {
    address: fullAddress.trim(),
    city: defaults.city,
    state: defaults.state,
    postalCode: "",
  };

  // Extract ZIP code
  const zipMatch = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    result.postalCode = zipMatch[1];
  }

  // Split by comma
  const parts = fullAddress.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    result.address = parts[0];
    result.city = parts[1].replace(/\d{5}(-\d{4})?/, "").trim();

    if (parts.length >= 3) {
      const stateMatch = parts[2].match(/([A-Z]{2})\s*\d{5}/) || parts[2].match(/^([A-Z]{2})$/);
      if (stateMatch) {
        result.state = stateMatch[1];
      }
    }
  }

  return result;
}

/**
 * Map category string to BusinessCategory enum
 */
function mapCategory(category: string): BusinessCategory {
  const categoryMap: Record<string, BusinessCategory> = {
    restaurants: "RESTAURANT",
    restaurant: "RESTAURANT",
    butcheries: "BUTCHER",
    butcher: "BUTCHER",
    grocery: "GROCERY",
    groceries: "GROCERY",
    bakeries: "BAKERY",
    bakery: "BAKERY",
    catering: "CATERING",
    "food truck": "FOOD_TRUCK",
    market: "GROCERY",
  };

  return categoryMap[category.toLowerCase()] || "RESTAURANT";
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
 * Scrape a single regional chapter page using Puppeteer
 */
async function scrapeRegionalChapter(
  browser: Browser,
  chapter: RegionalChapter
): Promise<number> {
  console.log(`\n--- Scraping ${chapter.region} ---`);
  console.log(`URL: ${chapter.url}`);

  const page = await browser.newPage();
  let savedCount = 0;

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(chapter.url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for Elfsight widget to load
    await sleep(3000);

    // Try to click "Load More" buttons if present
    let loadMoreClicks = 0;
    const maxLoadMoreClicks = 10;

    while (loadMoreClicks < maxLoadMoreClicks) {
      const loadMoreButton = await page.$('button[class*="load-more"], .elfsight-widget button:contains("Load More"), .load-more-btn');
      if (loadMoreButton) {
        try {
          await loadMoreButton.click();
          await sleep(1500);
          loadMoreClicks++;
          console.log(`  Clicked "Load More" (${loadMoreClicks})`);
        } catch {
          break;
        }
      } else {
        break;
      }
    }

    // Extract establishments from the DOM
    const establishments = await page.evaluate(() => {
      const results: Array<{
        name: string;
        address: string;
        phone?: string;
        website?: string;
        category: string;
      }> = [];

      // Try multiple selector patterns for Elfsight widgets
      const selectors = [
        ".elfsight-widget .listing-item",
        ".elfsight-widget .card",
        ".elfsight-widget .business-card",
        ".establishment-listing",
        ".business-listing",
        "table tbody tr",
        ".listing-row",
      ];

      for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
          items.forEach((item) => {
            const nameEl = item.querySelector("h3, h4, .title, .name, td:first-child");
            const addressEl = item.querySelector(".address, p, td:nth-child(2)");
            const phoneEl = item.querySelector(".phone, a[href^='tel'], td:nth-child(3)");
            const websiteEl = item.querySelector("a[href^='http']:not([href*='tel'])");

            const name = nameEl?.textContent?.trim() || "";
            const address = addressEl?.textContent?.trim() || "";

            if (name && name.length > 2 && !name.toLowerCase().includes("establishment")) {
              results.push({
                name,
                address,
                phone: phoneEl?.textContent?.trim() || undefined,
                website: (websiteEl as HTMLAnchorElement)?.href || undefined,
                category: "restaurants", // Default category
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
        const parsed = parseAddress(est.address, {
          state: chapter.defaultState,
          city: chapter.defaultCity,
        });

        const slug = generateSlug(est.name);
        const category = mapCategory(est.category);

        // Check for duplicate
        const existing = await prisma.scrapedBusiness.findFirst({
          where: {
            OR: [
              { name: { equals: est.name, mode: "insensitive" } },
              { phone: est.phone || undefined },
            ],
          },
        });

        if (existing) {
          console.log(`  Skipping duplicate: ${est.name}`);
          continue;
        }

        // Save to ScrapedBusiness table
        await prisma.scrapedBusiness.create({
          data: {
            name: est.name,
            category,
            address: parsed.address,
            city: parsed.city,
            state: parsed.state,
            zipCode: parsed.postalCode,
            phone: est.phone || null,
            website: est.website || null,
            description: `HFSAA certified halal establishment in ${chapter.region}`,
            sourceUrl: chapter.url,
            claimStatus: "PENDING_REVIEW",
            scrapedAt: new Date(),
            metadata: {
              source: "hfsaa",
              region: chapter.region,
              certificationBody: "HFSAA",
              tags: ["HALAL_VERIFIED", "ZABIHA_CERTIFIED"],
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
    console.error(`Error scraping ${chapter.region}:`, error);
  } finally {
    await page.close();
  }

  return savedCount;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("=== HFSAA Browser-Based Scraper for Manaakhah ===\n");
  console.log("This script uses Puppeteer to scrape HFSAA pages with Elfsight widgets.");
  console.log("Data will be saved to the ScrapedBusiness table for admin review.\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalSaved = 0;

  try {
    for (const chapter of REGIONAL_CHAPTERS) {
      const saved = await scrapeRegionalChapter(browser, chapter);
      totalSaved += saved;

      // Rate limiting between chapters
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
