/**
 * HFSAA (Halal Food Standards Alliance of America) Scraper
 *
 * Scrapes certified business listings from HFSAA regional chapter pages.
 * Uses Puppeteer because HFSAA uses Elfsight widgets that require JavaScript.
 *
 * HFSAA chapters:
 * - Chicago, IL
 * - Bay Area, CA
 * - Houston, TX
 * - Dallas/Fort Worth, TX
 * - Atlanta, GA
 * - New York Metro, NY/NJ
 * - Michigan/Detroit, MI
 * - Southern California, CA
 * - And more...
 */

import type { Page } from "puppeteer";
import { BrowserScraperSource } from "./base";
import type {
  ScraperConfig,
  ScrapedEstablishment,
  RegionalChapter,
} from "../types";

// =============================================================================
// HFSAA SCRAPER
// =============================================================================

export class HFSAAScraperSource extends BrowserScraperSource {
  name = "hfsaa" as const;
  displayName = "HFSAA";
  description = "Halal Food Standards Alliance of America certified establishments";

  /**
   * HFSAA regional chapter URLs
   */
  protected chapters: RegionalChapter[] = [
    // California
    { region: "Bay Area", url: "https://hfsaa.org/bayarea/", state: "CA", defaultCity: "Fremont" },
    { region: "Southern California", url: "https://hfsaa.org/socal/", state: "CA", defaultCity: "Los Angeles" },

    // Illinois
    { region: "Chicago", url: "https://hfsaa.org/chicago/", state: "IL", defaultCity: "Chicago" },

    // Texas
    { region: "Houston", url: "https://hfsaa.org/houston/", state: "TX", defaultCity: "Houston" },
    { region: "Dallas/Fort Worth", url: "https://hfsaa.org/dfw/", state: "TX", defaultCity: "Dallas" },

    // Georgia
    { region: "Atlanta", url: "https://hfsaa.org/atlanta/", state: "GA", defaultCity: "Atlanta" },

    // New York/New Jersey
    { region: "New York Metro", url: "https://hfsaa.org/nymetro/", state: "NY", defaultCity: "New York" },
    { region: "New Jersey", url: "https://hfsaa.org/newjersey/", state: "NJ", defaultCity: "Paterson" },

    // Michigan
    { region: "Michigan", url: "https://hfsaa.org/michigan/", state: "MI", defaultCity: "Dearborn" },

    // Ohio
    { region: "Ohio", url: "https://hfsaa.org/ohio/", state: "OH", defaultCity: "Columbus" },

    // Virginia/DC
    { region: "Virginia/DC", url: "https://hfsaa.org/virginia/", state: "VA", defaultCity: "Fairfax" },

    // Pennsylvania
    { region: "Pennsylvania", url: "https://hfsaa.org/pennsylvania/", state: "PA", defaultCity: "Philadelphia" },

    // Florida
    { region: "Florida", url: "https://hfsaa.org/florida/", state: "FL", defaultCity: "Miami" },

    // North Carolina
    { region: "North Carolina", url: "https://hfsaa.org/northcarolina/", state: "NC", defaultCity: "Charlotte" },

    // Tennessee
    { region: "Tennessee", url: "https://hfsaa.org/tennessee/", state: "TN", defaultCity: "Nashville" },

    // Arizona
    { region: "Arizona", url: "https://hfsaa.org/arizona/", state: "AZ", defaultCity: "Phoenix" },
  ];

  /**
   * Scrape a single HFSAA chapter page
   */
  protected async scrapeChapter(
    chapter: RegionalChapter,
    config: ScraperConfig
  ): Promise<ScrapedEstablishment[]> {
    const establishments: ScrapedEstablishment[] = [];
    const page = await this.createPage();

    try {
      // Navigate to chapter page
      await page.goto(chapter.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for Elfsight widget to load
      await this.sleep(3000);

      // Check for Elfsight widget
      const hasElfsight = await this.waitForElement(
        page,
        '[class*="elfsight"], [class*="eapps"], iframe[src*="elfsight"]',
        10000
      );

      if (!hasElfsight) {
        this.logger.warn(`  No Elfsight widget found on ${chapter.region}`);

        // Try to find any listing elements
        const rawEstablishments = await this.extractFromGenericPage(page, chapter);
        establishments.push(...rawEstablishments);
      } else {
        // Click "Load More" buttons until all content is loaded
        await this.loadAllContent(page);

        // Extract establishments from Elfsight widget
        const rawEstablishments = await this.extractFromElfsightWidget(page, chapter);
        establishments.push(...rawEstablishments);
      }

      // Apply max results limit
      if (config.maxResults && establishments.length > config.maxResults) {
        return establishments.slice(0, config.maxResults);
      }

      return establishments;
    } finally {
      await page.close();
    }
  }

  /**
   * Load all content by clicking "Load More" buttons
   */
  private async loadAllContent(page: Page): Promise<void> {
    let loadMoreClicks = 0;
    const maxClicks = 20;
    let previousCount = 0;

    while (loadMoreClicks < maxClicks) {
      // Scroll the list container to trigger lazy loading
      await page.evaluate(() => {
        const listContainer = document.querySelector('[class*="directory-locations-list__Container"]');
        if (listContainer) {
          listContainer.scrollTop = listContainer.scrollHeight;
        }
      });

      await this.sleep(500);

      // Click Load More button using the correct selector for Elfsight store locator
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('[class*="directory-locations-list__StyledButton"]') as HTMLElement;
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.height > 0) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) {
        this.logger.debug("  No more Load More buttons found");
        break;
      }

      loadMoreClicks++;
      this.logger.debug(`  Clicked Load More (${loadMoreClicks})`);
      await this.sleep(1500);

      // Count current addresses to detect when all content is loaded
      const count = await page.evaluate(() => {
        const addresses = document.body.innerText.match(/\d+\s+[\w\s]+,\s+[\w\s]+,\s*[A-Z]{2}\s*\d{5}/g) || [];
        return addresses.length;
      });

      if (count === previousCount) {
        this.logger.debug("  No new content loaded, stopping");
        break;
      }
      previousCount = count;
    }
  }

  /**
   * Extract establishments from Elfsight widget using text parsing
   * The Elfsight store locator widget renders content as text in a specific pattern:
   * Name, Status, Hours, Address, Phone, Website
   */
  private async extractFromElfsightWidget(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    return page.evaluate(
      (chapterData) => {
        const results: ScrapedEstablishment[] = [];
        const text = document.body.innerText;
        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

        // Find the start of listings (after "X locations")
        const locationsIdx = lines.findIndex((l: string) => /^\d+\s+locations$/.test(l));
        if (locationsIdx === -1) return results;

        const listingLines = lines.slice(locationsIdx + 1);

        let i = 0;
        while (i < listingLines.length) {
          const line = listingLines[i];

          // Skip footer/navigation
          if (line.includes('Load More') ||
            line.includes('© ') ||
            line.includes('Stadia Maps') ||
            line.includes('OpenMapTiles') ||
            line.includes('info@hfsaa') ||
            line.includes('Apply for Certification')) {
            break;
          }

          // Check if this looks like a business name (not an address, phone, or website)
          const isAddress = /^\d+\s+\w+/.test(line) && line.includes(',');
          const isPhone = /^\+?\d[\d\s\-()]+$/.test(line);
          const isWebsite = /\.(com|us|org|net|site|co|online)$/i.test(line);
          const isStatus = line === 'Closed' || line === 'Open' || line.startsWith('Opens ') || line.startsWith('Closes ');

          if (!isAddress && !isPhone && !isWebsite && !isStatus && line.length > 2) {
            // This is likely a business name
            const business: {
              name: string;
              status?: string;
              hours?: string;
              address?: string;
              city?: string;
              state?: string;
              zip?: string;
              phone?: string;
              website?: string;
            } = { name: line };

            // Look ahead for status, hours, address, phone, website
            let j = i + 1;
            while (j < listingLines.length && j < i + 8) {
              const nextLine = listingLines[j];

              const isNextAddress = /^\d+\s+\w+/.test(nextLine) && nextLine.includes(',');
              const isNextPhone = /^\+?\d[\d\s\-()]+$/.test(nextLine);
              const isNextWebsite = /\.(com|us|org|net|site|co|online)$/i.test(nextLine);
              const isNextStatus = nextLine === 'Closed' || nextLine === 'Open';

              if (isNextStatus) {
                business.status = nextLine;
              } else if (nextLine.match(/Opens .* at/)) {
                business.hours = nextLine;
              } else if (isNextAddress) {
                // Parse address: "123 Street, City, ST ZIP, USA"
                const addressMatch = nextLine.match(/^(.+),\s*([\w\s]+),\s*([A-Z]{2})\s*(\d{5})(?:,\s*USA)?$/);
                if (addressMatch) {
                  business.address = addressMatch[1].trim();
                  business.city = addressMatch[2].trim();
                  business.state = addressMatch[3];
                  business.zip = addressMatch[4];
                } else {
                  business.address = nextLine;
                }
              } else if (isNextPhone) {
                business.phone = nextLine;
              } else if (isNextWebsite) {
                business.website = nextLine;
              } else if (!isNextStatus && nextLine.length > 2) {
                // Unknown line, might be next business
                break;
              }

              j++;
            }

            // Only add if we have an address
            if (business.address) {
              results.push({
                name: business.name,
                address: business.address,
                city: business.city || chapterData.defaultCity || "",
                state: business.state || chapterData.state,
                postalCode: business.zip,
                country: "USA",
                phone: business.phone,
                website: business.website,
                category: "restaurant",
                region: chapterData.region,
                certificationBody: "HFSAA",
                sourceUrl: chapterData.url,
              });
            }

            i = j;
          } else {
            i++;
          }
        }

        return results;
      },
      chapter
    );
  }

  /**
   * Extract from a generic page without Elfsight widget
   * Falls back to same text parsing approach
   */
  private async extractFromGenericPage(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    // Use the same extraction logic as Elfsight
    return this.extractFromElfsightWidget(page, chapter);
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

/**
 * Create and export HFSAA scraper instance
 */
export function createHFSAAScraper(verbose: boolean = false): HFSAAScraperSource {
  return new HFSAAScraperSource(verbose);
}

/**
 * Convenience function to scrape HFSAA directly
 */
export async function scrapeHFSAA(
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedEstablishment[]> {
  const scraper = createHFSAAScraper(config.verbose);
  return scraper.scrape({
    sources: ["hfsaa"],
    ...config,
  });
}
