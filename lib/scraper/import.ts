/**
 * Bulk Import Module
 *
 * Handles importing business data from CSV and JSON files
 * into the ScrapedBusiness table for admin review.
 */

import { db } from "@/lib/db";
import type {
  DataSource,
  ScraperConfig,
  ScrapedEstablishment,
  ScraperResult,
  ScraperStats,
  ScraperError,
} from "./types";
import { analyzeMuslimSignals, calculateConfidenceScore } from "./signals";
import {
  geocodeAddress,
  normalizePhone,
  normalizeWebsite,
  parseAddress,
  mapCategory,
  generateUniqueSlug,
  sleep,
  createLogger,
  checkForDuplicateInDatabase,
} from "./utils";

// =============================================================================
// CSV IMPORT
// =============================================================================

/**
 * CSV row structure for import
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
  latitude?: string | number;
  longitude?: string | number;
}

/**
 * Import businesses from CSV data
 *
 * @param rows - Array of CSV rows to import
 * @param config - Import configuration options
 * @returns Import result with stats and errors
 */
export async function importFromCSV(
  rows: CSVImportRow[],
  config: Partial<ScraperConfig> = {}
): Promise<ScraperResult> {
  const logger = createLogger(config.verbose);
  const startTime = Date.now();
  const establishments: ScrapedEstablishment[] = [];
  const errors: ScraperError[] = [];
  const stats: ScraperStats = {
    found: rows.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    geocoded: 0,
    geocodeFailed: 0,
  };

  logger.info(`Importing ${rows.length} rows from CSV...`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Validate required fields
      if (!row.name?.trim()) {
        errors.push({
          source: "csv_import",
          message: `Row ${i + 1}: Missing required field 'name'`,
          retryable: false,
        });
        stats.errors++;
        continue;
      }

      if (!row.city?.trim() || !row.state?.trim()) {
        errors.push({
          source: "csv_import",
          message: `Row ${i + 1} (${row.name}): Missing required city or state`,
          retryable: false,
        });
        stats.errors++;
        continue;
      }

      // Check for duplicates
      if (!config.skipDuplicateCheck) {
        const duplicateCheck = await checkForDuplicateInDatabase({
          name: row.name,
          address: row.address,
          city: row.city,
          state: row.state,
          phone: row.phone,
        });

        if (duplicateCheck.isDuplicate) {
          stats.skipped++;
          logger.debug(`  Skipped duplicate: ${row.name}`);
          continue;
        }
      }

      // Analyze Muslim signals
      const combinedText = `${row.name} ${row.description || ""}`;
      const signalAnalysis = analyzeMuslimSignals(combinedText, row.name);
      const confidence = calculateConfidenceScore(signalAnalysis);

      // Geocode if coordinates not provided
      let latitude = row.latitude ? parseFloat(String(row.latitude)) : undefined;
      let longitude = row.longitude ? parseFloat(String(row.longitude)) : undefined;

      if (!config.skipGeocoding && (!latitude || !longitude)) {
        const geocodeResult = await geocodeAddress(
          row.address || "",
          row.city,
          row.state,
          row.zipCode
        );

        if (geocodeResult) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          stats.geocoded++;
          logger.debug(`  Geocoded: ${row.name}`);
        } else {
          stats.geocodeFailed++;
          logger.debug(`  Geocode failed: ${row.name}`);
        }

        // Rate limit (Nominatim requires 1 req/sec)
        await sleep(1100);
      }

      // Map category
      const category = mapCategory(row.category || "other");

      // Build establishment
      const establishment: ScrapedEstablishment = {
        name: row.name.trim(),
        address: row.address?.trim() || "",
        city: row.city.trim(),
        state: row.state.trim().toUpperCase(),
        postalCode: row.zipCode?.trim(),
        country: "USA",
        phone: row.phone ? normalizePhone(row.phone) : undefined,
        email: row.email?.trim(),
        website: row.website ? normalizeWebsite(row.website) : undefined,
        category: category,
        description: row.description?.trim(),
        latitude,
        longitude,
        sourceUrl: "csv_import",
      };

      // Save to database
      await saveImportedBusiness({
        establishment,
        source: "csv_import",
        confidence,
        signals: signalAnalysis.signals,
        tags: row.tags?.split(",").map((t) => t.trim()).filter(Boolean),
      });

      establishments.push(establishment);
      stats.imported++;
      logger.debug(`  Imported: ${row.name}`);
    } catch (error) {
      errors.push({
        source: "csv_import",
        message: `Row ${i + 1} (${row.name}): ${
          error instanceof Error ? error.message : String(error)
        }`,
        retryable: false,
      });
      stats.errors++;
    }
  }

  logger.info(`CSV import complete: ${stats.imported} imported, ${stats.skipped} skipped, ${stats.errors} errors`);

  return {
    success: stats.imported > 0 || stats.errors === 0,
    source: "csv_import",
    establishments,
    stats,
    errors,
    duration: Date.now() - startTime,
  };
}

// =============================================================================
// JSON IMPORT
// =============================================================================

/**
 * JSON import data structure
 */
export interface JSONImportData {
  source?: string;
  businesses: Partial<ScrapedEstablishment>[];
}

/**
 * Import businesses from JSON data
 *
 * @param data - JSON data containing businesses array
 * @param config - Import configuration options
 * @returns Import result with stats and errors
 */
export async function importFromJSON(
  data: JSONImportData,
  config: Partial<ScraperConfig> = {}
): Promise<ScraperResult> {
  const logger = createLogger(config.verbose);
  const startTime = Date.now();
  const establishments: ScrapedEstablishment[] = [];
  const errors: ScraperError[] = [];
  const stats: ScraperStats = {
    found: data.businesses.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    geocoded: 0,
    geocodeFailed: 0,
  };

  logger.info(`Importing ${data.businesses.length} businesses from JSON...`);

  for (let i = 0; i < data.businesses.length; i++) {
    const item = data.businesses[i];

    try {
      // Validate required fields
      if (!item.name?.trim()) {
        errors.push({
          source: "json_import",
          message: `Item ${i + 1}: Missing required field 'name'`,
          retryable: false,
        });
        stats.errors++;
        continue;
      }

      if (!item.city?.trim() || !item.state?.trim()) {
        errors.push({
          source: "json_import",
          message: `Item ${i + 1} (${item.name}): Missing required city or state`,
          retryable: false,
        });
        stats.errors++;
        continue;
      }

      // Check for duplicates
      if (!config.skipDuplicateCheck) {
        const duplicateCheck = await checkForDuplicateInDatabase({
          name: item.name,
          address: item.address,
          city: item.city,
          state: item.state,
          phone: item.phone,
        });

        if (duplicateCheck.isDuplicate) {
          stats.skipped++;
          logger.debug(`  Skipped duplicate: ${item.name}`);
          continue;
        }
      }

      // Analyze Muslim signals
      const combinedText = `${item.name} ${item.description || ""}`;
      const signalAnalysis = analyzeMuslimSignals(combinedText, item.name);
      const confidence = calculateConfidenceScore(
        signalAnalysis,
        item.certificationBody
      );

      // Geocode if needed
      let latitude = item.latitude;
      let longitude = item.longitude;

      if (!config.skipGeocoding && (!latitude || !longitude)) {
        const geocodeResult = await geocodeAddress(
          item.address || "",
          item.city,
          item.state,
          item.postalCode
        );

        if (geocodeResult) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          stats.geocoded++;
          logger.debug(`  Geocoded: ${item.name}`);
        } else {
          stats.geocodeFailed++;
          logger.debug(`  Geocode failed: ${item.name}`);
        }

        // Rate limit
        await sleep(1100);
      }

      // Map category
      const category = mapCategory(item.category || "other");

      // Build establishment
      const establishment: ScrapedEstablishment = {
        name: item.name.trim(),
        address: item.address?.trim() || "",
        city: item.city.trim(),
        state: item.state.trim().toUpperCase(),
        postalCode: item.postalCode?.trim(),
        country: item.country || "USA",
        phone: item.phone ? normalizePhone(item.phone) : undefined,
        email: item.email?.trim(),
        website: item.website ? normalizeWebsite(item.website) : undefined,
        category,
        description: item.description?.trim(),
        region: item.region,
        latitude,
        longitude,
        certificationBody: item.certificationBody,
        certificationExpiry: item.certificationExpiry,
        sourceUrl: data.source || "json_import",
      };

      // Save to database
      await saveImportedBusiness({
        establishment,
        source: "json_import",
        confidence,
        signals: signalAnalysis.signals,
      });

      establishments.push(establishment);
      stats.imported++;
      logger.debug(`  Imported: ${item.name}`);
    } catch (error) {
      errors.push({
        source: "json_import",
        message: `Item ${i + 1} (${item.name}): ${
          error instanceof Error ? error.message : String(error)
        }`,
        retryable: false,
      });
      stats.errors++;
    }
  }

  logger.info(`JSON import complete: ${stats.imported} imported, ${stats.skipped} skipped, ${stats.errors} errors`);

  return {
    success: stats.imported > 0 || stats.errors === 0,
    source: "json_import",
    establishments,
    stats,
    errors,
    duration: Date.now() - startTime,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Save imported business to ScrapedBusiness table
 */
async function saveImportedBusiness(params: {
  establishment: ScrapedEstablishment;
  source: DataSource;
  confidence: number;
  signals: Array<{ keyword: string; weight: number; category: string; context: string }>;
  tags?: string[];
}): Promise<void> {
  const { establishment, source, confidence, signals, tags } = params;

  // Map category to BusinessCategory enum
  const category = mapCategory(establishment.category);

  await db.scrapedBusiness.create({
    data: {
      name: establishment.name,
      address: establishment.address,
      city: establishment.city,
      state: establishment.state,
      zipCode: establishment.postalCode || "",
      latitude: establishment.latitude ?? null,
      longitude: establishment.longitude ?? null,
      phone: establishment.phone || null,
      email: establishment.email || null,
      website: establishment.website || null,
      category: category as any,
      description: establishment.description || null,
      sourceUrl: establishment.sourceUrl,
      claimStatus: "PENDING_REVIEW",
      metadata: {
        source,
        confidence,
        signals,
        tags: tags || [],
        certificationBody: establishment.certificationBody || null,
        certificationExpiry: establishment.certificationExpiry || null,
        region: establishment.region || null,
        originalCategory: establishment.category,
      },
    },
  });
}

// =============================================================================
// CSV PARSING HELPERS
// =============================================================================

/**
 * Parse CSV content into rows
 *
 * Simple CSV parser that handles quoted fields and commas within quotes.
 */
export function parseCSV(content: string): CSVImportRow[] {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Map expected column names
  const columnMap: Record<string, keyof CSVImportRow> = {
    name: "name",
    business_name: "name",
    businessname: "name",
    address: "address",
    street: "address",
    street_address: "address",
    city: "city",
    state: "state",
    zip: "zipCode",
    zipcode: "zipCode",
    zip_code: "zipCode",
    postal_code: "zipCode",
    phone: "phone",
    phone_number: "phone",
    telephone: "phone",
    email: "email",
    email_address: "email",
    website: "website",
    url: "website",
    web: "website",
    category: "category",
    type: "category",
    business_type: "category",
    description: "description",
    about: "description",
    tags: "tags",
    latitude: "latitude",
    lat: "latitude",
    longitude: "longitude",
    lng: "longitude",
    lon: "longitude",
  };

  // Build column index map
  const indexToField: Map<number, keyof CSVImportRow> = new Map();
  headers.forEach((header, index) => {
    const field = columnMap[header];
    if (field) {
      indexToField.set(index, field);
    }
  });

  // Parse data rows
  const rows: CSVImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Partial<CSVImportRow> = {};

    indexToField.forEach((field, index) => {
      if (values[index] !== undefined) {
        (row as any)[field] = values[index].trim();
      }
    });

    // Only include rows with at least a name
    if (row.name) {
      rows.push(row as CSVImportRow);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate CSV import data
 *
 * Returns validation errors for preview before import.
 */
export function validateCSVData(rows: CSVImportRow[]): {
  valid: CSVImportRow[];
  errors: Array<{ row: number; field: string; message: string }>;
} {
  const valid: CSVImportRow[] = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];

    // Required: name
    if (!row.name?.trim()) {
      errors.push({
        row: index + 1,
        field: "name",
        message: "Name is required",
      });
      rowErrors.push("name");
    }

    // Required: city and state
    if (!row.city?.trim()) {
      errors.push({
        row: index + 1,
        field: "city",
        message: "City is required",
      });
      rowErrors.push("city");
    }

    if (!row.state?.trim()) {
      errors.push({
        row: index + 1,
        field: "state",
        message: "State is required",
      });
      rowErrors.push("state");
    } else if (row.state.trim().length !== 2) {
      errors.push({
        row: index + 1,
        field: "state",
        message: "State should be 2-letter abbreviation",
      });
      rowErrors.push("state");
    }

    // Optional validations
    if (row.email && !isValidEmail(row.email)) {
      errors.push({
        row: index + 1,
        field: "email",
        message: "Invalid email format",
      });
    }

    if (row.website && !isValidUrl(row.website)) {
      errors.push({
        row: index + 1,
        field: "website",
        message: "Invalid website URL",
      });
    }

    // If no critical errors, add to valid
    if (rowErrors.length === 0) {
      valid.push(row);
    }
  });

  return { valid, errors };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}
