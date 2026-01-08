/**
 * Scraping Utilities
 * Ethical scraping helpers with rate limiting and robots.txt respect
 */

export const MUSLIM_KEYWORDS = [
  "halal",
  "zabiha",
  "muslim",
  "islamic",
  "masjid",
  "mosque",
  "jummah",
  "salah",
  "prayer",
  "quran",
  "hijab",
  "ramadan",
  "eid",
  "bismillah",
  "assalam",
  "inshallah",
  "alhamdulillah",
];

export const HALAL_KEYWORDS = [
  "halal certified",
  "zabiha halal",
  "halal meat",
  "halal food",
  "hand slaughtered",
  "islamically slaughtered",
];

/**
 * Check if text contains Muslim-related keywords
 * Returns confidence score (0-100)
 */
export function analyzeMuslimSignals(text: string): {
  score: number;
  signals: string[];
} {
  const lowerText = text.toLowerCase();
  const foundSignals: string[] = [];
  let score = 0;

  // Check for keywords
  MUSLIM_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      foundSignals.push(keyword);

      // Weight certain keywords higher
      if (["halal", "zabiha", "masjid", "mosque"].includes(keyword)) {
        score += 20;
      } else if (["islamic", "muslim"].includes(keyword)) {
        score += 15;
      } else {
        score += 5;
      }
    }
  });

  // Cap score at 100
  score = Math.min(score, 100);

  return { score, signals: foundSignals };
}

/**
 * Determine business category from text
 */
export function categorizeB business(text: string, name: string): string {
  const combined = (text + " " + name).toLowerCase();

  if (
    combined.includes("masjid") ||
    combined.includes("mosque") ||
    combined.includes("islamic center")
  ) {
    return "MASJID";
  }

  if (
    combined.includes("restaurant") ||
    combined.includes("grill") ||
    combined.includes("cuisine") ||
    combined.includes("eatery")
  ) {
    return "RESTAURANT";
  }

  if (
    combined.includes("grocery") ||
    combined.includes("market") ||
    combined.includes("supermarket") ||
    (combined.includes("halal") && combined.includes("meat"))
  ) {
    return "HALAL_FOOD";
  }

  if (combined.includes("auto") && combined.includes("repair")) {
    return "AUTO_REPAIR";
  }

  if (combined.includes("barber") || combined.includes("salon")) {
    return "BARBER_SALON";
  }

  if (combined.includes("tutoring") || combined.includes("education")) {
    return "TUTORING";
  }

  if (combined.includes("legal") || combined.includes("lawyer")) {
    return "LEGAL_SERVICES";
  }

  if (
    combined.includes("accountant") ||
    combined.includes("cpa") ||
    combined.includes("tax")
  ) {
    return "ACCOUNTING";
  }

  return "OTHER";
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract services from description
 */
export function extractServices(text: string): string[] {
  const services: string[] = [];
  const lowerText = text.toLowerCase();

  // Common service patterns
  const servicePatterns = [
    { pattern: /oil change/i, service: "Oil Change" },
    { pattern: /brake/i, service: "Brake Service" },
    { pattern: /tire/i, service: "Tire Service" },
    { pattern: /buffet/i, service: "Buffet" },
    { pattern: /catering/i, service: "Catering" },
    { pattern: /takeout/i, service: "Takeout" },
    { pattern: /delivery/i, service: "Delivery" },
    { pattern: /dine-?in/i, service: "Dine-in" },
    { pattern: /prayer/i, service: "Prayer Space" },
    { pattern: /jummah/i, service: "Jummah Prayer" },
    { pattern: /weekend school/i, service: "Weekend School" },
    { pattern: /halal meat/i, service: "Halal Meat" },
    { pattern: /groceries/i, service: "Groceries" },
  ];

  servicePatterns.forEach(({ pattern, service }) => {
    if (pattern.test(lowerText)) {
      services.push(service);
    }
  });

  return services;
}

/**
 * Suggest tags based on content
 */
export function suggestTags(text: string, signals: string[]): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for Muslim-owned signals
  if (signals.length > 0) {
    tags.push("MUSLIM_OWNED");
  }

  // Check for halal verification
  if (
    lowerText.includes("halal certified") ||
    lowerText.includes("zabiha halal")
  ) {
    tags.push("HALAL_VERIFIED");
  }

  // Check for sisters-friendly
  if (
    lowerText.includes("sisters") ||
    lowerText.includes("women's section")
  ) {
    tags.push("SISTERS_FRIENDLY");
  }

  // Check for kid-friendly
  if (lowerText.includes("kid") || lowerText.includes("family")) {
    tags.push("KID_FRIENDLY");
  }

  // Check for wheelchair access
  if (lowerText.includes("wheelchair") || lowerText.includes("accessible")) {
    tags.push("WHEELCHAIR_ACCESSIBLE");
  }

  // Check for prayer space
  if (lowerText.includes("prayer") || lowerText.includes("musalla")) {
    tags.push("PRAYER_SPACE");
  }

  return tags;
}

/**
 * Geocode address to lat/lng (mock implementation)
 * In production, use Mapbox Geocoding API
 */
export async function geocodeAddress(address: string, city: string, state: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  // For mock mode, return Fremont coordinates with small random offset
  // In production, call Mapbox Geocoding API
  const baseFremont = { lat: 37.5485, lng: -121.9886 };

  return {
    latitude: baseFremont.lat + (Math.random() - 0.5) * 0.1,
    longitude: baseFremont.lng + (Math.random() - 0.5) * 0.1,
  };
}
