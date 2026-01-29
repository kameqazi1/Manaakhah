/**
 * Scraper Sources Index
 *
 * Registry of all available scraper sources and exports.
 */

import type { DataSource, ScraperConfig, ScrapedEstablishment } from "../types";
import type { ScraperSource } from "./base";

// Import scraper classes
import { HFSAAScraperSource, createHFSAAScraper, scrapeHFSAA } from "./hfsaa";
import { HMSScraperSource, createHMSScraper, scrapeHMS } from "./hms";
import { ZabihahScraperSource, createZabihahScraper, scrapeZabihah } from "./zabihah";
import { IFANCAScraperSource, createIFANCAScraper, scrapeIFANCA } from "./ifanca";

// =============================================================================
// SCRAPER REGISTRY
// =============================================================================

/**
 * Registry of all available scraper sources
 */
export const SCRAPER_SOURCES: Record<DataSource, () => ScraperSource> = {
  // Implemented scrapers
  hfsaa: () => new HFSAAScraperSource(),
  hms: () => new HMSScraperSource(),
  zabihah: () => new ZabihahScraperSource(),
  ifanca: () => new IFANCAScraperSource(),

  // Placeholder sources - not yet implemented
  isna: () => {
    throw new Error("ISNA scraper not yet implemented - ISNA doesn't have a public certification directory");
  },
  sanha: () => {
    throw new Error("SANHA is South African only - not relevant for US directory");
  },

  // Import sources - handled separately
  csv_import: () => {
    throw new Error("CSV import should use the import module");
  },
  json_import: () => {
    throw new Error("JSON import should use the import module");
  },
  manual: () => {
    throw new Error("Manual source has no scraper");
  },
};

/**
 * Get a scraper instance by source name
 */
export function getScraperSource(
  source: DataSource,
  verbose: boolean = false
): ScraperSource {
  const factory = SCRAPER_SOURCES[source];
  if (!factory) {
    throw new Error(`Unknown scraper source: ${source}`);
  }

  const scraper = factory();
  if (verbose && "logger" in scraper) {
    // If we want to enable verbose on existing instance, recreate with verbose
    if (source === "hfsaa") return createHFSAAScraper(verbose);
    if (source === "hms") return createHMSScraper(verbose);
    if (source === "zabihah") return createZabihahScraper(verbose);
    if (source === "ifanca") return createIFANCAScraper(verbose);
  }
  return scraper;
}

/**
 * Get all implemented scraper sources
 */
export function getImplementedSources(): DataSource[] {
  return ["hfsaa", "hms", "zabihah", "ifanca"];
}

/**
 * Check if a source is implemented
 */
export function isSourceImplemented(source: DataSource): boolean {
  return getImplementedSources().includes(source);
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Base classes
export { BaseScraperSource, BrowserScraperSource, StaticScraperSource } from "./base";
export type { ScraperSource } from "./base";

// HFSAA
export { HFSAAScraperSource, createHFSAAScraper, scrapeHFSAA };

// HMS
export { HMSScraperSource, createHMSScraper, scrapeHMS };

// Zabihah
export { ZabihahScraperSource, createZabihahScraper, scrapeZabihah };

// IFANCA
export { IFANCAScraperSource, createIFANCAScraper, scrapeIFANCA };

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Scrape from a single source
 */
export async function scrapeSource(
  source: DataSource,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedEstablishment[]> {
  if (!isSourceImplemented(source)) {
    throw new Error(`Scraper for ${source} is not yet implemented`);
  }

  const scraper = getScraperSource(source, config.verbose);
  return scraper.scrape({
    sources: [source],
    ...config,
  });
}

/**
 * Get source metadata
 */
export function getSourceMetadata(source: DataSource): {
  name: DataSource;
  displayName: string;
  description: string;
  requiresBrowser: boolean;
  implemented: boolean;
} {
  const implemented = isSourceImplemented(source);

  if (!implemented) {
    const displayNames: Record<DataSource, string> = {
      hfsaa: "HFSAA",
      hms: "HMS",
      isna: "ISNA",
      ifanca: "IFANCA",
      sanha: "SANHA",
      zabihah: "Zabihah",
      csv_import: "CSV Import",
      json_import: "JSON Import",
      manual: "Manual Entry",
    };

    const descriptions: Record<DataSource, string> = {
      hfsaa: "HFSAA certified establishments",
      hms: "HMS certified establishments",
      isna: "ISNA (no public directory available)",
      ifanca: "IFANCA certified manufacturers",
      sanha: "SANHA (South African only)",
      zabihah: "Zabihah.com halal restaurant guide",
      csv_import: "CSV file import",
      json_import: "JSON file import",
      manual: "Manual entry",
    };

    return {
      name: source,
      displayName: displayNames[source] || source,
      description: descriptions[source] || `${displayNames[source]} scraper`,
      requiresBrowser: false,
      implemented: false,
    };
  }

  const scraper = getScraperSource(source);
  return {
    name: scraper.name,
    displayName: scraper.displayName,
    description: scraper.description,
    requiresBrowser: scraper.requiresBrowser,
    implemented: true,
  };
}
