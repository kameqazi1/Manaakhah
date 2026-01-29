/**
 * Scraper Types
 *
 * Simplified type definitions for multi-source halal business scraping.
 * Focused on the core workflow: Scrape → ScrapedBusiness → Admin Review → Business
 */

import { BusinessCategory as PrismaBusinessCategory } from "@prisma/client";

// =============================================================================
// DATA SOURCES
// =============================================================================

/**
 * Supported data sources for scraping
 */
export type DataSource =
  | "hfsaa" // Halal Food Standards Alliance of America
  | "hms" // Halal Monitoring Services
  | "isna" // ISNA Halal Certification
  | "ifanca" // IFANCA Certification
  | "sanha" // SANHA (if US presence)
  | "zabihafinder" // ZabihaFinder community directory
  | "csv_import" // CSV file import
  | "json_import" // JSON file import
  | "manual"; // Manual entry

// Re-export BusinessCategory from Prisma for consistency
export type BusinessCategory = PrismaBusinessCategory;

// =============================================================================
// SCRAPER CONFIGURATION
// =============================================================================

/**
 * Configuration for running scrapers
 */
export interface ScraperConfig {
  /** Data sources to scrape */
  sources: DataSource[];

  /** Filter by geographic region (e.g., 'Bay Area', 'Chicago') */
  region?: string;

  /** Filter by state (e.g., 'CA', 'IL') */
  state?: string;

  /** Rate limit between requests in ms (default: 1000) */
  rateLimit?: number;

  /** Maximum results per source */
  maxResults?: number;

  /** Minimum confidence score to import (0-100) */
  minConfidence?: number;

  /** Skip geocoding step */
  skipGeocoding?: boolean;

  /** Skip duplicate checking */
  skipDuplicateCheck?: boolean;

  /** Dry run mode - don't save to database */
  dryRun?: boolean;

  /** Enable verbose logging */
  verbose?: boolean;
}

// =============================================================================
// SCRAPED DATA
// =============================================================================

/**
 * Raw establishment data scraped from a source.
 * This is the intermediate format before saving to ScrapedBusiness.
 */
export interface ScrapedEstablishment {
  /** Business name */
  name: string;

  /** Street address */
  address: string;

  /** City */
  city: string;

  /** State (2-letter abbreviation) */
  state: string;

  /** Postal/ZIP code */
  postalCode?: string;

  /** Country (default: 'USA') */
  country?: string;

  /** Phone number */
  phone?: string;

  /** Email address */
  email?: string;

  /** Website URL */
  website?: string;

  /** Business category (will be mapped to BusinessCategory enum) */
  category: string;

  /** Geographic region from source */
  region?: string;

  /** Latitude coordinate */
  latitude?: number;

  /** Longitude coordinate */
  longitude?: number;

  /** Halal certification number */
  certificationNumber?: string;

  /** Certifying body (e.g., 'HFSAA', 'HMS') */
  certificationBody?: string;

  /** Certification expiration date */
  certificationExpiry?: string;

  /** Products offered (for butchers/grocers) */
  products?: string[];

  /** Description or notes */
  description?: string;

  /** Source URL where data was found */
  sourceUrl: string;
}

// =============================================================================
// MUSLIM SIGNAL DETECTION
// =============================================================================

/**
 * Muslim/Islamic signal detected in business data
 */
export interface MuslimSignal {
  /** The keyword or pattern that matched */
  keyword: string;

  /** Context around the match */
  context: string;

  /** Weight/importance of this signal (higher = more confident) */
  weight: number;

  /** Where the signal was found */
  category: "name" | "description" | "certification" | "address" | "website";
}

/**
 * Result of Muslim signal analysis
 */
export interface SignalAnalysis {
  /** Confidence score (0-100) */
  score: number;

  /** Detected signals */
  signals: MuslimSignal[];

  /** Is this high confidence (score >= 50)? */
  isHighConfidence: boolean;
}

// =============================================================================
// SCRAPER RESULTS
// =============================================================================

/**
 * Error from scraping
 */
export interface ScraperError {
  /** Source that errored */
  source: DataSource;

  /** Error message */
  message: string;

  /** Error code if available */
  code?: string;

  /** Can this error be retried? */
  retryable?: boolean;
}

/**
 * Statistics for a scraper run
 */
export interface ScraperStats {
  /** Total establishments found */
  found: number;

  /** Successfully imported to database */
  imported: number;

  /** Skipped (duplicates, validation failures) */
  skipped: number;

  /** Errors encountered */
  errors: number;

  /** Successfully geocoded */
  geocoded: number;

  /** Failed geocoding */
  geocodeFailed: number;
}

/**
 * Result from running a scraper
 */
export interface ScraperResult {
  /** Did the scraper succeed? */
  success: boolean;

  /** Which source was scraped */
  source: DataSource;

  /** Establishments found */
  establishments: ScrapedEstablishment[];

  /** Statistics */
  stats: ScraperStats;

  /** Errors encountered */
  errors: ScraperError[];

  /** Processing duration in ms */
  duration: number;
}

// =============================================================================
// GEOCODING
// =============================================================================

/**
 * Result from geocoding an address
 */
export interface GeocodingResult {
  /** Latitude */
  latitude: number;

  /** Longitude */
  longitude: number;

  /** Formatted address from geocoder */
  formattedAddress?: string;

  /** Confidence in the result (0-100) */
  confidence: number;

  /** Source of the geocoding */
  source: "nominatim" | "mapbox" | "google" | "fallback";
}

// =============================================================================
// ADDRESS PARSING
// =============================================================================

/**
 * Parsed address components
 */
export interface ParsedAddress {
  /** Street address */
  street: string;

  /** City */
  city: string;

  /** State (2-letter) */
  state: string;

  /** ZIP/postal code */
  postalCode: string;

  /** Country */
  country: string;
}

/**
 * Default values for address parsing
 */
export interface AddressDefaults {
  city?: string;
  state?: string;
  country?: string;
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Result of duplicate checking
 */
export interface DuplicateCheck {
  /** Is this a duplicate? */
  isDuplicate: boolean;

  /** ID of the matching record */
  existingId?: string;

  /** Type of match */
  matchType?: "scraped" | "business";

  /** Field that matched */
  matchField?: "name_address" | "phone" | "name_city";
}

// =============================================================================
// IMPORT FORMATS
// =============================================================================

/**
 * Row format for CSV imports
 */
export interface CSVImportRow {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  category?: string;
  description?: string;
  tags?: string; // comma-separated
  latitude?: string;
  longitude?: string;
  [key: string]: string | undefined;
}

/**
 * Format for JSON imports
 */
export interface JSONImportData {
  businesses: Partial<ScrapedEstablishment>[];
  source?: string;
  importedAt?: string;
}

// =============================================================================
// REGIONAL CHAPTER CONFIGURATION
// =============================================================================

/**
 * Configuration for a regional chapter/page to scrape
 */
export interface RegionalChapter {
  /** Region name (e.g., 'Bay Area', 'Chicago') */
  region: string;

  /** URL to scrape */
  url: string;

  /** Default state for this region */
  state: string;

  /** Default city if not specified in data */
  defaultCity?: string;
}

// =============================================================================
// LOGGER
// =============================================================================

/**
 * Simple logger interface for scrapers
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
