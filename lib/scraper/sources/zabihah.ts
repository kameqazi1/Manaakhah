/**
 * Zabihah.com Scraper
 *
 * Scrapes halal restaurant listings from Zabihah.com, the world's largest
 * community-maintained halal restaurant directory.
 *
 * Zabihah.com uses geolocation-based search. This scraper:
 * 1. Spoofs geolocation for target cities
 * 2. Collects restaurant URLs from the homepage
 * 3. Visits each restaurant detail page to extract structured JSON-LD data
 */

import type { Page, Browser } from "puppeteer";
import { BrowserScraperSource } from "./base";
import type {
  ScraperConfig,
  ScrapedEstablishment,
  RegionalChapter,
} from "../types";

// =============================================================================
// ZABIHAH SCRAPER
// =============================================================================

/**
 * US cities to scrape from Zabihah.com with their coordinates
 */
const US_CITIES: Array<{
  name: string;
  state: string;
  lat: number;
  lng: number;
}> = [
  // Major metros
  { name: "New York", state: "NY", lat: 40.7580, lng: -73.9855 },
  { name: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { name: "Dallas", state: "TX", lat: 32.7767, lng: -96.7970 },
  { name: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194 },
  { name: "Atlanta", state: "GA", lat: 33.7490, lng: -84.3880 },
  { name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { name: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458 },
  { name: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  // More cities with significant Muslim populations
  { name: "Dearborn", state: "MI", lat: 42.3223, lng: -83.1763 },
  { name: "Jersey City", state: "NJ", lat: 40.7178, lng: -74.0431 },
  { name: "Paterson", state: "NJ", lat: 40.9168, lng: -74.1718 },
  { name: "Fremont", state: "CA", lat: 37.5485, lng: -121.9886 },
  { name: "Irving", state: "TX", lat: 32.8140, lng: -96.9489 },
];

export class ZabihahScraperSource extends BrowserScraperSource {
  name = "zabihah" as const;
  displayName = "Zabihah";
  description = "Zabihah.com - World's largest halal restaurant guide";

  /**
   * Virtual chapters based on US cities
   */
  protected chapters: RegionalChapter[] = US_CITIES.map((city) => ({
    region: city.name,
    url: "https://www.zabihah.com/",
    state: city.state,
    defaultCity: city.name,
    coordinates: { lat: city.lat, lng: city.lng },
  }));

  /**
   * Scrape a single city from Zabihah.com
   */
  protected async scrapeChapter(
    chapter: RegionalChapter,
    config: ScraperConfig
  ): Promise<ScrapedEstablishment[]> {
    const establishments: ScrapedEstablishment[] = [];
    const page = await this.createPage();

    try {
      // Set up geolocation spoofing
      if (chapter.coordinates) {
        const context = this.browser!.defaultBrowserContext();
        await context.overridePermissions("https://www.zabihah.com", [
          "geolocation",
        ]);

        await page.setGeolocation({
          latitude: chapter.coordinates.lat,
          longitude: chapter.coordinates.lng,
        });
      }

      // Navigate to Zabihah homepage
      this.logger.debug(`  Loading Zabihah with ${chapter.region} geolocation`);
      await page.goto(chapter.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for content to load
      await this.sleep(5000);

      // Scroll to load more restaurants
      await this.scrollToBottom(page, {
        maxScrolls: 5,
        scrollDelay: 2000,
      });

      // Collect restaurant URLs
      const restaurantUrls = await this.collectRestaurantUrls(page);
      this.logger.info(`  Found ${restaurantUrls.length} restaurants in ${chapter.region}`);

      // Limit results if specified
      const urlsToScrape = config.maxResults
        ? restaurantUrls.slice(0, config.maxResults)
        : restaurantUrls;

      // Visit each restaurant page and extract data
      for (const url of urlsToScrape) {
        try {
          const establishment = await this.scrapeRestaurantPage(
            page,
            url,
            chapter
          );
          if (establishment) {
            establishments.push(establishment);
          }
          // Rate limiting between pages
          await this.sleep(1000);
        } catch (error) {
          this.logger.debug(
            `  Error scraping ${url}: ${
              error instanceof Error ? error.message : error
            }`
          );
        }
      }

      return establishments;
    } finally {
      await page.close();
    }
  }

  /**
   * Collect restaurant URLs from the homepage
   */
  private async collectRestaurantUrls(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/restaurants/"]'));
      const urls = new Set<string>();

      for (const link of links) {
        const href = link.getAttribute("href");
        if (href && href.includes("/restaurants/")) {
          // Build full URL if relative
          const fullUrl = href.startsWith("http")
            ? href
            : `https://www.zabihah.com${href}`;
          urls.add(fullUrl);
        }
      }

      return Array.from(urls);
    });
  }

  /**
   * Scrape a single restaurant detail page
   */
  private async scrapeRestaurantPage(
    page: Page,
    url: string,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment | null> {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await this.sleep(2000);

    // Extract JSON-LD structured data
    const jsonLdData = await page.evaluate(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || "");
          if (data["@type"] === "Restaurant") {
            return data;
          }
        } catch {
          // Invalid JSON, continue
        }
      }
      return null;
    });

    if (!jsonLdData) {
      // Fallback to text parsing
      return this.parseFromPageText(page, url, chapter);
    }

    // Parse address from JSON-LD
    const address = jsonLdData.address || {};
    const streetAddress = address.streetAddress || "";
    const city = address.addressLocality || chapter.defaultCity || "";
    const state = address.addressRegion || chapter.state;

    // Get cuisine types
    const cuisines = jsonLdData.servesCuisine || [];
    const category = this.mapCuisineToCategory(cuisines);

    // Get halal status from description
    const halalStatus = jsonLdData.hasMenuSection?.name || "";
    const description = jsonLdData.description || "";

    return {
      name: jsonLdData.name || "",
      address: streetAddress,
      city,
      state,
      country: "USA",
      phone: undefined, // Zabihah doesn't always have phone in JSON-LD
      website: jsonLdData.url || url,
      description: description || halalStatus,
      category,
      region: chapter.region,
      certificationBody: "Zabihah (Community)",
      sourceUrl: url,
    };
  }

  /**
   * Fallback: parse restaurant data from page text
   */
  private async parseFromPageText(
    page: Page,
    url: string,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment | null> {
    const pageData = await page.evaluate(() => {
      const text = document.body.innerText;
      const title = document.title;

      // Extract name from title (format: "Name - City, ST | Zabihah")
      const titleMatch = title.match(/^(.+?)\s*-\s*(.+?)\s*\|/);
      const name = titleMatch ? titleMatch[1].trim() : "";

      // Try to find address in page text
      // Address usually appears after the name, contains digits
      const lines = text.split("\n").map((l) => l.trim());
      let address = "";
      let city = "";
      let state = "";

      for (const line of lines) {
        // Look for address pattern: "123 Street Name, City, ST"
        const addressMatch = line.match(
          /^(\d+\s+.+?),\s*([^,]+),\s*([A-Z]{2})$/
        );
        if (addressMatch) {
          address = addressMatch[1];
          city = addressMatch[2].trim();
          state = addressMatch[3];
          break;
        }
      }

      return { name, address, city, state };
    });

    if (!pageData.name) {
      return null;
    }

    return {
      name: pageData.name,
      address: pageData.address || "Address not provided",
      city: pageData.city || chapter.defaultCity || "",
      state: pageData.state || chapter.state,
      country: "USA",
      category: "restaurant",
      region: chapter.region,
      certificationBody: "Zabihah (Community)",
      sourceUrl: url,
    };
  }

  /**
   * Map cuisine types to our category enum
   */
  private mapCuisineToCategory(cuisines: string[]): string {
    const cuisineList = cuisines.map((c) => c.toLowerCase());

    // Check for specific cuisine types
    if (
      cuisineList.some((c) =>
        ["grocery", "market", "supermarket"].some((k) => c.includes(k))
      )
    ) {
      return "grocery";
    }
    if (cuisineList.some((c) => c.includes("butcher") || c.includes("meat"))) {
      return "butcher";
    }
    if (
      cuisineList.some((c) =>
        ["cafe", "coffee", "bakery", "dessert"].some((k) => c.includes(k))
      )
    ) {
      return "cafe";
    }

    // Default to restaurant
    return "restaurant";
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

/**
 * Create and export Zabihah scraper instance
 */
export function createZabihahScraper(
  verbose: boolean = false
): ZabihahScraperSource {
  return new ZabihahScraperSource(verbose);
}

/**
 * Convenience function to scrape Zabihah directly
 */
export async function scrapeZabihah(
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedEstablishment[]> {
  const scraper = createZabihahScraper(config.verbose);
  return scraper.scrape({
    sources: ["zabihah"],
    ...config,
  });
}
