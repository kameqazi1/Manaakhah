/**
 * Muslim Signal Detection
 *
 * Keyword databases and analysis functions for detecting Muslim/Islamic
 * business indicators. Used for confidence scoring in the scraper.
 */

import type { MuslimSignal, SignalAnalysis } from "./types";

// =============================================================================
// KEYWORD DATABASES
// =============================================================================

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
 * Halal-specific certification keywords (higher weight)
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
  { keyword: "hms certified", weight: 30 },
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

// =============================================================================
// SIGNAL ANALYSIS
// =============================================================================

/**
 * Analyze text for Muslim/Islamic signals
 *
 * @param text - Text to analyze (description, content, etc.)
 * @param name - Business name (weighted higher for matches)
 * @returns Signal analysis with score and detected signals
 */
export function analyzeMuslimSignals(text: string, name: string = ""): SignalAnalysis {
  const combinedText = `${name} ${text}`.toLowerCase();
  const signals: MuslimSignal[] = [];
  let totalScore = 0;

  // Check primary Muslim keywords
  for (const { keyword, weight, category } of MUSLIM_KEYWORDS) {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "gi"
    );
    const matches = combinedText.match(regex);

    if (matches) {
      // Find context around the keyword
      const index = combinedText.indexOf(keyword.toLowerCase());
      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(combinedText.length, index + keyword.length + 30);
      const context = combinedText.slice(contextStart, contextEnd);

      // Determine signal category based on where it was found
      let signalCategory: MuslimSignal["category"] = "description";
      if (name.toLowerCase().includes(keyword.toLowerCase())) {
        signalCategory = "name";
      }

      signals.push({
        keyword,
        context: context.trim(),
        weight: weight * matches.length,
        category: signalCategory,
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
        category: "certification",
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

/**
 * Get a base confidence score for a certification body
 *
 * Establishments from official halal certification directories
 * get a higher base confidence score.
 *
 * @param certificationBody - The certifying organization
 * @returns Base confidence score (0-100)
 */
export function getBaseConfidenceForCertification(certificationBody?: string): number {
  if (!certificationBody) return 0;

  const body = certificationBody.toLowerCase();

  // Official US halal certification bodies
  const certificationScores: Record<string, number> = {
    hfsaa: 85,
    hms: 85,
    isna: 80,
    ifanca: 80,
    sanha: 75,
    "halal food standards alliance": 85,
    "halal monitoring services": 85,
    "islamic food and nutrition council": 80,
  };

  for (const [key, score] of Object.entries(certificationScores)) {
    if (body.includes(key)) {
      return score;
    }
  }

  // Generic "halal certified" claim without specific body
  if (body.includes("halal") || body.includes("certified")) {
    return 50;
  }

  return 0;
}

/**
 * Calculate overall confidence score combining signals and certification
 *
 * @param signalAnalysis - Result from analyzeMuslimSignals
 * @param certificationBody - Optional certification body
 * @returns Combined confidence score (0-100)
 */
export function calculateConfidenceScore(
  signalAnalysis: SignalAnalysis,
  certificationBody?: string
): number {
  const baseScore = getBaseConfidenceForCertification(certificationBody);
  const signalScore = signalAnalysis.score;

  // If from official certification, use the higher of base or signal score
  // but add a small boost for having both
  if (baseScore > 0 && signalScore > 0) {
    return Math.min(100, Math.max(baseScore, signalScore) + 10);
  }

  // Otherwise just return whichever is higher
  return Math.max(baseScore, signalScore);
}
