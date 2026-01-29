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

    while (loadMoreClicks < maxClicks) {
      // Try various "Load More" selectors
      const loadMoreSelectors = [
        'button:contains("Load More")',
        '[class*="load-more"]',
        '[class*="show-more"]',
        'a:contains("Load More")',
        'button[class*="more"]',
      ];

      let clicked = false;

      for (const selector of loadMoreSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            const isVisible = await page.evaluate(
              (el) => {
                const style = window.getComputedStyle(el);
                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden" &&
                  style.opacity !== "0"
                );
              },
              button
            );

            if (isVisible) {
              await button.click();
              await this.sleep(1500);
              clicked = true;
              loadMoreClicks++;
              this.logger.debug(`  Clicked Load More (${loadMoreClicks})`);
              break;
            }
          }
        } catch {
          // Selector not found or not clickable
        }
      }

      if (!clicked) {
        // No more "Load More" buttons found
        break;
      }
    }
  }

  /**
   * Extract establishments from Elfsight widget
   */
  private async extractFromElfsightWidget(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    return page.evaluate(
      (chapterData) => {
        const results: ScrapedEstablishment[] = [];

        // Try multiple selector patterns for Elfsight widgets
        const cardSelectors = [
          '[class*="eapps-google-maps-store"]',
          '[class*="store-item"]',
          '[class*="listing-item"]',
          '[class*="business-card"]',
          '[class*="location-card"]',
          '.card',
          'article',
        ];

        let cards: Element[] = [];
        for (const selector of cardSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            cards = Array.from(found);
            break;
          }
        }

        for (const card of cards) {
          // Try to extract name
          const nameEl = card.querySelector(
            '[class*="title"], [class*="name"], h2, h3, h4, strong'
          );
          const name = nameEl?.textContent?.trim();

          if (!name || name.length < 2) continue;

          // Try to extract address
          const addressEl = card.querySelector(
            '[class*="address"], [class*="location"], p'
          );
          const address = addressEl?.textContent?.trim() || "";

          // Try to extract phone
          const phoneEl = card.querySelector(
            '[class*="phone"], a[href^="tel:"]'
          );
          let phone = phoneEl?.textContent?.trim();
          if (!phone && phoneEl) {
            const href = phoneEl.getAttribute("href");
            if (href?.startsWith("tel:")) {
              phone = href.replace("tel:", "");
            }
          }

          // Try to extract website
          const websiteEl = card.querySelector(
            'a[href^="http"]:not([href*="tel:"]):not([href*="mailto:"])'
          );
          const website = (websiteEl as HTMLAnchorElement)?.href;

          // Try to extract description
          const descEl = card.querySelector(
            '[class*="description"], [class*="bio"], p:not([class*="address"])'
          );
          const description = descEl?.textContent?.trim();

          results.push({
            name,
            address: address || "Address not provided",
            city: chapterData.defaultCity || "",
            state: chapterData.state,
            country: "USA",
            phone: phone || undefined,
            website: website || undefined,
            description: description || undefined,
            category: "restaurant", // Default, will be mapped
            region: chapterData.region,
            certificationBody: "HFSAA",
            sourceUrl: chapterData.url,
          });
        }

        return results;
      },
      chapter
    );
  }

  /**
   * Extract from a generic page without Elfsight widget
   */
  private async extractFromGenericPage(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    return page.evaluate(
      (chapterData) => {
        const results: ScrapedEstablishment[] = [];
        const pageText = document.body.innerText;

        // Try to find business listings in the page text
        // Look for patterns like "Business Name\nAddress\nPhone"
        const lines = pageText.split("\n").map((l) => l.trim()).filter(Boolean);

        let currentBusiness: Partial<ScrapedEstablishment> | null = null;

        for (const line of lines) {
          // Skip navigation/menu items
          if (
            line.length < 3 ||
            line.includes("Menu") ||
            line.includes("Contact") ||
            line.includes("About")
          ) {
            continue;
          }

          // Check if this looks like an address
          const addressPattern = /^\d+\s+\w+.*(?:St|Ave|Rd|Blvd|Dr|Way|Ln|Ct)/i;
          const cityStatePattern = /^[\w\s]+,\s*[A-Z]{2}\s*\d{5}/i;

          if (addressPattern.test(line)) {
            if (currentBusiness?.name) {
              currentBusiness.address = line;
            }
          } else if (cityStatePattern.test(line)) {
            if (currentBusiness?.name) {
              // Parse city, state, zip from line
              const match = line.match(/^(.+?),\s*([A-Z]{2})\s*(\d{5})?/);
              if (match) {
                currentBusiness.city = match[1].trim();
                currentBusiness.state = match[2];
                if (match[3]) {
                  currentBusiness.postalCode = match[3];
                }
              }

              // Save and reset
              if (currentBusiness.name && currentBusiness.address) {
                results.push({
                  name: currentBusiness.name,
                  address: currentBusiness.address,
                  city: currentBusiness.city || chapterData.defaultCity || "",
                  state: currentBusiness.state || chapterData.state,
                  postalCode: currentBusiness.postalCode,
                  country: "USA",
                  phone: currentBusiness.phone,
                  website: currentBusiness.website,
                  category: "restaurant",
                  region: chapterData.region,
                  certificationBody: "HFSAA",
                  sourceUrl: chapterData.url,
                });
              }

              currentBusiness = null;
            }
          } else if (line.match(/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/)) {
            // Phone number
            if (currentBusiness) {
              currentBusiness.phone = line;
            }
          } else if (line.length > 3 && line.length < 100 && !line.includes("@")) {
            // Might be a business name
            currentBusiness = {
              name: line,
              state: chapterData.state,
            };
          }
        }

        return results;
      },
      chapter
    );
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
