/**
 * Enhanced Scraping Utilities
 * Comprehensive keyword detection, confidence scoring, and filtering
 */

import {
  BusinessCategory,
  BusinessTag,
  MuslimSignal,
  VerificationLevel,
  GeocodingResult,
  DuplicateCheck,
  ScrapedBusiness,
} from "./types";

import { db } from "@/lib/db";

// ============================================================================
// KEYWORD DATABASES
// ============================================================================

/**
 * Primary Muslim/Islamic keywords with weights
 */
export const MUSLIM_KEYWORDS: { keyword: string; weight: number; category: string }[] = [
  // High confidence keywords (20+ points)
  { keyword: "halal", weight: 25, category: "food" },
  { keyword: "zabiha", weight: 30, category: "food" },
  { keyword: "zabihah", weight: 30, category: "food" },
  { keyword: "masjid", weight: 35, category: "religious" },
  { keyword: "mosque", weight: 35, category: "religious" },
  { keyword: "islamic center", weight: 30, category: "religious" },
  { keyword: "muslim-owned", weight: 35, category: "ownership" },
  { keyword: "muslim owned", weight: 35, category: "ownership" },

  // Medium confidence keywords (10-19 points)
  { keyword: "islamic", weight: 15, category: "general" },
  { keyword: "muslim", weight: 15, category: "general" },
  { keyword: "jummah", weight: 18, category: "religious" },
  { keyword: "salah", weight: 15, category: "religious" },
  { keyword: "quran", weight: 18, category: "religious" },
  { keyword: "quranic", weight: 18, category: "religious" },
  { keyword: "hijab", weight: 12, category: "cultural" },
  { keyword: "abaya", weight: 12, category: "cultural" },
  { keyword: "thobe", weight: 12, category: "cultural" },
  { keyword: "ramadan", weight: 15, category: "cultural" },
  { keyword: "eid", weight: 12, category: "cultural" },
  { keyword: "iftar", weight: 15, category: "cultural" },
  { keyword: "suhoor", weight: 15, category: "cultural" },

  // Arabic phrases and names (10-15 points)
  { keyword: "bismillah", weight: 15, category: "phrase" },
  { keyword: "assalam", weight: 12, category: "phrase" },
  { keyword: "alaikum", weight: 12, category: "phrase" },
  { keyword: "inshallah", weight: 10, category: "phrase" },
  { keyword: "mashallah", weight: 10, category: "phrase" },
  { keyword: "alhamdulillah", weight: 12, category: "phrase" },
  { keyword: "subhanallah", weight: 12, category: "phrase" },
  { keyword: "allahu akbar", weight: 12, category: "phrase" },
  { keyword: "jazakallah", weight: 10, category: "phrase" },

  // Common name patterns (8-12 points)
  { keyword: "al-", weight: 10, category: "name" },
  { keyword: "ibn ", weight: 8, category: "name" },
  { keyword: "abu ", weight: 8, category: "name" },
  { keyword: "umm ", weight: 8, category: "name" },
  { keyword: "sheikh", weight: 10, category: "name" },
  { keyword: "imam", weight: 12, category: "name" },

  // Lower confidence signals (5-9 points)
  { keyword: "crescent", weight: 8, category: "symbol" },
  { keyword: "prayer", weight: 6, category: "general" },
  { keyword: "ummah", weight: 8, category: "general" },
  { keyword: "dua", weight: 7, category: "religious" },
  { keyword: "wudu", weight: 10, category: "religious" },
  { keyword: "ablution", weight: 8, category: "religious" },
  { keyword: "musalla", weight: 12, category: "religious" },
  { keyword: "mihrab", weight: 12, category: "religious" },
  { keyword: "minaret", weight: 10, category: "religious" },
];

/**
 * Halal-specific certification keywords
 */
export const HALAL_CERTIFICATION_KEYWORDS = [
  { keyword: "halal certified", weight: 30 },
  { keyword: "halal certification", weight: 30 },
  { keyword: "zabiha certified", weight: 35 },
  { keyword: "hand slaughtered", weight: 25 },
  { keyword: "islamically slaughtered", weight: 30 },
  { keyword: "halal meat", weight: 20 },
  { keyword: "halal food", weight: 18 },
  { keyword: "100% halal", weight: 25 },
  { keyword: "strictly halal", weight: 25 },
  { keyword: "isna certified", weight: 30 },
  { keyword: "ifanca certified", weight: 30 },
  { keyword: "hfsaa certified", weight: 30 },
];

/**
 * Sharia-compliant finance keywords
 */
export const SHARIA_FINANCE_KEYWORDS = [
  { keyword: "sharia compliant", weight: 25 },
  { keyword: "shariah compliant", weight: 25 },
  { keyword: "islamic finance", weight: 25 },
  { keyword: "interest-free", weight: 20 },
  { keyword: "riba-free", weight: 25 },
  { keyword: "no interest", weight: 15 },
  { keyword: "halal mortgage", weight: 25 },
  { keyword: "halal investment", weight: 25 },
  { keyword: "sukuk", weight: 20 },
  { keyword: "murabaha", weight: 25 },
  { keyword: "musharakah", weight: 25 },
  { keyword: "ijara", weight: 20 },
  { keyword: "takaful", weight: 25 },
];

/**
 * Category-specific keywords for better classification
 */
export const CATEGORY_KEYWORDS: Record<BusinessCategory, string[]> = {
  HALAL_FOOD: ["halal", "zabiha", "zabihah", "meat market", "butcher", "slaughter"],
  RESTAURANT: ["restaurant", "grill", "cuisine", "eatery", "cafe", "diner", "bistro", "kitchen"],
  GROCERY: ["grocery", "market", "supermarket", "store", "foods", "provisions"],
  MASJID: ["masjid", "mosque", "islamic center", "musalla", "prayer hall"],
  AUTO_REPAIR: ["auto repair", "mechanic", "automotive", "car service", "garage", "auto shop"],
  PLUMBING: ["plumbing", "plumber", "pipe", "drain", "water heater"],
  ELECTRICAL: ["electrical", "electrician", "wiring", "circuit"],
  HANDYMAN: ["handyman", "repair", "maintenance", "fix-it"],
  TUTORING: ["tutoring", "tutor", "education", "learning", "academy", "school"],
  LEGAL_SERVICES: ["legal", "lawyer", "attorney", "law firm", "legal services"],
  ACCOUNTING: ["accounting", "accountant", "cpa", "tax", "bookkeeping"],
  HEALTH_WELLNESS: ["health", "wellness", "clinic", "medical", "doctor"],
  BARBER_SALON: ["barber", "salon", "haircut", "grooming", "beauty"],
  CHILDCARE: ["childcare", "daycare", "preschool", "nursery", "babysitting"],
  COMMUNITY_AID: ["community", "charity", "aid", "zakat", "sadaqah", "nonprofit"],
  REAL_ESTATE: ["real estate", "realtor", "property", "homes", "realty"],
  INSURANCE: ["insurance", "takaful", "coverage", "policy"],
  IT_SERVICES: ["it services", "computer", "tech support", "software", "web development"],
  CLOTHING: ["clothing", "apparel", "fashion", "hijab", "abaya", "modest"],
  JEWELRY: ["jewelry", "jeweler", "gold", "silver", "accessories"],
  TRAVEL: ["travel", "hajj", "umrah", "tour", "pilgrimage"],
  CATERING: ["catering", "events", "party", "banquet"],
  FOOD_TRUCK: ["food truck", "mobile food", "street food"],
  BAKERY: ["bakery", "bake", "pastry", "bread", "dessert"],
  BUTCHER: ["butcher", "meat", "slaughter", "zabiha"],
  PHARMACY: ["pharmacy", "drugstore", "medication", "prescription"],
  DENTAL: ["dental", "dentist", "orthodontist", "teeth"],
  OPTOMETRY: ["optometry", "optometrist", "eye care", "glasses", "vision"],
  MENTAL_HEALTH: ["mental health", "counseling", "therapy", "psychologist"],
  FITNESS: ["fitness", "gym", "workout", "exercise", "training"],
  MARTIAL_ARTS: ["martial arts", "karate", "taekwondo", "jiu-jitsu", "mma"],
  PHOTOGRAPHY: ["photography", "photographer", "photo", "portrait", "wedding photography"],
  EVENT_PLANNING: ["event planning", "events", "party planning", "coordinator"],
  WEDDING_SERVICES: ["wedding", "nikah", "bridal", "marriage"],
  FUNERAL_SERVICES: ["funeral", "janazah", "burial", "cemetery"],
  FINANCIAL_SERVICES: ["financial", "finance", "investment", "wealth management"],
  MORTGAGE: ["mortgage", "home loan", "financing", "halal mortgage"],
  CLEANING: ["cleaning", "cleaner", "janitorial", "maid service"],
  LANDSCAPING: ["landscaping", "lawn", "garden", "yard work"],
  MOVING: ["moving", "movers", "relocation", "transport"],
  PRINTING: ["printing", "print shop", "graphics", "signs"],
  OTHER: [],
};

/**
 * Tag detection patterns
 */
export const TAG_PATTERNS: { tag: BusinessTag; patterns: string[] }[] = [
  { tag: "MUSLIM_OWNED", patterns: ["muslim owned", "muslim-owned", "owned by muslim"] },
  { tag: "HALAL_VERIFIED", patterns: ["halal certified", "halal certification", "certified halal"] },
  { tag: "ZABIHA_CERTIFIED", patterns: ["zabiha", "zabihah", "hand slaughtered"] },
  { tag: "SISTERS_FRIENDLY", patterns: ["sisters", "women's section", "ladies only", "female only", "women only"] },
  { tag: "BROTHERS_ONLY", patterns: ["brothers only", "men only", "male only"] },
  { tag: "KID_FRIENDLY", patterns: ["kid friendly", "family friendly", "children welcome", "kids", "family"] },
  { tag: "WHEELCHAIR_ACCESSIBLE", patterns: ["wheelchair", "accessible", "ada compliant", "handicap"] },
  { tag: "PRAYER_SPACE", patterns: ["prayer space", "musalla", "prayer room", "prayer area"] },
  { tag: "WUDU_FACILITIES", patterns: ["wudu", "ablution", "wudhu"] },
  { tag: "FAMILY_OWNED", patterns: ["family owned", "family-owned", "family business"] },
  { tag: "VETERAN_OWNED", patterns: ["veteran owned", "veteran-owned"] },
  { tag: "WOMEN_OWNED", patterns: ["women owned", "women-owned", "female owned", "woman owned"] },
  { tag: "ACCEPTS_ZAKAT", patterns: ["accepts zakat", "zakat eligible", "zakat"] },
  { tag: "SADAQAH_RECIPIENT", patterns: ["sadaqah", "charity", "donations accepted"] },
  { tag: "INTEREST_FREE", patterns: ["interest-free", "interest free", "no interest", "riba-free"] },
  { tag: "SHARIA_COMPLIANT", patterns: ["sharia compliant", "shariah compliant", "islamic finance"] },
  { tag: "ORGANIC", patterns: ["organic", "natural", "non-gmo"] },
  { tag: "VEGAN_OPTIONS", patterns: ["vegan", "plant-based", "vegetarian"] },
  { tag: "GLUTEN_FREE", patterns: ["gluten-free", "gluten free", "celiac"] },
  { tag: "DELIVERY", patterns: ["delivery", "delivers", "door dash", "uber eats", "grubhub"] },
  { tag: "CURBSIDE", patterns: ["curbside", "pickup", "curb-side"] },
  { tag: "APPOINTMENT_ONLY", patterns: ["appointment only", "by appointment", "appointments required"] },
  { tag: "WALK_INS_WELCOME", patterns: ["walk-ins", "walk ins", "no appointment"] },
  { tag: "24_HOURS", patterns: ["24 hours", "24/7", "open 24", "always open"] },
  { tag: "RAMADAN_HOURS", patterns: ["ramadan hours", "ramadan schedule", "iftar", "suhoor"] },
];

// ============================================================================
// SIGNAL ANALYSIS
// ============================================================================

/**
 * Comprehensive Muslim signal analysis
 * Returns detailed signals with context and confidence score
 */
export function analyzeMuslimSignals(text: string, name: string = ""): {
  score: number;
  signals: MuslimSignal[];
  isHighConfidence: boolean;
} {
  const combinedText = `${name} ${text}`.toLowerCase();
  const signals: MuslimSignal[] = [];
  let totalScore = 0;

  // Check primary Muslim keywords
  for (const { keyword, weight, category } of MUSLIM_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi");
    const matches = combinedText.match(regex);

    if (matches) {
      // Find context around the keyword
      const index = combinedText.indexOf(keyword.toLowerCase());
      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(combinedText.length, index + keyword.length + 30);
      const context = combinedText.slice(contextStart, contextEnd);

      signals.push({
        keyword,
        context: context.trim(),
        weight: weight * matches.length,
        category: category as MuslimSignal["category"],
      });

      totalScore += weight * matches.length;
    }
  }

  // Check halal certification keywords (higher weight)
  for (const { keyword, weight } of HALAL_CERTIFICATION_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      const index = combinedText.indexOf(keyword.toLowerCase());
      const contextStart = Math.max(0, index - 20);
      const contextEnd = Math.min(combinedText.length, index + keyword.length + 20);

      signals.push({
        keyword,
        context: combinedText.slice(contextStart, contextEnd).trim(),
        weight,
        category: "description",
      });

      totalScore += weight;
    }
  }

  // Check sharia finance keywords
  for (const { keyword, weight } of SHARIA_FINANCE_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      signals.push({
        keyword,
        context: keyword,
        weight,
        category: "description",
      });

      totalScore += weight;
    }
  }

  // Cap score at 100
  const finalScore = Math.min(totalScore, 100);

  return {
    score: finalScore,
    signals,
    isHighConfidence: finalScore >= 50,
  };
}

// ============================================================================
// CATEGORY DETECTION
// ============================================================================

/**
 * Advanced business categorization with confidence scores
 */
export function categorizeBusiness(
  text: string,
  name: string
): { category: BusinessCategory; confidence: number; alternatives: BusinessCategory[] } {
  const combined = `${name} ${text}`.toLowerCase();
  const scores: { category: BusinessCategory; score: number }[] = [];

  // Score each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        // Keyword in name gets higher weight
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          score += 15;
        } else {
          score += 10;
        }
      }
    }

    if (score > 0) {
      scores.push({ category: category as BusinessCategory, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { category: "OTHER", confidence: 0, alternatives: [] };
  }

  const topCategory = scores[0];
  const alternatives = scores.slice(1, 4).map((s) => s.category);

  // Calculate confidence based on score difference
  const maxPossibleScore = 50; // Rough estimate
  const confidence = Math.min((topCategory.score / maxPossibleScore) * 100, 100);

  return {
    category: topCategory.category,
    confidence,
    alternatives,
  };
}

// ============================================================================
// TAG DETECTION
// ============================================================================

/**
 * Detect and suggest tags based on business content
 */
export function detectTags(
  text: string,
  name: string,
  signals: MuslimSignal[]
): { detected: BusinessTag[]; suggested: BusinessTag[] } {
  const combined = `${name} ${text}`.toLowerCase();
  const detected: BusinessTag[] = [];
  const suggested: BusinessTag[] = [];

  // Check tag patterns
  for (const { tag, patterns } of TAG_PATTERNS) {
    const isMatch = patterns.some((pattern) => combined.includes(pattern.toLowerCase()));

    if (isMatch) {
      detected.push(tag);
    }
  }

  // Auto-suggest MUSLIM_OWNED if high signal score
  if (signals.length > 0 && !detected.includes("MUSLIM_OWNED")) {
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight >= 30) {
      suggested.push("MUSLIM_OWNED");
    }
  }

  // Auto-suggest HALAL_VERIFIED if halal keywords found
  const hasHalalSignal = signals.some(
    (s) =>
      s.keyword.toLowerCase().includes("halal certified") ||
      s.keyword.toLowerCase().includes("zabiha")
  );
  if (hasHalalSignal && !detected.includes("HALAL_VERIFIED")) {
    suggested.push("HALAL_VERIFIED");
  }

  return { detected, suggested };
}

// ============================================================================
// SERVICE EXTRACTION
// ============================================================================

/**
 * Extract services from business description
 */
export function extractServices(text: string, category: BusinessCategory): string[] {
  const services: string[] = [];
  const lowerText = text.toLowerCase();

  // General service patterns
  const generalPatterns = [
    { pattern: /delivery/i, service: "Delivery" },
    { pattern: /takeout|take-out|take out/i, service: "Takeout" },
    { pattern: /catering/i, service: "Catering" },
    { pattern: /dine-?in/i, service: "Dine-in" },
    { pattern: /online order/i, service: "Online Ordering" },
    { pattern: /reservation/i, service: "Reservations" },
    { pattern: /private event/i, service: "Private Events" },
  ];

  // Category-specific patterns
  const categoryPatterns: Record<string, { pattern: RegExp; service: string }[]> = {
    RESTAURANT: [
      { pattern: /buffet/i, service: "Buffet" },
      { pattern: /breakfast/i, service: "Breakfast" },
      { pattern: /lunch/i, service: "Lunch" },
      { pattern: /dinner/i, service: "Dinner" },
      { pattern: /brunch/i, service: "Brunch" },
    ],
    MASJID: [
      { pattern: /jummah/i, service: "Jummah Prayer" },
      { pattern: /five daily/i, service: "Five Daily Prayers" },
      { pattern: /taraweeh/i, service: "Taraweeh Prayer" },
      { pattern: /weekend school/i, service: "Weekend School" },
      { pattern: /quran class/i, service: "Quran Classes" },
      { pattern: /arabic class/i, service: "Arabic Classes" },
      { pattern: /nikah/i, service: "Nikah Services" },
      { pattern: /janazah/i, service: "Janazah Services" },
      { pattern: /community event/i, service: "Community Events" },
    ],
    AUTO_REPAIR: [
      { pattern: /oil change/i, service: "Oil Change" },
      { pattern: /brake/i, service: "Brake Service" },
      { pattern: /tire/i, service: "Tire Service" },
      { pattern: /transmission/i, service: "Transmission" },
      { pattern: /engine/i, service: "Engine Repair" },
      { pattern: /ac|air conditioning/i, service: "A/C Service" },
      { pattern: /diagnostic/i, service: "Diagnostics" },
    ],
    HALAL_FOOD: [
      { pattern: /fresh meat/i, service: "Fresh Meat" },
      { pattern: /custom cut/i, service: "Custom Cuts" },
      { pattern: /bulk order/i, service: "Bulk Orders" },
      { pattern: /goat|lamb|beef|chicken/i, service: "Various Meats" },
    ],
    BARBER_SALON: [
      { pattern: /haircut/i, service: "Haircuts" },
      { pattern: /beard/i, service: "Beard Trim" },
      { pattern: /shave/i, service: "Shave" },
      { pattern: /color/i, service: "Hair Coloring" },
      { pattern: /styling/i, service: "Styling" },
    ],
  };

  // Apply general patterns
  for (const { pattern, service } of generalPatterns) {
    if (pattern.test(lowerText) && !services.includes(service)) {
      services.push(service);
    }
  }

  // Apply category-specific patterns
  const specificPatterns = categoryPatterns[category] || [];
  for (const { pattern, service } of specificPatterns) {
    if (pattern.test(lowerText) && !services.includes(service)) {
      services.push(service);
    }
  }

  return services;
}

// ============================================================================
// CUISINE DETECTION (for restaurants)
// ============================================================================

/**
 * Detect cuisine types from restaurant description
 */
export function detectCuisineTypes(text: string, name: string): string[] {
  const combined = `${name} ${text}`.toLowerCase();
  const cuisines: string[] = [];

  const cuisinePatterns = [
    { pattern: /mediterranean|levantine/i, cuisine: "Mediterranean" },
    { pattern: /middle eastern/i, cuisine: "Middle Eastern" },
    { pattern: /arab|arabic/i, cuisine: "Arabic" },
    { pattern: /pakistani/i, cuisine: "Pakistani" },
    { pattern: /indian/i, cuisine: "Indian" },
    { pattern: /bangladeshi/i, cuisine: "Bangladeshi" },
    { pattern: /turkish/i, cuisine: "Turkish" },
    { pattern: /afghan/i, cuisine: "Afghan" },
    { pattern: /persian|iranian/i, cuisine: "Persian" },
    { pattern: /moroccan/i, cuisine: "Moroccan" },
    { pattern: /egyptian/i, cuisine: "Egyptian" },
    { pattern: /lebanese/i, cuisine: "Lebanese" },
    { pattern: /yemeni/i, cuisine: "Yemeni" },
    { pattern: /somali/i, cuisine: "Somali" },
    { pattern: /ethiopian/i, cuisine: "Ethiopian" },
    { pattern: /indonesian/i, cuisine: "Indonesian" },
    { pattern: /malaysian/i, cuisine: "Malaysian" },
    { pattern: /american/i, cuisine: "American" },
    { pattern: /mexican/i, cuisine: "Mexican" },
    { pattern: /chinese/i, cuisine: "Chinese" },
    { pattern: /thai/i, cuisine: "Thai" },
    { pattern: /korean/i, cuisine: "Korean" },
    { pattern: /japanese/i, cuisine: "Japanese" },
    { pattern: /fusion/i, cuisine: "Fusion" },
    { pattern: /kabob|kebab/i, cuisine: "Kabob" },
    { pattern: /biryani/i, cuisine: "Biryani" },
    { pattern: /shawarma/i, cuisine: "Shawarma" },
    { pattern: /falafel/i, cuisine: "Falafel" },
    { pattern: /pizza/i, cuisine: "Pizza" },
    { pattern: /burger/i, cuisine: "Burgers" },
    { pattern: /fried chicken/i, cuisine: "Fried Chicken" },
    { pattern: /seafood/i, cuisine: "Seafood" },
    { pattern: /vegetarian/i, cuisine: "Vegetarian" },
    { pattern: /vegan/i, cuisine: "Vegan" },
  ];

  for (const { pattern, cuisine } of cuisinePatterns) {
    if (pattern.test(combined) && !cuisines.includes(cuisine)) {
      cuisines.push(cuisine);
    }
  }

  return cuisines;
}

// ============================================================================
// PRICE RANGE DETECTION
// ============================================================================

/**
 * Detect price range from reviews or description
 */
export function detectPriceRange(
  text: string
): "BUDGET" | "MODERATE" | "PREMIUM" | "LUXURY" | null {
  const lowerText = text.toLowerCase();

  // Price indicators
  const luxuryPatterns = /fine dining|upscale|expensive|$$$$|luxury|premium|high-end/i;
  const premiumPatterns = /\$\$\$|pricey|special occasion|mid-high/i;
  const moderatePatterns = /\$\$|reasonable|fair price|mid-range|moderately priced/i;
  const budgetPatterns = /\$|cheap|affordable|budget|inexpensive|value|bargain/i;

  if (luxuryPatterns.test(lowerText)) return "LUXURY";
  if (premiumPatterns.test(lowerText)) return "PREMIUM";
  if (moderatePatterns.test(lowerText)) return "MODERATE";
  if (budgetPatterns.test(lowerText)) return "BUDGET";

  return null;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  return costs[s2.length];
}

/**
 * Check if a business is a duplicate of existing businesses
 */
export function checkForDuplicate(
  newBusiness: Partial<ScrapedBusiness>,
  existingBusinesses: Partial<ScrapedBusiness>[],
  threshold: number = 0.85
): DuplicateCheck {
  for (const existing of existingBusinesses) {
    // Exact phone match
    if (newBusiness.phone && existing.phone && newBusiness.phone === existing.phone) {
      return {
        isDuplicate: true,
        matchedId: existing.sourceId,
        matchedName: existing.name,
        similarity: 1,
        matchType: "phone",
      };
    }

    // Exact address match
    const newAddress = `${newBusiness.address} ${newBusiness.city} ${newBusiness.state}`.toLowerCase();
    const existingAddress = `${existing.address} ${existing.city} ${existing.state}`.toLowerCase();
    if (newAddress === existingAddress) {
      return {
        isDuplicate: true,
        matchedId: existing.sourceId,
        matchedName: existing.name,
        similarity: 1,
        matchType: "address",
      };
    }

    // Fuzzy name match
    if (newBusiness.name && existing.name) {
      const nameSimilarity = calculateSimilarity(newBusiness.name, existing.name);
      if (nameSimilarity >= threshold) {
        return {
          isDuplicate: true,
          matchedId: existing.sourceId,
          matchedName: existing.name,
          similarity: nameSimilarity,
          matchType: "fuzzy_name",
        };
      }

      // Combined check: similar name + same city
      if (
        nameSimilarity >= 0.7 &&
        newBusiness.city?.toLowerCase() === existing.city?.toLowerCase()
      ) {
        return {
          isDuplicate: true,
          matchedId: existing.sourceId,
          matchedName: existing.name,
          similarity: nameSimilarity,
          matchType: "combined",
        };
      }
    }
  }

  return {
    isDuplicate: false,
    similarity: 0,
    matchType: "exact",
  };
}

/**
 * Check for duplicate in both ScrapedBusiness and Business tables
 * This prevents creating duplicate entries when a business already exists
 */
export async function checkForDuplicateInDatabase(
  business: Partial<ScrapedBusiness>
): Promise<{
  isDuplicate: boolean;
  existingId?: string;
  matchType?: "scraped" | "business";
  matchField?: "name_address" | "phone" | "name_city";
}> {
  // Build OR conditions for ScrapedBusiness check
  const scrapedConditions: any[] = [];

  if (business.name && business.address) {
    scrapedConditions.push({
      name: { equals: business.name, mode: "insensitive" },
      address: { equals: business.address, mode: "insensitive" },
    });
  }

  if (business.phone) {
    const normalizedPhone = business.phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 10) {
      scrapedConditions.push({ phone: business.phone });
    }
  }

  // Check ScrapedBusiness table first
  if (scrapedConditions.length > 0) {
    const existingScraped = await db.scrapedBusiness.findFirst({
      where: { OR: scrapedConditions },
      select: { id: true, name: true, phone: true },
    });

    if (existingScraped) {
      const matchField = existingScraped.phone === business.phone ? "phone" : "name_address";
      return {
        isDuplicate: true,
        existingId: existingScraped.id,
        matchType: "scraped",
        matchField,
      };
    }
  }

  // Build OR conditions for Business table check
  const businessConditions: any[] = [];

  if (business.name && business.city) {
    businessConditions.push({
      name: { contains: business.name, mode: "insensitive" },
      city: { equals: business.city, mode: "insensitive" },
    });
  }

  if (business.phone) {
    const normalizedPhone = business.phone.replace(/\D/g, "");
    if (normalizedPhone.length >= 10) {
      businessConditions.push({ phone: business.phone });
    }
  }

  // Check Business table
  if (businessConditions.length > 0) {
    const existingBusiness = await db.business.findFirst({
      where: { OR: businessConditions },
      select: { id: true, name: true, phone: true },
    });

    if (existingBusiness) {
      const matchField = existingBusiness.phone === business.phone ? "phone" : "name_city";
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

// ============================================================================
// GEOCODING
// ============================================================================

/**
 * Geocode address using Mapbox (with fallback)
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string
): Promise<GeocodingResult | null> {
  const fullAddress = `${address}, ${city}, ${state}`;

  // Try Mapbox first if configured
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    try {
      const encodedAddress = encodeURIComponent(fullAddress);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          return {
            latitude: lat,
            longitude: lng,
            formattedAddress: data.features[0].place_name,
            confidence: data.features[0].relevance * 100,
            source: "mapbox",
          };
        }
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
    }
  }

  // Fallback 1: Try Nominatim (OpenStreetMap) - free, no API key required
  try {
    const nominatimQuery = encodeURIComponent(`${fullAddress}, USA`);
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${nominatimQuery}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Manaakhah/1.0 (Muslim business directory - manaakhah.vercel.app)",
        },
      }
    );

    if (nominatimResponse.ok) {
      const nominatimData = await nominatimResponse.json();
      if (nominatimData && nominatimData.length > 0) {
        return {
          latitude: parseFloat(nominatimData[0].lat),
          longitude: parseFloat(nominatimData[0].lon),
          formattedAddress: nominatimData[0].display_name,
          confidence: 80, // Nominatim is generally reliable
          source: "nominatim",
        };
      }
    }
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
  }

  // Fallback 2: Return approximate coordinates for Bay Area cities
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    fremont: { lat: 37.5485, lng: -121.9886 },
    "san jose": { lat: 37.3382, lng: -121.8863 },
    "san francisco": { lat: 37.7749, lng: -122.4194 },
    oakland: { lat: 37.8044, lng: -122.2712 },
    hayward: { lat: 37.6688, lng: -122.0808 },
    "union city": { lat: 37.5934, lng: -122.0438 },
    newark: { lat: 37.5297, lng: -122.0402 },
    milpitas: { lat: 37.4323, lng: -121.8996 },
    sunnyvale: { lat: 37.3688, lng: -122.0363 },
    "santa clara": { lat: 37.3541, lng: -121.9552 },
  };

  const cityKey = city.toLowerCase();
  const baseCoords = cityCoordinates[cityKey] || cityCoordinates["fremont"];

  // Add small random offset
  return {
    latitude: baseCoords.lat + (Math.random() - 0.5) * 0.02,
    longitude: baseCoords.lng + (Math.random() - 0.5) * 0.02,
    formattedAddress: fullAddress,
    confidence: 50,
    source: "cache",
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean and normalize phone number
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // US phone number
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // With country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Clean and normalize website URL
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

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract email from text
 */
export function extractEmail(text: string): string | null {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

/**
 * Extract phone from text
 */
export function extractPhone(text: string): string | null {
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? normalizePhone(matches[0]) : null;
}

/**
 * Determine verification level based on source and signals
 */
export function determineVerificationLevel(
  source: string,
  signals: MuslimSignal[],
  confidence: number
): VerificationLevel {
  // Official directories get higher verification
  if (["zabihah", "muslimpro", "halaltrip"].includes(source)) {
    return confidence >= 80 ? "COMMUNITY_VERIFIED" : "SELF_REPORTED";
  }

  // High confidence from multiple sources
  if (confidence >= 70 && signals.length >= 3) {
    return "SELF_REPORTED";
  }

  return "UNVERIFIED";
}
