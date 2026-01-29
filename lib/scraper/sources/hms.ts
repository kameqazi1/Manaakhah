/**
 * HMS (Halal Monitoring Services) Scraper
 *
 * Scrapes certified business listings from HMS USA website.
 * Uses Puppeteer because HMS uses lazy-loading that requires scrolling.
 *
 * HMS certifies businesses primarily on the East Coast and Midwest:
 * - New Jersey
 * - New York
 * - Pennsylvania
 * - Michigan
 * - And other states
 */

import type { Page } from "puppeteer";
import { BrowserScraperSource } from "./base";
import type {
  ScraperConfig,
  ScrapedEstablishment,
  RegionalChapter,
} from "../types";

// =============================================================================
// HMS SCRAPER
// =============================================================================

export class HMSScraperSource extends BrowserScraperSource {
  name = "hms" as const;
  displayName = "HMS";
  description = "Halal Monitoring Services certified establishments";

  /**
   * HMS pages to scrape
   * HMS has a single certified listing page rather than regional chapters
   */
  protected chapters: RegionalChapter[] = [
    {
      region: "National",
      url: "https://www.hmsusa.org/certified-listing",
      state: "NJ", // Default state (HMS is NJ-based)
      defaultCity: "Unknown",
    },
  ];

  /**
   * Scrape the HMS certified listing page
   */
  protected async scrapeChapter(
    chapter: RegionalChapter,
    config: ScraperConfig
  ): Promise<ScrapedEstablishment[]> {
    const establishments: ScrapedEstablishment[] = [];
    const page = await this.createPage();

    try {
      // Navigate to certified listing page
      await page.goto(chapter.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for initial content
      await this.sleep(2000);

      // Scroll to load all lazy-loaded content
      this.logger.info("  Scrolling to load all content...");
      await this.scrollToBottom(page, {
        maxScrolls: 50,
        scrollDelay: 1500,
        onScroll: (num, height) => {
          this.logger.debug(`  Scroll ${num}: height = ${height}`);
        },
      });

      // Extract establishments from the page
      this.logger.info("  Extracting establishments...");
      const rawEstablishments = await this.extractEstablishments(page, chapter);
      establishments.push(...rawEstablishments);

      // Apply max results limit
      if (config.maxResults && establishments.length > config.maxResults) {
        return establishments.slice(0, config.maxResults);
      }

      // Filter by state if specified
      if (config.state) {
        const stateLower = config.state.toLowerCase();
        return establishments.filter(
          (e) => e.state.toLowerCase() === stateLower
        );
      }

      return establishments;
    } finally {
      await page.close();
    }
  }

  /**
   * Extract establishments from the HMS page
   *
   * HMS page uses a text-based listing format that requires parsing.
   */
  private async extractEstablishments(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    // First try structured selectors
    const structuredResults = await this.extractFromStructuredPage(page, chapter);
    if (structuredResults.length > 0) {
      return structuredResults;
    }

    // Fall back to text parsing
    return this.extractFromTextPage(page, chapter);
  }

  /**
   * Extract from structured HTML elements
   * HMS uses MagicListing record-list cards with structured content
   */
  private async extractFromStructuredPage(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    return page.evaluate(
      (chapterData) => {
        const results: ScrapedEstablishment[] = [];

        // HMS uses MagicListing record-list cards
        const cards = document.querySelectorAll('.MagicListing.record-list');

        if (cards.length === 0) {
          return results;
        }

        cards.forEach((card) => {
          const text = (card as HTMLElement).innerText || '';
          const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

          // Skip if not enough lines
          if (lines.length < 3) return;

          // First line is category (RESTAURANTS, RETAIL STORE, etc.)
          const category = lines[0];

          // Second line is business name
          const name = lines[1];

          // Third line is full address (e.g., "2525 W Devon Ave, Chicago, IL 60659")
          const fullAddress = lines[2];

          // Parse address components
          // Format: "Street Address, City, ST ZIP"
          const addressMatch = fullAddress.match(/^(.+),\s*(.+),\s*([A-Z]{2})\s*(\d{5})$/);

          let street = fullAddress;
          let city = '';
          let state = chapterData.state;
          let postalCode = '';

          if (addressMatch) {
            street = addressMatch[1].trim();
            city = addressMatch[2].trim();
            state = addressMatch[3];
            postalCode = addressMatch[4];
          } else {
            // Try alternate parsing - look for City/State labels
            const cityIdx = lines.findIndex((l: string) => l === 'City');
            if (cityIdx !== -1 && cityIdx + 1 < lines.length) {
              city = lines[cityIdx + 1];
            }
            const stateIdx = lines.findIndex((l: string) => l === 'State');
            if (stateIdx !== -1 && stateIdx + 1 < lines.length) {
              // Convert state name to abbreviation
              const stateMap: Record<string, string> = {
                'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
                'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
                'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
                'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
                'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
                'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
                'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
                'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
                'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
                'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
                'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
                'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
                'Wisconsin': 'WI', 'Wyoming': 'WY',
              };
              const stateName = lines[stateIdx + 1];
              state = stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
            }
          }

          // Look for Products line
          const productsLine = lines.find((l: string) => l.startsWith('Products:'));
          const products = productsLine ? productsLine.replace('Products:', '').trim().split(' ') : undefined;

          // Skip if name is invalid
          if (!name || name.length < 2 || name === category) return;

          // Map category to our category type
          const categoryMap: Record<string, string> = {
            'RESTAURANTS': 'restaurant',
            'RETAIL STORE': 'grocery',
            'SLAUGHTER HOUSE': 'butcher',
            'PROCESSORS': 'food_production',
            'DISTRIBUTOR': 'other',
            'CATERERS': 'restaurant',
            'MISC': 'other',
            'FURTHER PROCESSOR': 'food_production',
          };

          results.push({
            name,
            address: street,
            city: city || chapterData.defaultCity || 'Unknown',
            state,
            postalCode: postalCode || undefined,
            country: 'USA',
            category: categoryMap[category] || 'restaurant',
            region: chapterData.region,
            certificationBody: 'HMS',
            sourceUrl: chapterData.url,
            products,
          });
        });

        return results;
      },
      chapter
    );
  }

  /**
   * Extract from plain text content using pattern matching
   */
  private async extractFromTextPage(
    page: Page,
    chapter: RegionalChapter
  ): Promise<ScrapedEstablishment[]> {
    const pageText = await page.evaluate(() => document.body.innerText);

    return this.parseTextContent(pageText, chapter);
  }

  /**
   * Parse text content to extract establishments
   *
   * HMS listings often follow patterns like:
   * Business Name
   * 123 Street Address
   * City, State ZIP
   * Phone: (xxx) xxx-xxxx
   */
  private parseTextContent(
    text: string,
    chapter: RegionalChapter
  ): ScrapedEstablishment[] {
    const results: ScrapedEstablishment[] = [];
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    let currentBusiness: Partial<ScrapedEstablishment> | null = null;
    let lineBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip navigation/header lines
      if (this.isHeaderLine(line)) {
        continue;
      }

      // Check if this is an address line (starts with number)
      const isAddress = /^\d+\s+\w+/.test(line);

      // Check if this is a city/state/zip line
      const cityStateMatch = line.match(/^(.+?),\s*([A-Z]{2})\s*(\d{5})?/);

      // Check if this is a phone line
      const phoneMatch = line.match(
        /(?:Phone:?\s*)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i
      );

      // Check if this looks like a county/state label
      const countyMatch = line.match(/^(?:County|State|City):\s*(.+)/i);

      if (cityStateMatch && currentBusiness?.name) {
        // This is a city/state/zip line - complete the current business
        currentBusiness.city = cityStateMatch[1].trim();
        currentBusiness.state = cityStateMatch[2];
        if (cityStateMatch[3]) {
          currentBusiness.postalCode = cityStateMatch[3];
        }

        // Check next line for phone
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextPhone = nextLine.match(
            /(?:Phone:?\s*)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i
          );
          if (nextPhone) {
            currentBusiness.phone = nextPhone[0].replace(/Phone:?\s*/i, "");
            i++; // Skip phone line
          }
        }

        // Save business
        if (currentBusiness.name && currentBusiness.address) {
          results.push({
            name: currentBusiness.name,
            address: currentBusiness.address,
            city: currentBusiness.city || chapter.defaultCity || "Unknown",
            state: currentBusiness.state || chapter.state,
            postalCode: currentBusiness.postalCode || undefined,
            country: "USA",
            phone: currentBusiness.phone,
            category: "restaurant",
            region: chapter.region,
            certificationBody: "HMS",
            sourceUrl: chapter.url,
          });
        }

        currentBusiness = null;
        lineBuffer = [];
      } else if (isAddress && currentBusiness?.name) {
        // This is an address line
        currentBusiness.address = line;
      } else if (phoneMatch && currentBusiness) {
        // This is a phone line
        currentBusiness.phone = phoneMatch[0].replace(/Phone:?\s*/i, "");
      } else if (countyMatch && currentBusiness) {
        // County or state label - might help with location
        // Skip for now
      } else if (
        line.length > 3 &&
        line.length < 100 &&
        !line.includes("@") &&
        !this.isMetadataLine(line)
      ) {
        // This might be a business name
        // Save previous business if exists
        if (currentBusiness?.name && currentBusiness.address) {
          results.push({
            name: currentBusiness.name,
            address: currentBusiness.address,
            city: currentBusiness.city || chapter.defaultCity || "Unknown",
            state: currentBusiness.state || chapter.state,
            postalCode: currentBusiness.postalCode || undefined,
            country: "USA",
            phone: currentBusiness.phone,
            category: "restaurant",
            region: chapter.region,
            certificationBody: "HMS",
            sourceUrl: chapter.url,
          });
        }

        // Start new business
        currentBusiness = {
          name: line,
          state: chapter.state,
        };
        lineBuffer = [line];
      }
    }

    // Don't forget the last business
    if (currentBusiness?.name && currentBusiness.address) {
      results.push({
        name: currentBusiness.name,
        address: currentBusiness.address,
        city: currentBusiness.city || chapter.defaultCity || "Unknown",
        state: currentBusiness.state || chapter.state,
        postalCode: currentBusiness.postalCode || undefined,
        country: "USA",
        phone: currentBusiness.phone,
        category: "restaurant",
        region: chapter.region,
        certificationBody: "HMS",
        sourceUrl: chapter.url,
      });
    }

    return results;
  }

  /**
   * Check if a line is a header/navigation line to skip
   */
  private isHeaderLine(line: string): boolean {
    const headerPatterns = [
      /^home$/i,
      /^about/i,
      /^contact/i,
      /^menu$/i,
      /^search/i,
      /^login/i,
      /^register/i,
      /^sign in/i,
      /^certified/i,
      /^categories/i,
      /^filter/i,
      /^sort/i,
      /^show/i,
      /^hide/i,
      /^click/i,
      /^view/i,
      /^more/i,
      /^less/i,
      /^expand/i,
      /^collapse/i,
      /^\d+\s*results?/i,
      /^page\s*\d+/i,
      /^prev/i,
      /^next/i,
    ];

    return headerPatterns.some((pattern) => pattern.test(line));
  }

  /**
   * Check if a line is metadata (dates, counts, etc.) to skip
   */
  private isMetadataLine(line: string): boolean {
    const metadataPatterns = [
      /^last\s+updated/i,
      /^certified\s+(since|on)/i,
      /^expires?/i,
      /^valid\s+(until|through)/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // Date format
      /^\d{4}-\d{2}-\d{2}$/, // ISO date
      /^category:/i,
      /^type:/i,
      /^status:/i,
    ];

    return metadataPatterns.some((pattern) => pattern.test(line));
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

/**
 * Create and export HMS scraper instance
 */
export function createHMSScraper(verbose: boolean = false): HMSScraperSource {
  return new HMSScraperSource(verbose);
}

/**
 * Convenience function to scrape HMS directly
 */
export async function scrapeHMS(
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedEstablishment[]> {
  const scraper = createHMSScraper(config.verbose);
  return scraper.scrape({
    sources: ["hms"],
    ...config,
  });
}
