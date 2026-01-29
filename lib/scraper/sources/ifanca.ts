/**
 * IFANCA (Islamic Food and Nutrition Council of America) Scraper
 *
 * Scrapes certified company listings from IFANCA.org.
 * Note: IFANCA primarily certifies manufacturers and products, not retail locations.
 * This scraper is useful for understanding the supply chain of halal products.
 *
 * IFANCA website: https://ifanca.org/certified-companies/
 */

import { StaticScraperSource } from "./base";
import type {
  ScraperConfig,
  ScrapedEstablishment,
} from "../types";

// =============================================================================
// IFANCA SCRAPER
// =============================================================================

export class IFANCAScraperSource extends StaticScraperSource {
  name = "ifanca" as const;
  displayName = "IFANCA";
  description = "IFANCA certified companies (manufacturers/processors)";

  /**
   * Main scrape method
   */
  async scrape(config: ScraperConfig): Promise<ScrapedEstablishment[]> {
    const startTime = Date.now();
    const establishments: ScrapedEstablishment[] = [];

    this.logger.info("Scraping IFANCA certified companies...");

    try {
      const html = await this.fetchHtml("https://ifanca.org/certified-companies/");
      const $ = await this.loadCheerio(html);

      // IFANCA has a table with Company, Country, Product Type columns
      const rows = $("table tbody tr");

      this.logger.info(`Found ${rows.length} companies in table`);

      rows.each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 3) return;

        const company = $(cells[0]).text().trim();
        const country = $(cells[1]).text().trim();
        const productType = $(cells[2]).text().trim();

        // Only include US companies or skip country filter if not specified
        if (config.state) {
          // If state filter is specified, only include USA companies
          if (!country.toLowerCase().includes("united states") &&
              !country.toLowerCase().includes("usa") &&
              country.toLowerCase() !== "us") {
            return;
          }
        }

        // Skip empty rows
        if (!company || company.length < 2) return;

        // Map product type to category
        const category = this.mapProductTypeToCategory(productType);

        establishments.push({
          name: company,
          address: "See IFANCA website for details",
          city: "",
          state: "",
          country: country,
          category,
          description: `Product types: ${productType}`,
          certificationBody: "IFANCA",
          sourceUrl: "https://ifanca.org/certified-companies/",
        });
      });

      // Apply max results limit
      if (config.maxResults && establishments.length > config.maxResults) {
        return establishments.slice(0, config.maxResults);
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Completed IFANCA scraping in ${(duration / 1000).toFixed(1)}s`
      );
      this.logger.info(`Total companies found: ${establishments.length}`);

      return establishments;
    } catch (error) {
      this.logger.error("Error scraping IFANCA:", error);
      throw error;
    }
  }

  /**
   * Map IFANCA product types to our category enum
   */
  private mapProductTypeToCategory(productType: string): string {
    const type = productType.toLowerCase();

    if (type.includes("restaurant") || type.includes("food service")) {
      return "restaurant";
    }
    if (type.includes("butcher") || type.includes("meat") || type.includes("poultry")) {
      return "butcher";
    }
    if (type.includes("grocery") || type.includes("retail")) {
      return "grocery";
    }
    if (type.includes("bakery") || type.includes("confection")) {
      return "cafe";
    }

    // Most IFANCA companies are food processors/manufacturers
    return "food_production";
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

/**
 * Create and export IFANCA scraper instance
 */
export function createIFANCAScraper(
  verbose: boolean = false
): IFANCAScraperSource {
  return new IFANCAScraperSource(verbose);
}

/**
 * Convenience function to scrape IFANCA directly
 */
export async function scrapeIFANCA(
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedEstablishment[]> {
  const scraper = createIFANCAScraper(config.verbose);
  return scraper.scrape({
    sources: ["ifanca"],
    ...config,
  });
}
