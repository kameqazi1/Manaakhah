/**
 * Business Validation Module
 * Multi-signal validation to determine if a scraped entry is a real business
 */

import { ScrapedBusiness } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  isLikelyBusiness: boolean;
  confidence: number; // 0-100
  signals: ValidationSignal[];
  flags: string[]; // negative indicators found
}

export interface ValidationSignal {
  type: "positive" | "negative";
  signal: string;
  weight: number;
  context?: string;
}

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

// Residential address patterns (negative indicators)
const RESIDENTIAL_PATTERNS = [
  /\bapt\.?\s*#?\s*\d+/i,
  /\bunit\s*#?\s*\d+/i,
  /\b(suite|ste)\.?\s*(?!\d{3})\d{1,2}\b/i, // Suite 1-99, not Suite 100+
  /\bfloor\s*\d+/i,
  /\bbasement\b/i,
  /\bgarage\b/i,
];

// Business name indicator patterns (positive signals)
const BUSINESS_NAME_PATTERNS = [
  /\b(inc|llc|corp|ltd|co|company)\b/i,
  /\b(restaurant|cafe|grill|kitchen|market|grocery|store|shop|salon|center)\b/i,
  /\b(services|solutions|consulting|agency)\b/i,
  /\bmasjid\b/i,
  /\bmosque\b/i,
  /\b(clinic|pharmacy|dental|medical)\b/i,
  /\b(auto|repair|mechanic|garage)\b/i,
  /\b(law|legal|attorney)\b/i,
  /\b(accounting|tax|cpa)\b/i,
  /\b(insurance|realty|real estate)\b/i,
];

// Spam indicator patterns (strong negative signals)
const SPAM_PATTERNS = [
  /\b(work from home|earn money|get rich)\b/i,
  /\b(click here|visit now|limited time)\b/i,
  /\b(free|discount|deal)\s+(code|offer|special)\b/i,
  /\$\d+[kK]?\s*(per|a)\s*(month|week|day)/i,
  /\b(make money|passive income|side hustle)\b/i,
  /\b(no experience|easy money|guaranteed)\b/i,
];

// Generic name patterns (weak negative signals)
const GENERIC_NAME_PATTERNS = [
  /^(business|company|services?|store|shop)$/i,
  /^(new|the)\s+(business|company|store)$/i,
  /^[a-z]$/i, // Single letter
  /^(test|sample|example|demo)/i,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a business name is empty, missing, or malformed
 */
export function isEmptyOrMalformedName(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  if (/^\d+$/.test(trimmed)) return true; // Only numbers
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) return true; // Only special chars
  return false;
}

/**
 * Check if address contains residential indicators
 */
export function containsResidentialIndicators(address: string | null | undefined): boolean {
  if (!address) return false;
  return RESIDENTIAL_PATTERNS.some((pattern) => pattern.test(address));
}

/**
 * Check if name or description contains spam indicators
 */
export function containsSpamIndicators(
  name: string | null | undefined,
  description?: string | null
): boolean {
  const combined = `${name || ""} ${description || ""}`.toLowerCase();
  if (!combined.trim()) return false;
  return SPAM_PATTERNS.some((pattern) => pattern.test(combined));
}

/**
 * Check if name matches common business name patterns
 */
export function hasBusinessNamePattern(name: string | null | undefined): boolean {
  if (!name) return false;
  return BUSINESS_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Check if name is too generic to be a real business name
 */
export function isGenericName(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  if (trimmed.length < 3) return true;
  return GENERIC_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Validate phone number format (US 10-digit)
 */
export function isValidPhoneFormat(phone: string | null | undefined): boolean {
  if (!phone) return false;
  // Extract digits only
  const digits = phone.replace(/\D/g, "");
  // US phone: 10 digits, or 11 digits starting with 1
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return false;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Basic checks: must have a hostname with a dot
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Check if address appears to be a street address (not just city)
 */
function hasStreetAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // Look for street number + name pattern
  const streetPattern = /^\d+\s+[a-zA-Z]/;
  return streetPattern.test(address.trim());
}

/**
 * Check if description has meaningful content
 */
function hasDescription(description: string | null | undefined): boolean {
  if (!description) return false;
  // More than 10 characters of actual content
  return description.trim().length > 10;
}

/**
 * Check if email is present
 */
function hasEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  // Basic email pattern check
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate a scraped business entry to determine if it's likely a real business
 *
 * Scoring starts at base 50, then positive signals add points and negative signals subtract.
 * Final score is clamped to 0-100 range.
 *
 * @param scraped The scraped business record from database
 * @returns ValidationResult with confidence score and detailed signals
 */
export function validateBusinessEntry(scraped: ScrapedBusiness): ValidationResult {
  const signals: ValidationSignal[] = [];
  let score = 50; // Base score

  // =========================================================================
  // CRITICAL: Empty or malformed name check (-50 points)
  // =========================================================================
  if (isEmptyOrMalformedName(scraped.name)) {
    signals.push({
      type: "negative",
      signal: "empty_or_malformed_name",
      weight: -50,
      context: `Name: "${scraped.name || "(empty)"}"`,
    });
    score -= 50;
  }

  // =========================================================================
  // POSITIVE SIGNALS
  // =========================================================================

  // Valid phone format: +20 points
  if (isValidPhoneFormat(scraped.phone)) {
    signals.push({
      type: "positive",
      signal: "valid_phone",
      weight: 20,
      context: `Phone: ${scraped.phone}`,
    });
    score += 20;
  }

  // Has website URL: +15 points
  if (isValidUrl(scraped.website)) {
    signals.push({
      type: "positive",
      signal: "has_website",
      weight: 15,
      context: `Website: ${scraped.website}`,
    });
    score += 15;
  }

  // Has street address: +20 points
  if (hasStreetAddress(scraped.address)) {
    signals.push({
      type: "positive",
      signal: "valid_street_address",
      weight: 20,
      context: `Address: ${scraped.address}`,
    });
    score += 20;
  }

  // Business name pattern: +10 points
  if (hasBusinessNamePattern(scraped.name)) {
    signals.push({
      type: "positive",
      signal: "business_name_pattern",
      weight: 10,
      context: `Name matches business pattern`,
    });
    score += 10;
  }

  // Has description: +5 points
  if (hasDescription(scraped.description)) {
    signals.push({
      type: "positive",
      signal: "has_description",
      weight: 5,
      context: `Description: ${(scraped.description || "").substring(0, 50)}...`,
    });
    score += 5;
  }

  // Has email: +5 points
  if (hasEmail(scraped.email)) {
    signals.push({
      type: "positive",
      signal: "has_email",
      weight: 5,
      context: `Email: ${scraped.email}`,
    });
    score += 5;
  }

  // =========================================================================
  // NEGATIVE SIGNALS
  // =========================================================================

  // Residential address indicators: -30 points
  if (containsResidentialIndicators(scraped.address)) {
    signals.push({
      type: "negative",
      signal: "residential_address",
      weight: -30,
      context: `Address may be residential: ${scraped.address}`,
    });
    score -= 30;
  }

  // Spam indicators: -40 points
  if (containsSpamIndicators(scraped.name, scraped.description)) {
    signals.push({
      type: "negative",
      signal: "spam_indicators",
      weight: -40,
      context: `Name or description contains spam patterns`,
    });
    score -= 40;
  }

  // Generic name: -15 points
  if (isGenericName(scraped.name)) {
    signals.push({
      type: "negative",
      signal: "generic_name",
      weight: -15,
      context: `Name is too generic: "${scraped.name}"`,
    });
    score -= 15;
  }

  // Missing address: -20 points
  if (!scraped.address || scraped.address.trim().length === 0) {
    signals.push({
      type: "negative",
      signal: "missing_address",
      weight: -20,
      context: "No address provided",
    });
    score -= 20;
  }

  // Missing both phone AND website: -15 points
  if (!isValidPhoneFormat(scraped.phone) && !isValidUrl(scraped.website)) {
    signals.push({
      type: "negative",
      signal: "missing_contact",
      weight: -15,
      context: "No phone or website provided",
    });
    score -= 15;
  }

  // =========================================================================
  // CALCULATE FINAL RESULT
  // =========================================================================

  // Clamp score to 0-100 range
  const finalScore = Math.max(0, Math.min(100, score));

  // Extract flags from negative signals
  const flags = signals
    .filter((s) => s.type === "negative")
    .map((s) => s.signal);

  return {
    isLikelyBusiness: finalScore >= 60,
    confidence: finalScore,
    signals,
    flags,
  };
}
