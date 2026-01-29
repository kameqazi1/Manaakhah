/**
 * Scraper Utilities
 *
 * Shared utility functions for scraping operations:
 * - Address parsing and normalization
 * - Phone/website normalization
 * - Geocoding (Nominatim-based)
 * - Duplicate detection
 * - Slug generation
 * - Rate limiting
 */

import type {
  ParsedAddress,
  AddressDefaults,
  GeocodingResult,
  DuplicateCheck,
  ScrapedEstablishment,
  Logger,
} from "./types";
import { db } from "@/lib/db";

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Create a simple console logger
 *
 * @param verbose - Enable debug logging
 * @returns Logger instance
 */
export function createLogger(verbose: boolean = false): Logger {
  return {
    info: (message: string, ...args: unknown[]) => {
      console.log(`[INFO] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[WARN] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[ERROR] ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      if (verbose) {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    },
  };
}

// =============================================================================
// SLUG GENERATION
// =============================================================================

/**
 * Generate a URL-friendly slug from text
 *
 * @param text - Text to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Generate a unique slug, checking against existing records
 *
 * @param name - Business name to slugify
 * @param checkFn - Function to check if slug exists
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  name: string,
  checkFn: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await checkFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// =============================================================================
// ADDRESS PARSING
// =============================================================================

/**
 * Parse a full address string into components
 *
 * @param fullAddress - Full address string
 * @param defaults - Default values for missing components
 * @returns Parsed address components
 */
export function parseAddress(
  fullAddress: string,
  defaults: AddressDefaults = {}
): ParsedAddress {
  const result: ParsedAddress = {
    street: fullAddress.trim(),
    city: defaults.city || "",
    state: defaults.state || "",
    postalCode: "",
    country: defaults.country || "USA",
  };

  if (!fullAddress) {
    return result;
  }

  // Extract ZIP code
  const zipMatch = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    result.postalCode = zipMatch[1];
  }

  // Split by comma or newline
  const parts = fullAddress
    .split(/[,\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    // Format: Street, City, State ZIP
    result.street = parts[0];
    result.city = parts[1];

    // Extract state from last part (may contain ZIP)
    const stateMatch = parts[2].match(/([A-Z]{2})\s*(\d{5})?/);
    if (stateMatch) {
      result.state = stateMatch[1];
      if (stateMatch[2]) {
        result.postalCode = stateMatch[2];
      }
    }
  } else if (parts.length === 2) {
    // Format: Street, City State ZIP
    result.street = parts[0];

    const cityStateMatch = parts[1].match(/^(.+?)\s+([A-Z]{2})\s*(\d{5})?/);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
      result.state = cityStateMatch[2];
      if (cityStateMatch[3]) {
        result.postalCode = cityStateMatch[3];
      }
    } else {
      // Just city, no state
      result.city = parts[1].replace(/\d{5}(-\d{4})?/, "").trim();
    }
  }

  // Apply defaults for missing values
  if (!result.city && defaults.city) {
    result.city = defaults.city;
  }
  if (!result.state && defaults.state) {
    result.state = defaults.state;
  }

  return result;
}

/**
 * Extract ZIP code from an address string
 *
 * @param address - Address string
 * @returns ZIP code or null
 */
export function extractZipFromAddress(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

// =============================================================================
// PHONE NORMALIZATION
// =============================================================================

/**
 * Normalize a phone number to (XXX) XXX-XXXX format
 *
 * @param phone - Phone number string
 * @returns Normalized phone number
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";

  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // US phone number (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // With country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if can't parse
  return phone;
}

/**
 * Extract phone number from text
 *
 * @param text - Text containing phone number
 * @returns Extracted and normalized phone or null
 */
export function extractPhone(text: string): string | null {
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? normalizePhone(matches[0]) : null;
}

// =============================================================================
// WEBSITE NORMALIZATION
// =============================================================================

/**
 * Normalize a website URL
 *
 * @param url - Website URL
 * @returns Normalized URL with https:// and no trailing slash
 */
export function normalizeWebsite(url: string): string {
  if (!url) return "";

  let normalized = url.trim().toLowerCase();

  // Add protocol if missing
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  return normalized;
}

// =============================================================================
// EMAIL UTILITIES
// =============================================================================

/**
 * Validate email format
 *
 * @param email - Email address
 * @returns True if valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract email from text
 *
 * @param text - Text containing email
 * @returns Extracted email or null
 */
export function extractEmail(text: string): string | null {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

// =============================================================================
// GEOCODING
// =============================================================================

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 *
 * Rate limit: 1 request per second (enforced by caller)
 *
 * @param address - Street address
 * @param city - City
 * @param state - State
 * @param postalCode - ZIP code (optional)
 * @returns Geocoding result or null
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  postalCode?: string
): Promise<GeocodingResult | null> {
  // Build query parts
  const parts = [address, city, state, postalCode, "USA"].filter(Boolean);
  const query = encodeURIComponent(parts.join(", "));

  try {
    // Try full address first
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Manaakhah/1.0 (Muslim business directory)",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
          confidence: 90,
          source: "nominatim",
        };
      }
    }

    // Fallback: try city + state only
    const fallbackQuery = encodeURIComponent(`${city}, ${state}, USA`);
    const fallbackResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Manaakhah/1.0 (Muslim business directory)",
        },
      }
    );

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      if (fallbackData && fallbackData.length > 0) {
        return {
          latitude: parseFloat(fallbackData[0].lat),
          longitude: parseFloat(fallbackData[0].lon),
          formattedAddress: fallbackData[0].display_name,
          confidence: 60, // Lower confidence for city-level
          source: "nominatim",
        };
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  // Final fallback: use known city coordinates
  const cityCoords = getCityFallbackCoordinates(city, state);
  if (cityCoords) {
    return {
      latitude: cityCoords.lat,
      longitude: cityCoords.lng,
      formattedAddress: `${city}, ${state}`,
      confidence: 40,
      source: "fallback",
    };
  }

  return null;
}

/**
 * Get fallback coordinates for known cities
 */
function getCityFallbackCoordinates(
  city: string,
  state: string
): { lat: number; lng: number } | null {
  const cityKey = `${city.toLowerCase()}, ${state.toLowerCase()}`;

  const knownCities: Record<string, { lat: number; lng: number }> = {
    // California - Bay Area
    "fremont, ca": { lat: 37.5485, lng: -121.9886 },
    "san jose, ca": { lat: 37.3382, lng: -121.8863 },
    "san francisco, ca": { lat: 37.7749, lng: -122.4194 },
    "oakland, ca": { lat: 37.8044, lng: -122.2712 },
    "hayward, ca": { lat: 37.6688, lng: -122.0808 },
    "union city, ca": { lat: 37.5934, lng: -122.0438 },
    "newark, ca": { lat: 37.5297, lng: -122.0402 },
    "milpitas, ca": { lat: 37.4323, lng: -121.8996 },
    "sunnyvale, ca": { lat: 37.3688, lng: -122.0363 },
    "santa clara, ca": { lat: 37.3541, lng: -121.9552 },

    // California - LA Area
    "los angeles, ca": { lat: 34.0522, lng: -118.2437 },
    "anaheim, ca": { lat: 33.8366, lng: -117.9143 },
    "irvine, ca": { lat: 33.6846, lng: -117.8265 },

    // Illinois
    "chicago, il": { lat: 41.8781, lng: -87.6298 },

    // Texas
    "houston, tx": { lat: 29.7604, lng: -95.3698 },
    "dallas, tx": { lat: 32.7767, lng: -96.797 },

    // New York
    "new york, ny": { lat: 40.7128, lng: -74.006 },

    // Michigan
    "dearborn, mi": { lat: 42.3223, lng: -83.1763 },
    "detroit, mi": { lat: 42.3314, lng: -83.0458 },

    // New Jersey
    "paterson, nj": { lat: 40.9168, lng: -74.1718 },
    "jersey city, nj": { lat: 40.7178, lng: -74.0431 },
  };

  return knownCities[cityKey] || null;
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Check for duplicate in both ScrapedBusiness and Business tables
 *
 * @param establishment - Establishment to check
 * @returns Duplicate check result
 */
export async function checkForDuplicateInDatabase(
  establishment: Partial<ScrapedEstablishment>
): Promise<DuplicateCheck> {
  // Build OR conditions for ScrapedBusiness check
  const scrapedConditions: Array<Record<string, unknown>> = [];

  if (establishment.name && establishment.address) {
    scrapedConditions.push({
      name: { equals: establishment.name, mode: "insensitive" },
      address: { equals: establishment.address, mode: "insensitive" },
    });
  }

  if (establishment.phone) {
    const normalizedPhone = establishment.phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 10) {
      scrapedConditions.push({ phone: normalizePhone(establishment.phone) });
    }
  }

  // Check ScrapedBusiness table first
  if (scrapedConditions.length > 0) {
    const existingScraped = await db.scrapedBusiness.findFirst({
      where: { OR: scrapedConditions },
      select: { id: true, name: true, phone: true },
    });

    if (existingScraped) {
      const matchField =
        existingScraped.phone === normalizePhone(establishment.phone || "")
          ? "phone"
          : "name_address";
      return {
        isDuplicate: true,
        existingId: existingScraped.id,
        matchType: "scraped",
        matchField,
      };
    }
  }

  // Build OR conditions for Business table check
  const businessConditions: Array<Record<string, unknown>> = [];

  if (establishment.name && establishment.city) {
    businessConditions.push({
      name: { contains: establishment.name, mode: "insensitive" },
      city: { equals: establishment.city, mode: "insensitive" },
    });
  }

  if (establishment.phone) {
    const normalizedPhone = establishment.phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 10) {
      businessConditions.push({ phone: normalizePhone(establishment.phone) });
    }
  }

  // Check Business table
  if (businessConditions.length > 0) {
    const existingBusiness = await db.business.findFirst({
      where: { OR: businessConditions },
      select: { id: true, name: true, phone: true },
    });

    if (existingBusiness) {
      const matchField =
        existingBusiness.phone === normalizePhone(establishment.phone || "")
          ? "phone"
          : "name_city";
      return {
        isDuplicate: true,
        existingId: existingBusiness.id,
        matchType: "business",
        matchField,
      };
    }
  }

  return { isDuplicate: false };
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

import { BusinessCategory } from "@prisma/client";

/**
 * Map a source category string to BusinessCategory enum
 *
 * @param category - Source category string
 * @returns BusinessCategory enum value
 */
export function mapCategory(category: string): BusinessCategory {
  const categoryMap: Record<string, BusinessCategory> = {
    // Restaurant variants
    restaurant: "RESTAURANT",
    restaurants: "RESTAURANT",
    "food service": "RESTAURANT",
    cafe: "RESTAURANT",
    diner: "RESTAURANT",

    // Butcher variants
    butcher: "BUTCHER",
    butcheries: "BUTCHER",
    "meat shop": "BUTCHER",
    "meat market": "BUTCHER",

    // Grocery variants
    grocery: "GROCERY",
    groceries: "GROCERY",
    supermarket: "GROCERY",
    market: "GROCERY",

    // Bakery
    bakery: "BAKERY",
    bakeries: "BAKERY",

    // Catering
    catering: "CATERING",

    // Food truck
    "food truck": "FOOD_TRUCK",
    "food cart": "FOOD_TRUCK",

    // General halal food
    "halal food": "HALAL_FOOD",
    halal: "HALAL_FOOD",
    general: "HALAL_FOOD",
  };

  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || "HALAL_FOOD";
}

// =============================================================================
// EXPORTS (re-export types for convenience)
// =============================================================================

export type { AddressDefaults } from "./types";
