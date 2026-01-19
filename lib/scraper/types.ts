/**
 * Enhanced Scraper Types
 * Comprehensive type definitions for multi-source business scraping
 */

// Data source types
export type DataSource =
  | "google_places"
  | "yelp"
  | "zabihah"
  | "halaltrip"
  | "salaamgateway"
  | "muslimpro"
  | "craigslist"
  | "facebook"
  | "instagram"
  | "yellowpages"
  | "bbb"
  | "chamberofcommerce"
  | "csv_import"
  | "json_import"
  | "manual";

// Business categories (expanded)
export type BusinessCategory =
  | "HALAL_FOOD"
  | "RESTAURANT"
  | "GROCERY"
  | "MASJID"
  | "AUTO_REPAIR"
  | "PLUMBING"
  | "ELECTRICAL"
  | "HANDYMAN"
  | "TUTORING"
  | "LEGAL_SERVICES"
  | "ACCOUNTING"
  | "HEALTH_WELLNESS"
  | "BARBER_SALON"
  | "CHILDCARE"
  | "COMMUNITY_AID"
  | "REAL_ESTATE"
  | "INSURANCE"
  | "IT_SERVICES"
  | "CLOTHING"
  | "JEWELRY"
  | "TRAVEL"
  | "CATERING"
  | "FOOD_TRUCK"
  | "BAKERY"
  | "BUTCHER"
  | "PHARMACY"
  | "DENTAL"
  | "OPTOMETRY"
  | "MENTAL_HEALTH"
  | "FITNESS"
  | "MARTIAL_ARTS"
  | "PHOTOGRAPHY"
  | "EVENT_PLANNING"
  | "WEDDING_SERVICES"
  | "FUNERAL_SERVICES"
  | "FINANCIAL_SERVICES"
  | "MORTGAGE"
  | "CLEANING"
  | "LANDSCAPING"
  | "MOVING"
  | "PRINTING"
  | "OTHER";

// Business tags
export type BusinessTag =
  | "MUSLIM_OWNED"
  | "HALAL_VERIFIED"
  | "ZABIHA_CERTIFIED"
  | "SISTERS_FRIENDLY"
  | "BROTHERS_ONLY"
  | "KID_FRIENDLY"
  | "WHEELCHAIR_ACCESSIBLE"
  | "PRAYER_SPACE"
  | "WUDU_FACILITIES"
  | "FAMILY_OWNED"
  | "VETERAN_OWNED"
  | "WOMEN_OWNED"
  | "ACCEPTS_ZAKAT"
  | "SADAQAH_RECIPIENT"
  | "INTEREST_FREE"
  | "SHARIA_COMPLIANT"
  | "ORGANIC"
  | "VEGAN_OPTIONS"
  | "GLUTEN_FREE"
  | "DELIVERY"
  | "CURBSIDE"
  | "APPOINTMENT_ONLY"
  | "WALK_INS_WELCOME"
  | "24_HOURS"
  | "RAMADAN_HOURS";

// Verification status
export type VerificationLevel =
  | "UNVERIFIED"
  | "SELF_REPORTED"
  | "COMMUNITY_VERIFIED"
  | "OFFICIALLY_CERTIFIED"
  | "ADMIN_VERIFIED";

// Scraper configuration
export interface ScraperConfig {
  // Search parameters
  searchQuery: string;
  keywords?: string[];
  excludeKeywords?: string[];

  // Location
  city: string;
  state: string;
  zipCode?: string;
  radius?: number; // miles
  latitude?: number;
  longitude?: number;

  // Filtering
  categories?: BusinessCategory[];
  tags?: BusinessTag[];
  minConfidence?: number; // 0-100
  verificationLevel?: VerificationLevel[];

  // Source configuration
  sources: DataSource[];
  maxResultsPerSource?: number;

  // Rate limiting
  rateLimit?: number; // ms between requests
  maxRetries?: number;
  timeout?: number;

  // Options
  includeUnverified?: boolean;
  includeClosed?: boolean;
  onlyWithPhotos?: boolean;
  onlyWithReviews?: boolean;
  onlyWithWebsite?: boolean;
  onlyWithPhone?: boolean;

  // Deduplication
  deduplicateByName?: boolean;
  deduplicateByAddress?: boolean;
  deduplicateByPhone?: boolean;
  similarityThreshold?: number; // 0-1
}

// Scraped business data
export interface ScrapedBusiness {
  // Basic info
  name: string;
  description?: string;
  shortDescription?: string;

  // Category and tags
  category: BusinessCategory;
  suggestedCategories?: BusinessCategory[];
  tags: BusinessTag[];
  suggestedTags?: BusinessTag[];

  // Location
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;

  // Contact
  phone?: string;
  phoneAlternate?: string;
  email?: string;
  website?: string;

  // Social media
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;

  // Hours
  hours?: BusinessHours;
  ramadanHours?: BusinessHours;
  holidayHours?: HolidayHours[];
  timezone?: string;

  // Services and products
  services?: string[];
  products?: string[];
  cuisineTypes?: string[];
  priceRange?: "BUDGET" | "MODERATE" | "PREMIUM" | "LUXURY";

  // Media
  photos?: ScrapedPhoto[];
  logo?: string;
  coverImage?: string;
  menuUrl?: string;

  // Reviews and ratings
  averageRating?: number;
  totalReviews?: number;
  ratings?: {
    source: string;
    rating: number;
    count: number;
  }[];

  // Verification and confidence
  confidence: number; // 0-100
  signals: MuslimSignal[];
  verificationLevel: VerificationLevel;
  verificationNotes?: string;

  // Source tracking
  source: DataSource;
  sourceUrl: string;
  sourceId?: string;

  // Metadata
  scrapedAt: Date;
  lastUpdated?: Date;
  metadata?: Record<string, any>;
}

// Business hours structure
export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "21:00"
  closed?: boolean;
  breaks?: { start: string; end: string }[];
}

export interface HolidayHours {
  date: string;
  name: string;
  hours?: DayHours;
  closed?: boolean;
}

// Photo data
export interface ScrapedPhoto {
  url: string;
  caption?: string;
  source?: string;
  isPrimary?: boolean;
  type?: "exterior" | "interior" | "food" | "product" | "team" | "other";
}

// Muslim signal detection
export interface MuslimSignal {
  keyword: string;
  context: string;
  weight: number;
  category: "name" | "description" | "review" | "menu" | "website" | "social";
}

// Scraper result
export interface ScraperResult {
  success: boolean;
  businesses: ScrapedBusiness[];
  errors: ScraperError[];
  stats: ScraperStats;
  scrapedAt: Date;
}

export interface ScraperError {
  source: DataSource;
  message: string;
  code?: string;
  retryable?: boolean;
}

export interface ScraperStats {
  totalFound: number;
  totalSaved: number;
  duplicatesSkipped: number;
  lowConfidenceSkipped: number;
  bySource: Record<DataSource, number>;
  byCategory: Record<BusinessCategory, number>;
  averageConfidence: number;
  processingTime: number; // ms
}

// Filter presets
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<ScraperConfig>;
  icon?: string;
}

// Import formats
export interface CSVImportRow {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  category?: string;
  description?: string;
  tags?: string; // comma-separated
  [key: string]: string | undefined;
}

export interface JSONImportData {
  businesses: Partial<ScrapedBusiness>[];
  source?: string;
  importedAt?: string;
}

// Geocoding result
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  confidence: number;
  source: "mapbox" | "google" | "nominatim" | "cache";
}

// Duplicate detection result
export interface DuplicateCheck {
  isDuplicate: boolean;
  matchedId?: string;
  matchedName?: string;
  similarity: number;
  matchType: "exact" | "fuzzy_name" | "address" | "phone" | "combined";
}
