/**
 * HFSAA (Halal Food Standards Alliance of America) Scraper
 *
 * Cheerio-based scraper for HFSAA regional chapter pages.
 * For JavaScript-rendered pages (Elfsight widgets), use the CLI script: scripts/scrape-hfsaa-browser.ts
 */

import * as cheerio from "cheerio";
import {
  ScrapedBusiness,
  ScraperConfig,
  ScraperError,
  BusinessCategory,
  BusinessTag,
  MuslimSignal,
} from "../types";
import { analyzeMuslimSignals, detectTags, sleep } from "../utils";

// =============================================================================
// TYPES
// =============================================================================

interface HFSAAEstablishment {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  website?: string;
  category: string;
  region: string;
}

interface RegionalChapter {
  region: string;
  url: string;
  defaultState: string;
  defaultCity: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * HFSAA Regional Chapter URLs
 * Note: Some chapters use Elfsight widgets which require browser-based scraping
 */
const REGIONAL_CHAPTERS: RegionalChapter[] = [
  // Midwest chapters
  { region: "Chicago", url: "https://www.hfsaa.org/chicago", defaultState: "IL", defaultCity: "Chicago" },
  { region: "Detroit", url: "https://www.hfsaa.org/detroit", defaultState: "MI", defaultCity: "Detroit" },
  { region: "Indianapolis", url: "https://www.hfsaa.org/indianapolis", defaultState: "IN", defaultCity: "Indianapolis" },
  { region: "Columbus", url: "https://www.hfsaa.org/columbus", defaultState: "OH", defaultCity: "Columbus" },
  // Northeast chapters
  { region: "New York", url: "https://www.hfsaa.org/newyork", defaultState: "NY", defaultCity: "New York" },
  { region: "New Jersey", url: "https://www.hfsaa.org/newjersey", defaultState: "NJ", defaultCity: "Newark" },
  { region: "Pennsylvania", url: "https://www.hfsaa.org/pennsylvania", defaultState: "PA", defaultCity: "Philadelphia" },
  // West chapters
  { region: "Bay Area", url: "https://www.hfsaa.org/bayarea", defaultState: "CA", defaultCity: "Fremont" },
  { region: "Los Angeles", url: "https://www.hfsaa.org/losangeles", defaultState: "CA", defaultCity: "Los Angeles" },
  { region: "Seattle", url: "https://www.hfsaa.org/seattle", defaultState: "WA", defaultCity: "Seattle" },
  // Southeast chapters
  { region: "Atlanta", url: "https://www.hfsaa.org/atlanta", defaultState: "GA", defaultCity: "Atlanta" },
  { region: "Florida", url: "https://www.hfsaa.org/florida", defaultState: "FL", defaultCity: "Miami" },
  // South chapters
  { region: "Texas", url: "https://www.hfsaa.org/texas", defaultState: "TX", defaultCity: "Houston" },
  { region: "Dallas", url: "https://www.hfsaa.org/dallas", defaultState: "TX", defaultCity: "Dallas" },
];

/**
 * State name to abbreviation mapping
 */
const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse a full address string into components
 */
function parseAddress(
  fullAddress: string,
  defaults: { state: string; city: string }
): { address: string; city: string; state: string; postalCode: string } {
  // Default result
  const result = {
    address: fullAddress.trim(),
    city: defaults.city,
    state: defaults.state,
    postalCode: "",
  };

  // Try to extract ZIP code (5 digits, optionally followed by -4 digits)
  const zipMatch = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    result.postalCode = zipMatch[1];
  }

  // Split by common delimiters
  const parts = fullAddress.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    // Format: "123 Main St, City, ST 12345" or "123 Main St, City, State"
    result.address = parts[0];
    result.city = parts[1].replace(/\d{5}(-\d{4})?/, "").trim();

    // Try to parse state from last part
    const statePart = parts[parts.length - 1];
    const stateMatch = statePart.match(/([A-Z]{2})\s*\d{5}/) || statePart.match(/^([A-Z]{2})$/);
    if (stateMatch) {
      result.state = stateMatch[1];
    } else {
      // Try full state name
      const stateLower = statePart.replace(/\d+/g, "").trim().toLowerCase();
      if (STATE_ABBREVIATIONS[stateLower]) {
        result.state = STATE_ABBREVIATIONS[stateLower];
      }
    }
  } else if (parts.length === 2) {
    // Format: "123 Main St, City ST 12345"
    result.address = parts[0];
    const cityStatePart = parts[1];
    const cityStateMatch = cityStatePart.match(/^(.+?)\s+([A-Z]{2})\s*(\d{5})?/);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
      result.state = cityStateMatch[2];
      if (cityStateMatch[3]) {
        result.postalCode = cityStateMatch[3];
      }
    } else {
      result.city = cityStatePart.replace(/\d{5}(-\d{4})?/, "").trim();
    }
  }

  return result;
}

/**
 * Map HFSAA category to BusinessCategory enum
 */
function mapCategory(hfsaaCategory: string): BusinessCategory {
  const categoryMap: Record<string, BusinessCategory> = {
    restaurants: "RESTAURANT",
    restaurant: "RESTAURANT",
    butcheries: "BUTCHER",
    butcher: "BUTCHER",
    "meat shop": "BUTCHER",
    grocery: "GROCERY",
    groceries: "GROCERY",
    "grocery store": "GROCERY",
    bakeries: "BAKERY",
    bakery: "BAKERY",
    catering: "CATERING",
    "food truck": "FOOD_TRUCK",
    market: "GROCERY",
    supermarket: "GROCERY",
  };

  const normalized = hfsaaCategory.toLowerCase().trim();
  return categoryMap[normalized] || "RESTAURANT";
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

// =============================================================================
// SCRAPING FUNCTIONS
// =============================================================================

/**
 * Scrape a single HFSAA regional page using Cheerio
 */
async function scrapeRegionalPage(
  chapter: RegionalChapter
): Promise<HFSAAEstablishment[]> {
  const establishments: HFSAAEstablishment[] = [];

  try {
    const response = await fetch(chapter.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${chapter.region}: ${response.status}`);
      return establishments;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try different page structures

    // Structure 1: Table-based listing
    $("table tr").each((_idx, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const name = cleanText($(cells[0]).text());
        const addressText = cleanText($(cells[1]).text());
        const phone = cells.length > 2 ? cleanText($(cells[2]).text()) : undefined;

        if (name && name.length > 2 && !name.toLowerCase().includes("establishment")) {
          const parsed = parseAddress(addressText, {
            state: chapter.defaultState,
            city: chapter.defaultCity,
          });

          establishments.push({
            name,
            ...parsed,
            phone: phone && phone.match(/\d/) ? phone : undefined,
            category: "restaurants",
            region: chapter.region,
          });
        }
      }
    });

    // Structure 2: List-based (ul/li) listing
    if (establishments.length === 0) {
      $("ul li, .establishment, .business-listing, .listing-item").each((_idx, item) => {
        const text = cleanText($(item).text());

        // Try to extract name (usually first line or before address)
        const lines = text.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          const name = lines[0];
          const addressText = lines.slice(1).join(", ");

          if (name && name.length > 2 && !name.toLowerCase().includes("click") && !name.toLowerCase().includes("view")) {
            const parsed = parseAddress(addressText, {
              state: chapter.defaultState,
              city: chapter.defaultCity,
            });

            establishments.push({
              name,
              ...parsed,
              category: "restaurants",
              region: chapter.region,
            });
          }
        }
      });
    }

    // Structure 3: Card-based layout
    if (establishments.length === 0) {
      $(".card, .business-card, .establishment-card, [class*='listing']").each((_idx, card) => {
        const nameEl = $(card).find("h2, h3, h4, .title, .name, [class*='name']").first();
        const addressEl = $(card).find(".address, [class*='address'], p").first();
        const phoneEl = $(card).find(".phone, [class*='phone'], a[href^='tel']").first();
        const websiteEl = $(card).find("a[href^='http']").first();

        const name = cleanText(nameEl.text());
        const addressText = cleanText(addressEl.text());

        if (name && name.length > 2) {
          const parsed = parseAddress(addressText || "", {
            state: chapter.defaultState,
            city: chapter.defaultCity,
          });

          establishments.push({
            name,
            ...parsed,
            phone: cleanText(phoneEl.text()) || undefined,
            website: websiteEl.attr("href") || undefined,
            category: "restaurants",
            region: chapter.region,
          });
        }
      });
    }

    console.log(`Scraped ${establishments.length} establishments from ${chapter.region}`);
  } catch (error) {
    console.error(`Error scraping ${chapter.region}:`, error);
  }

  return establishments;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Scrape HFSAA certified businesses
 *
 * This Cheerio-based scraper works for static HTML pages.
 * For pages using Elfsight widgets (JavaScript-rendered), use the CLI script:
 * npx tsx scripts/scrape-hfsaa-browser.ts
 */
export async function scrapeHFSAA(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  const businesses: ScrapedBusiness[] = [];
  const errors: ScraperError[] = [];

  // Determine which regions to scrape
  let chaptersToScrape = REGIONAL_CHAPTERS;

  // Filter by state if specified
  if (config.state) {
    const stateUpper = config.state.toUpperCase();
    chaptersToScrape = REGIONAL_CHAPTERS.filter(
      (c) => c.defaultState === stateUpper
    );
  }

  // Limit number of regions for API route timeout safety (max 3 at a time)
  const maxRegions = 3;
  if (chaptersToScrape.length > maxRegions) {
    console.log(`Limiting to ${maxRegions} regions for API timeout safety`);
    chaptersToScrape = chaptersToScrape.slice(0, maxRegions);
  }

  for (const chapter of chaptersToScrape) {
    try {
      const establishments = await scrapeRegionalPage(chapter);

      for (const est of establishments) {
        // Skip if name is too short or looks invalid
        if (!est.name || est.name.length < 3) continue;

        // Build combined text for signal analysis
        const combinedText = `${est.name} HFSAA halal certified zabiha ${est.category}`;
        const { score, signals } = analyzeMuslimSignals(combinedText, est.name);
        const { detected } = detectTags(combinedText, est.name, signals);

        // Map category
        const category = mapCategory(est.category);

        // Build ScrapedBusiness
        const business: ScrapedBusiness = {
          name: est.name,
          description: `HFSAA certified halal ${est.category} in ${est.city}, ${est.state}`,
          category,
          suggestedCategories: [],
          tags: [
            ...detected,
            "HALAL_VERIFIED" as BusinessTag,
            "ZABIHA_CERTIFIED" as BusinessTag,
          ],
          suggestedTags: [],
          address: est.address,
          city: est.city || config.city,
          state: est.state || config.state,
          zipCode: est.postalCode || config.zipCode || "",
          phone: est.phone,
          website: est.website,
          // Boost confidence for HFSAA certified businesses
          confidence: Math.min(score + 35, 100),
          signals,
          verificationLevel: "OFFICIALLY_CERTIFIED",
          source: "hfsaa",
          sourceUrl: chapter.url,
          sourceId: `hfsaa_${est.region.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          scrapedAt: new Date(),
          metadata: {
            region: est.region,
            certificationBody: "HFSAA",
          },
        };

        businesses.push(business);
      }

      // Rate limiting between regions
      await sleep(config.rateLimit || 1000);
    } catch (error) {
      errors.push({
        source: "hfsaa",
        message: `Failed to scrape ${chapter.region}: ${error instanceof Error ? error.message : String(error)}`,
        retryable: true,
      });
    }
  }

  // Add note about browser-based scraping if few results
  if (businesses.length === 0) {
    errors.push({
      source: "hfsaa",
      message: "No establishments found. HFSAA pages may use Elfsight widgets requiring browser-based scraping. Run: npx tsx scripts/scrape-hfsaa-browser.ts",
      retryable: false,
    });
  }

  return { businesses, errors };
}

export default scrapeHFSAA;
