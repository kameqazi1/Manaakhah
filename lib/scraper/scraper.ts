/**
 * Enhanced Muslim Business Web Scraper
 *
 * Multi-source scraper with comprehensive filtering, deduplication,
 * and confidence scoring for discovering Muslim-owned businesses.
 */

import {
  DataSource,
  BusinessCategory,
  BusinessTag,
  ScraperConfig,
  ScrapedBusiness,
  ScraperResult,
  ScraperError,
  ScraperStats,
  MuslimSignal,
  CSVImportRow,
  JSONImportData,
  FilterPreset,
} from "./types";

import {
  analyzeMuslimSignals,
  categorizeBusiness,
  detectTags,
  extractServices,
  detectCuisineTypes,
  detectPriceRange,
  checkForDuplicate,
  geocodeAddress,
  sleep,
  normalizePhone,
  normalizeWebsite,
  determineVerificationLevel,
} from "./utils";

// ============================================================================
// FILTER PRESETS
// ============================================================================

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "halal_restaurants",
    name: "Halal Restaurants",
    description: "Find halal-certified restaurants and eateries",
    config: {
      keywords: ["halal", "zabiha", "halal certified"],
      categories: ["RESTAURANT", "FOOD_TRUCK", "CATERING"],
      tags: ["HALAL_VERIFIED", "ZABIHA_CERTIFIED"],
      minConfidence: 60,
    },
    icon: "🍽️",
  },
  {
    id: "halal_markets",
    name: "Halal Markets & Butchers",
    description: "Halal meat markets and grocery stores",
    config: {
      keywords: ["halal meat", "zabiha", "halal grocery", "butcher"],
      categories: ["HALAL_FOOD", "GROCERY", "BUTCHER"],
      tags: ["HALAL_VERIFIED", "ZABIHA_CERTIFIED"],
      minConfidence: 70,
    },
    icon: "🥩",
  },
  {
    id: "masjids",
    name: "Masjids & Islamic Centers",
    description: "Mosques and Islamic community centers",
    config: {
      keywords: ["masjid", "mosque", "islamic center", "musalla"],
      categories: ["MASJID"],
      minConfidence: 80,
    },
    icon: "🕌",
  },
  {
    id: "muslim_services",
    name: "Muslim-Owned Services",
    description: "Various Muslim-owned service businesses",
    config: {
      keywords: ["muslim owned", "halal", "islamic"],
      categories: [
        "AUTO_REPAIR",
        "PLUMBING",
        "ELECTRICAL",
        "HANDYMAN",
        "CLEANING",
        "LANDSCAPING",
      ],
      tags: ["MUSLIM_OWNED"],
      minConfidence: 50,
    },
    icon: "🔧",
  },
  {
    id: "islamic_education",
    name: "Islamic Education",
    description: "Quran schools, tutoring, and Islamic education",
    config: {
      keywords: ["quran", "islamic school", "arabic", "hifz", "tutoring"],
      categories: ["TUTORING"],
      minConfidence: 60,
    },
    icon: "📚",
  },
  {
    id: "halal_finance",
    name: "Halal Finance",
    description: "Sharia-compliant financial services",
    config: {
      keywords: ["sharia compliant", "islamic finance", "halal mortgage", "takaful"],
      categories: ["FINANCIAL_SERVICES", "INSURANCE", "MORTGAGE", "REAL_ESTATE"],
      tags: ["SHARIA_COMPLIANT", "INTEREST_FREE"],
      minConfidence: 70,
    },
    icon: "💰",
  },
  {
    id: "sisters_services",
    name: "Sisters-Friendly Services",
    description: "Services catering to Muslim women",
    config: {
      keywords: ["sisters", "women only", "hijab", "modest"],
      categories: ["BARBER_SALON", "FITNESS", "HEALTH_WELLNESS"],
      tags: ["SISTERS_FRIENDLY"],
      minConfidence: 50,
    },
    icon: "👩",
  },
  {
    id: "family_friendly",
    name: "Family-Friendly Businesses",
    description: "Kid and family-friendly establishments",
    config: {
      keywords: ["family", "kid friendly", "children"],
      tags: ["KID_FRIENDLY", "FAMILY_OWNED"],
      minConfidence: 40,
    },
    icon: "👨‍👩‍👧‍👦",
  },
];

// ============================================================================
// MAIN SCRAPER
// ============================================================================

/**
 * Main scraper function - orchestrates scraping from multiple sources
 */
export async function scrapeMuslimBusinesses(
  config: ScraperConfig
): Promise<ScraperResult> {
  const startTime = Date.now();
  const businesses: ScrapedBusiness[] = [];
  const errors: ScraperError[] = [];
  const stats: ScraperStats = {
    totalFound: 0,
    totalSaved: 0,
    duplicatesSkipped: 0,
    lowConfidenceSkipped: 0,
    bySource: {} as Record<DataSource, number>,
    byCategory: {} as Record<BusinessCategory, number>,
    averageConfidence: 0,
    processingTime: 0,
  };

  // Initialize source counts
  for (const source of config.sources) {
    stats.bySource[source] = 0;
  }

  try {
    // Scrape each source
    for (const source of config.sources) {
      try {
        const sourceResult = await scrapeSource(source, config);

        for (const business of sourceResult.businesses) {
          stats.totalFound++;

          // Check confidence threshold
          if (config.minConfidence && business.confidence < config.minConfidence) {
            stats.lowConfidenceSkipped++;
            continue;
          }

          // Check for duplicates
          if (
            config.deduplicateByName ||
            config.deduplicateByAddress ||
            config.deduplicateByPhone
          ) {
            const duplicateCheck = checkForDuplicate(
              business,
              businesses,
              config.similarityThreshold || 0.85
            );

            if (duplicateCheck.isDuplicate) {
              stats.duplicatesSkipped++;
              continue;
            }
          }

          // Apply filters
          if (!passesFilters(business, config)) {
            continue;
          }

          businesses.push(business);
          stats.totalSaved++;
          stats.bySource[source]++;

          // Track category counts
          if (!stats.byCategory[business.category]) {
            stats.byCategory[business.category] = 0;
          }
          stats.byCategory[business.category]++;
        }

        // Add any errors from source
        errors.push(...sourceResult.errors);

        // Rate limiting between sources
        if (config.rateLimit) {
          await sleep(config.rateLimit);
        }
      } catch (error) {
        errors.push({
          source,
          message: error instanceof Error ? error.message : String(error),
          retryable: true,
        });
      }
    }

    // Calculate average confidence
    if (businesses.length > 0) {
      stats.averageConfidence =
        businesses.reduce((sum, b) => sum + b.confidence, 0) / businesses.length;
    }
  } catch (error) {
    errors.push({
      source: "google_places", // Default source for general errors
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    });
  }

  stats.processingTime = Date.now() - startTime;

  return {
    success: errors.length === 0 || businesses.length > 0,
    businesses,
    errors,
    stats,
    scrapedAt: new Date(),
  };
}

// ============================================================================
// SOURCE-SPECIFIC SCRAPERS
// ============================================================================

/**
 * Route to appropriate scraper based on source
 */
async function scrapeSource(
  source: DataSource,
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  switch (source) {
    case "google_places":
      return await scrapeGooglePlaces(config);
    case "yelp":
      return await scrapeYelp(config);
    case "zabihah":
      return await scrapeZabihah(config);
    case "halaltrip":
      return await scrapeHalalTrip(config);
    case "salaamgateway":
      return await scrapeSalaamGateway(config);
    case "muslimpro":
      return await scrapeMuslimPro(config);
    case "yellowpages":
      return await scrapeYellowPages(config);
    case "bbb":
      return await scrapeBBB(config);
    case "facebook":
      return await scrapeFacebook(config);
    case "instagram":
      return await scrapeInstagram(config);
    case "csv_import":
    case "json_import":
    case "manual":
      return { businesses: [], errors: [] };
    default:
      return {
        businesses: [],
        errors: [
          {
            source,
            message: `Unknown source: ${source}`,
            retryable: false,
          },
        ],
      };
  }
}

/**
 * Google Places API scraper
 * In production, uses Google Places API
 */
async function scrapeGooglePlaces(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  const errors: ScraperError[] = [];

  // Check for API key
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    // Return mock data for development
    return {
      businesses: generateMockBusinesses(config, "google_places"),
      errors: [],
    };
  }

  try {
    const query = encodeURIComponent(
      `${config.searchQuery} ${config.keywords?.join(" ") || ""}`
    );
    const location = `${config.latitude || 37.5485},${config.longitude || -121.9886}`;
    const radius = (config.radius || 10) * 1609.34; // Convert miles to meters

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${location}&radius=${radius}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    const businesses: ScrapedBusiness[] = [];

    for (const place of data.results || []) {
      const business = await transformGooglePlace(place, config);
      if (business) {
        businesses.push(business);
      }
    }

    return { businesses, errors };
  } catch (error) {
    errors.push({
      source: "google_places",
      message: error instanceof Error ? error.message : String(error),
      retryable: true,
    });
    return { businesses: generateMockBusinesses(config, "google_places"), errors };
  }
}

/**
 * Transform Google Place result to ScrapedBusiness
 */
async function transformGooglePlace(
  place: any,
  config: ScraperConfig
): Promise<ScrapedBusiness | null> {
  const combinedText = `${place.name} ${place.formatted_address || ""} ${
    place.types?.join(" ") || ""
  }`;

  const { score, signals } = analyzeMuslimSignals(combinedText, place.name);
  const { category, alternatives } = categorizeBusiness(combinedText, place.name);
  const { detected, suggested } = detectTags(combinedText, place.name, signals);

  return {
    name: place.name,
    description: place.editorial_summary?.overview,
    category,
    suggestedCategories: alternatives,
    tags: detected,
    suggestedTags: suggested,
    address: place.formatted_address?.split(",")[0] || "",
    city: config.city,
    state: config.state,
    zipCode: config.zipCode || "",
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
    phone: place.formatted_phone_number,
    website: place.website,
    averageRating: place.rating,
    totalReviews: place.user_ratings_total,
    confidence: score,
    signals,
    verificationLevel: determineVerificationLevel("google_places", signals, score),
    source: "google_places",
    sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    sourceId: place.place_id,
    photos: place.photos?.map((p: any) => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      source: "google",
    })),
    scrapedAt: new Date(),
  };
}

/**
 * Yelp Fusion API scraper
 */
async function scrapeYelp(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  const errors: ScraperError[] = [];

  if (!process.env.YELP_API_KEY) {
    return {
      businesses: generateMockBusinesses(config, "yelp"),
      errors: [],
    };
  }

  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(
        config.searchQuery
      )}&location=${config.city},${config.state}&radius=${
        (config.radius || 10) * 1609
      }&limit=${config.maxResultsPerSource || 20}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const data = await response.json();
    const businesses: ScrapedBusiness[] = [];

    for (const biz of data.businesses || []) {
      const combinedText = `${biz.name} ${biz.categories?.map((c: any) => c.title).join(" ") || ""}`;
      const { score, signals } = analyzeMuslimSignals(combinedText, biz.name);
      const { category, alternatives } = categorizeBusiness(combinedText, biz.name);
      const { detected, suggested } = detectTags(combinedText, biz.name, signals);

      businesses.push({
        name: biz.name,
        category,
        suggestedCategories: alternatives,
        tags: detected,
        suggestedTags: suggested,
        address: biz.location?.address1 || "",
        city: biz.location?.city || config.city,
        state: biz.location?.state || config.state,
        zipCode: biz.location?.zip_code || "",
        latitude: biz.coordinates?.latitude,
        longitude: biz.coordinates?.longitude,
        phone: biz.phone,
        website: biz.url,
        averageRating: biz.rating,
        totalReviews: biz.review_count,
        priceRange: biz.price?.length === 1 ? "BUDGET" : biz.price?.length === 2 ? "MODERATE" : biz.price?.length === 3 ? "PREMIUM" : "LUXURY",
        confidence: score,
        signals,
        verificationLevel: determineVerificationLevel("yelp", signals, score),
        source: "yelp",
        sourceUrl: biz.url,
        sourceId: biz.id,
        photos: biz.photos?.map((url: string) => ({ url, source: "yelp" })),
        scrapedAt: new Date(),
      });
    }

    return { businesses, errors };
  } catch (error) {
    errors.push({
      source: "yelp",
      message: error instanceof Error ? error.message : String(error),
      retryable: true,
    });
    return { businesses: generateMockBusinesses(config, "yelp"), errors };
  }
}

/**
 * Zabihah.com scraper (halal restaurant directory)
 */
async function scrapeZabihah(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // Zabihah doesn't have a public API, so we use mock data
  // In production, you'd scrape the website with proper rate limiting
  return {
    businesses: generateMockBusinesses(config, "zabihah", true),
    errors: [],
  };
}

/**
 * HalalTrip.com scraper
 */
async function scrapeHalalTrip(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // HalalTrip focuses on travel and restaurants
  return {
    businesses: generateMockBusinesses(config, "halaltrip", true),
    errors: [],
  };
}

/**
 * Salaam Gateway scraper
 */
async function scrapeSalaamGateway(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // Salaam Gateway is a business news portal
  return {
    businesses: generateMockBusinesses(config, "salaamgateway"),
    errors: [],
  };
}

/**
 * Muslim Pro app directory scraper
 */
async function scrapeMuslimPro(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // Muslim Pro has halal restaurant and masjid finder
  return {
    businesses: generateMockBusinesses(config, "muslimpro", true),
    errors: [],
  };
}

/**
 * Yellow Pages scraper
 */
async function scrapeYellowPages(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  return {
    businesses: generateMockBusinesses(config, "yellowpages"),
    errors: [],
  };
}

/**
 * Better Business Bureau scraper
 */
async function scrapeBBB(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  return {
    businesses: generateMockBusinesses(config, "bbb"),
    errors: [],
  };
}

/**
 * Facebook Pages scraper
 */
async function scrapeFacebook(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // Facebook Graph API requires app review for page search
  return {
    businesses: [],
    errors: [
      {
        source: "facebook",
        message: "Facebook scraping requires approved app access",
        retryable: false,
      },
    ],
  };
}

/**
 * Instagram scraper
 */
async function scrapeInstagram(
  config: ScraperConfig
): Promise<{ businesses: ScrapedBusiness[]; errors: ScraperError[] }> {
  // Instagram API is very restricted
  return {
    businesses: [],
    errors: [
      {
        source: "instagram",
        message: "Instagram scraping requires approved app access",
        retryable: false,
      },
    ],
  };
}

// ============================================================================
// BULK IMPORT
// ============================================================================

/**
 * Import businesses from CSV data
 */
export async function importFromCSV(
  rows: CSVImportRow[],
  config: Partial<ScraperConfig>
): Promise<ScraperResult> {
  const startTime = Date.now();
  const businesses: ScrapedBusiness[] = [];
  const errors: ScraperError[] = [];

  for (const row of rows) {
    try {
      const combinedText = `${row.name} ${row.description || ""}`;
      const { score, signals } = analyzeMuslimSignals(combinedText, row.name);
      const { category } = categorizeBusiness(row.category || combinedText, row.name);
      const { detected } = detectTags(combinedText, row.name, signals);

      // Parse tags from comma-separated string
      const importedTags = row.tags
        ? (row.tags.split(",").map((t) => t.trim().toUpperCase()) as BusinessTag[])
        : [];

      // Geocode if coordinates not provided
      let coords = null;
      if (!row.latitude && !row.longitude) {
        coords = await geocodeAddress(row.address, row.city, row.state);
      }

      businesses.push({
        name: row.name,
        description: row.description,
        category,
        tags: [...detected, ...importedTags],
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        latitude: row.latitude ? parseFloat(String(row.latitude)) : coords?.latitude,
        longitude: row.longitude ? parseFloat(String(row.longitude)) : coords?.longitude,
        phone: row.phone ? normalizePhone(row.phone) : undefined,
        email: row.email,
        website: row.website ? normalizeWebsite(row.website) : undefined,
        confidence: score,
        signals,
        verificationLevel: "SELF_REPORTED",
        source: "csv_import",
        sourceUrl: "csv_import",
        scrapedAt: new Date(),
      });

      // Rate limit geocoding
      if (coords) {
        await sleep(100);
      }
    } catch (error) {
      errors.push({
        source: "csv_import",
        message: `Error importing row "${row.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        retryable: false,
      });
    }
  }

  return {
    success: businesses.length > 0,
    businesses,
    errors,
    stats: {
      totalFound: rows.length,
      totalSaved: businesses.length,
      duplicatesSkipped: 0,
      lowConfidenceSkipped: 0,
      bySource: { csv_import: businesses.length } as Record<DataSource, number>,
      byCategory: {} as Record<BusinessCategory, number>,
      averageConfidence:
        businesses.reduce((sum, b) => sum + b.confidence, 0) / businesses.length || 0,
      processingTime: Date.now() - startTime,
    },
    scrapedAt: new Date(),
  };
}

/**
 * Import businesses from JSON data
 */
export async function importFromJSON(
  data: JSONImportData,
  config: Partial<ScraperConfig>
): Promise<ScraperResult> {
  const startTime = Date.now();
  const businesses: ScrapedBusiness[] = [];
  const errors: ScraperError[] = [];

  for (const item of data.businesses) {
    try {
      const combinedText = `${item.name || ""} ${item.description || ""}`;
      const { score, signals } = analyzeMuslimSignals(combinedText, item.name || "");

      // Fill in missing fields
      const business: ScrapedBusiness = {
        name: item.name || "Unknown",
        description: item.description,
        category: item.category || "OTHER",
        tags: item.tags || [],
        address: item.address || "",
        city: item.city || "",
        state: item.state || "",
        zipCode: item.zipCode || "",
        latitude: item.latitude,
        longitude: item.longitude,
        phone: item.phone ? normalizePhone(item.phone) : undefined,
        email: item.email,
        website: item.website ? normalizeWebsite(item.website) : undefined,
        confidence: item.confidence || score,
        signals: item.signals || signals,
        verificationLevel: item.verificationLevel || "SELF_REPORTED",
        source: "json_import",
        sourceUrl: data.source || "json_import",
        scrapedAt: new Date(),
        ...item, // Allow overriding with any additional fields
      };

      businesses.push(business);
    } catch (error) {
      errors.push({
        source: "json_import",
        message: `Error importing business: ${
          error instanceof Error ? error.message : String(error)
        }`,
        retryable: false,
      });
    }
  }

  return {
    success: businesses.length > 0,
    businesses,
    errors,
    stats: {
      totalFound: data.businesses.length,
      totalSaved: businesses.length,
      duplicatesSkipped: 0,
      lowConfidenceSkipped: 0,
      bySource: { json_import: businesses.length } as Record<DataSource, number>,
      byCategory: {} as Record<BusinessCategory, number>,
      averageConfidence:
        businesses.reduce((sum, b) => sum + b.confidence, 0) / businesses.length || 0,
      processingTime: Date.now() - startTime,
    },
    scrapedAt: new Date(),
  };
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Check if business passes all configured filters
 */
function passesFilters(business: ScrapedBusiness, config: ScraperConfig): boolean {
  // Category filter
  if (config.categories && config.categories.length > 0) {
    if (!config.categories.includes(business.category)) {
      return false;
    }
  }

  // Tag filter
  if (config.tags && config.tags.length > 0) {
    const hasRequiredTag = config.tags.some((tag) => business.tags.includes(tag));
    if (!hasRequiredTag) {
      return false;
    }
  }

  // Verification level filter
  if (config.verificationLevel && config.verificationLevel.length > 0) {
    if (!config.verificationLevel.includes(business.verificationLevel)) {
      return false;
    }
  }

  // Photos filter
  if (config.onlyWithPhotos && (!business.photos || business.photos.length === 0)) {
    return false;
  }

  // Reviews filter
  if (config.onlyWithReviews && !business.totalReviews) {
    return false;
  }

  // Website filter
  if (config.onlyWithWebsite && !business.website) {
    return false;
  }

  // Phone filter
  if (config.onlyWithPhone && !business.phone) {
    return false;
  }

  // Keyword exclusion
  if (config.excludeKeywords && config.excludeKeywords.length > 0) {
    const combinedText = `${business.name} ${business.description || ""}`.toLowerCase();
    for (const keyword of config.excludeKeywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generate realistic mock business data for testing
 */
function generateMockBusinesses(
  config: ScraperConfig,
  source: DataSource,
  isHalalSource: boolean = false
): ScrapedBusiness[] {
  const businesses: ScrapedBusiness[] = [];
  const count = Math.min(config.maxResultsPerSource || 5, 10);

  const nameTemplates: Record<string, string[]> = {
    RESTAURANT: [
      "Al-Noor Mediterranean Grill",
      "Bismillah Kabob House",
      "Crescent Moon Cafe",
      "Halal Bites Kitchen",
      "Saffron Palace",
      "Zaatar Lebanese",
      "Karachi Kitchen",
      "Istanbul Grill",
      "Al-Madina Shawarma",
      "Madinah Restaurant",
    ],
    HALAL_FOOD: [
      "Barakah Halal Market",
      "Al-Madina Grocery",
      "Crescent Foods Market",
      "Halal Corner Market",
      "Bismillah Supermarket",
      "Zabiha Halal Meats",
      "Al-Quds Market",
      "Noor Grocery",
    ],
    MASJID: [
      "Islamic Center of Fremont",
      "Bay Area Masjid",
      "Al-Rahman Mosque",
      "Muslim Community Association",
      "Noor Islamic Center",
      "Masjid Al-Iman",
    ],
    AUTO_REPAIR: [
      "Barakah Auto Care",
      "Muslim Brothers Auto Repair",
      "Crescent Auto Service",
      "Al-Amin Automotive",
    ],
    BARBER_SALON: [
      "Brothers Barbershop",
      "Al-Noor Hair Studio",
      "Crescent Cuts",
      "Sisters Beauty Salon",
    ],
    default: [
      "Al-Barakah Services",
      "Muslim Owned Business",
      "Crescent Solutions",
      "Islamic Services LLC",
    ],
  };

  const streets = [
    "Mission Blvd",
    "Fremont Blvd",
    "Mowry Ave",
    "Peralta Blvd",
    "Warm Springs Blvd",
    "Paseo Padre Pkwy",
    "Stevenson Blvd",
    "Auto Mall Pkwy",
  ];

  const descriptions: Record<string, string[]> = {
    RESTAURANT: [
      "Authentic halal cuisine with fresh ingredients and traditional recipes. Zabiha certified.",
      "Family-owned restaurant serving delicious halal Mediterranean and Middle Eastern dishes since 2005.",
      "Experience the finest halal dining with our carefully prepared meals. All meat is hand-slaughtered.",
      "Serving the Muslim community with 100% halal, zabiha-certified food.",
    ],
    HALAL_FOOD: [
      "Your one-stop shop for halal zabiha meat, groceries, and Middle Eastern products.",
      "Fresh hand-slaughtered halal meat and a wide selection of international groceries.",
      "Quality halal products and friendly service for the Muslim community. We carry fresh meat daily.",
    ],
    MASJID: [
      "Community mosque serving the Muslim population with daily prayers, Jummah, and religious education.",
      "Islamic center offering prayer services, Quran classes, Arabic lessons, and community events.",
      "Welcoming masjid providing a spiritual home for Muslims in the Bay Area. Wudu facilities available.",
    ],
    AUTO_REPAIR: [
      "Honest and reliable auto repair services. Muslim-owned with fair pricing and excellent service.",
      "Your trusted auto repair shop for all vehicle needs. We treat every customer like family.",
    ],
    default: [
      "Muslim-owned business serving the community with integrity and excellence.",
      "Dedicated to serving the Muslim community with quality products and services.",
    ],
  };

  // Determine category from search query
  let primaryCategory: BusinessCategory = "RESTAURANT";
  const searchLower = config.searchQuery.toLowerCase();

  if (searchLower.includes("masjid") || searchLower.includes("mosque")) {
    primaryCategory = "MASJID";
  } else if (searchLower.includes("market") || searchLower.includes("grocery") || searchLower.includes("meat")) {
    primaryCategory = "HALAL_FOOD";
  } else if (searchLower.includes("auto") || searchLower.includes("repair")) {
    primaryCategory = "AUTO_REPAIR";
  } else if (searchLower.includes("barber") || searchLower.includes("salon")) {
    primaryCategory = "BARBER_SALON";
  }

  const templateKey = nameTemplates[primaryCategory] ? primaryCategory : "default";
  const names = nameTemplates[templateKey];
  const descList = descriptions[templateKey] || descriptions.default;

  for (let i = 0; i < count && i < names.length; i++) {
    const name = names[i];
    const streetNum = Math.floor(Math.random() * 9000) + 1000;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const description = descList[i % descList.length];

    const { score, signals } = analyzeMuslimSignals(description, name);
    const { detected, suggested } = detectTags(description, name, signals);
    const services = extractServices(description, primaryCategory);
    const cuisines = primaryCategory === "RESTAURANT" ? detectCuisineTypes(description, name) : undefined;

    // Higher confidence for halal-specific sources
    const baseConfidence = isHalalSource ? 75 : 50;
    const adjustedConfidence = Math.min(100, baseConfidence + score);

    // Generate coordinates near the search location or Fremont
    const baseLat = config.latitude || 37.5485;
    const baseLng = config.longitude || -121.9886;

    businesses.push({
      name,
      description,
      shortDescription: description.slice(0, 100) + "...",
      category: primaryCategory,
      suggestedCategories: [],
      tags: [...detected, ...(isHalalSource ? (["HALAL_VERIFIED"] as BusinessTag[]) : [])],
      suggestedTags: suggested,
      address: `${streetNum} ${street}`,
      city: config.city,
      state: config.state,
      zipCode: config.zipCode || "94536",
      latitude: baseLat + (Math.random() - 0.5) * 0.05,
      longitude: baseLng + (Math.random() - 0.5) * 0.05,
      phone: `(510) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      website: `https://www.${name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`,
      services,
      cuisineTypes: cuisines,
      averageRating: 3.5 + Math.random() * 1.5,
      totalReviews: Math.floor(Math.random() * 200) + 10,
      priceRange: detectPriceRange(description) || "MODERATE",
      confidence: adjustedConfidence,
      signals,
      verificationLevel: isHalalSource ? "COMMUNITY_VERIFIED" : "SELF_REPORTED",
      source,
      sourceUrl: `https://www.${source.replace("_", "")}.com/search/${encodeURIComponent(name)}`,
      sourceId: `${source}_${Date.now()}_${i}`,
      scrapedAt: new Date(),
    });
  }

  return businesses;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  analyzeMuslimSignals,
  categorizeBusiness,
  detectTags,
  extractServices,
  detectCuisineTypes,
  detectPriceRange,
  checkForDuplicate,
  geocodeAddress,
} from "./utils";
