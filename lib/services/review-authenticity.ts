// Review Authenticity AI Service
// Analyzes reviews for authenticity and quality

export interface AuthenticityScore {
  overall: number; // 0-100
  factors: {
    lengthQuality: number;
    specificDetails: number;
    sentimentConsistency: number;
    accountAge: number;
    reviewHistory: number;
    verifiedPurchase: boolean;
    duplicateCheck: number;
  };
  flags: string[];
  confidence: "high" | "medium" | "low";
}

export interface ReviewAnalysis {
  score: AuthenticityScore;
  isAuthentic: boolean;
  requiresManualReview: boolean;
  summary: string;
}

// Keywords that indicate specific, authentic details
const DETAIL_INDICATORS = [
  "ordered", "tried", "ate", "bought", "purchased",
  "staff", "service", "waiter", "owner", "manager",
  "price", "cost", "worth", "value",
  "parking", "location", "ambiance", "atmosphere",
  "menu", "portion", "taste", "fresh", "quality",
  "wait", "minutes", "hours", "time",
  "recommend", "return", "visit", "came back",
];

// Red flag patterns for potentially fake reviews
const RED_FLAG_PATTERNS = [
  /best (ever|in town|place)/i,
  /\b(amazing|perfect|excellent)\b.*\b(amazing|perfect|excellent)\b/i,
  /don't miss|must try|must visit/i,
  /(\b\d{1,2}\s*\/\s*\d{1,2}\b)/, // Dates in suspicious format
  /(.)\1{4,}/, // Repeated characters
];

// Generic phrases that might indicate low-effort or fake reviews
const GENERIC_PHRASES = [
  "great food",
  "good service",
  "nice place",
  "loved it",
  "highly recommend",
  "will come back",
  "five stars",
];

export function analyzeReviewAuthenticity(
  review: {
    content: string;
    rating: number;
    authorId: string;
    createdAt: string;
  },
  authorProfile?: {
    createdAt: string;
    reviewCount: number;
    isVerified: boolean;
  },
  businessReviews?: Array<{ content: string; authorId: string }>
): ReviewAnalysis {
  const scores: AuthenticityScore["factors"] = {
    lengthQuality: 0,
    specificDetails: 0,
    sentimentConsistency: 0,
    accountAge: 0,
    reviewHistory: 0,
    verifiedPurchase: false,
    duplicateCheck: 100,
  };

  const flags: string[] = [];

  // 1. Length Quality Analysis (0-100)
  const wordCount = review.content.split(/\s+/).length;
  if (wordCount < 10) {
    scores.lengthQuality = 20;
    flags.push("Very short review");
  } else if (wordCount < 25) {
    scores.lengthQuality = 50;
  } else if (wordCount < 50) {
    scores.lengthQuality = 75;
  } else if (wordCount < 150) {
    scores.lengthQuality = 100;
  } else {
    scores.lengthQuality = 90; // Very long reviews can sometimes be suspicious
    if (wordCount > 300) flags.push("Unusually long review");
  }

  // 2. Specific Details Analysis (0-100)
  const detailCount = DETAIL_INDICATORS.filter((indicator) =>
    review.content.toLowerCase().includes(indicator)
  ).length;

  scores.specificDetails = Math.min(100, detailCount * 15);

  if (detailCount === 0) {
    flags.push("Lacks specific details");
  }

  // 3. Sentiment Consistency (0-100)
  // Check if the rating matches the sentiment of the text
  const positiveWords = (review.content.match(/\b(great|good|excellent|amazing|wonderful|love|best|perfect|delicious|friendly|helpful)\b/gi) || []).length;
  const negativeWords = (review.content.match(/\b(bad|terrible|awful|worst|horrible|poor|disappointing|rude|slow|dirty|never)\b/gi) || []).length;

  const sentimentScore = positiveWords - negativeWords;
  const expectedSentiment = review.rating >= 4 ? "positive" : review.rating <= 2 ? "negative" : "neutral";
  const actualSentiment = sentimentScore > 1 ? "positive" : sentimentScore < -1 ? "negative" : "neutral";

  if (expectedSentiment === actualSentiment) {
    scores.sentimentConsistency = 100;
  } else if (expectedSentiment === "neutral" || actualSentiment === "neutral") {
    scores.sentimentConsistency = 70;
  } else {
    scores.sentimentConsistency = 30;
    flags.push("Rating doesn't match sentiment");
  }

  // 4. Account Age Analysis (0-100)
  if (authorProfile) {
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(authorProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (accountAgeDays < 7) {
      scores.accountAge = 30;
      flags.push("New account");
    } else if (accountAgeDays < 30) {
      scores.accountAge = 60;
    } else if (accountAgeDays < 90) {
      scores.accountAge = 80;
    } else {
      scores.accountAge = 100;
    }

    // 5. Review History Analysis (0-100)
    if (authorProfile.reviewCount === 1) {
      scores.reviewHistory = 40;
      flags.push("First review from this user");
    } else if (authorProfile.reviewCount < 5) {
      scores.reviewHistory = 60;
    } else if (authorProfile.reviewCount < 20) {
      scores.reviewHistory = 85;
    } else {
      scores.reviewHistory = 100;
    }

    scores.verifiedPurchase = authorProfile.isVerified;
    if (authorProfile.isVerified) {
      scores.accountAge = Math.min(100, scores.accountAge + 20);
    }
  } else {
    scores.accountAge = 50;
    scores.reviewHistory = 50;
  }

  // 6. Duplicate Check (0-100)
  if (businessReviews) {
    const similarReviews = businessReviews.filter((r) => {
      if (r.authorId === review.authorId) return false;
      const similarity = calculateSimilarity(review.content, r.content);
      return similarity > 0.7;
    });

    if (similarReviews.length > 0) {
      scores.duplicateCheck = 20;
      flags.push("Similar review found");
    }
  }

  // Check for red flags
  RED_FLAG_PATTERNS.forEach((pattern) => {
    if (pattern.test(review.content)) {
      flags.push("Contains suspicious patterns");
    }
  });

  // Check for generic phrases
  const genericCount = GENERIC_PHRASES.filter((phrase) =>
    review.content.toLowerCase().includes(phrase)
  ).length;

  if (genericCount >= 3) {
    flags.push("Multiple generic phrases");
    scores.specificDetails = Math.max(0, scores.specificDetails - 20);
  }

  // Calculate overall score
  const weights = {
    lengthQuality: 0.15,
    specificDetails: 0.25,
    sentimentConsistency: 0.15,
    accountAge: 0.15,
    reviewHistory: 0.15,
    duplicateCheck: 0.15,
  };

  const overall = Math.round(
    scores.lengthQuality * weights.lengthQuality +
      scores.specificDetails * weights.specificDetails +
      scores.sentimentConsistency * weights.sentimentConsistency +
      scores.accountAge * weights.accountAge +
      scores.reviewHistory * weights.reviewHistory +
      scores.duplicateCheck * weights.duplicateCheck +
      (scores.verifiedPurchase ? 10 : 0)
  );

  // Determine confidence level
  let confidence: "high" | "medium" | "low" = "medium";
  if (overall >= 75 || overall <= 35) {
    confidence = "high";
  } else if (flags.length >= 3) {
    confidence = "low";
  }

  // Generate summary
  let summary = "";
  if (overall >= 80) {
    summary = "This review appears to be authentic with strong indicators of genuine experience.";
  } else if (overall >= 60) {
    summary = "This review appears mostly authentic but has some minor concerns.";
  } else if (overall >= 40) {
    summary = "This review has mixed signals and may warrant closer inspection.";
  } else {
    summary = "This review has multiple authenticity concerns and should be reviewed manually.";
  }

  return {
    score: {
      overall,
      factors: scores,
      flags,
      confidence,
    },
    isAuthentic: overall >= 50,
    requiresManualReview: overall < 40 || flags.length >= 3,
    summary,
  };
}

// Simple similarity calculation using word overlap
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Batch analyze reviews for a business
export function analyzeBusinessReviews(
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    authorId: string;
    createdAt: string;
  }>
): {
  averageAuthenticityScore: number;
  flaggedReviews: string[];
  summary: string;
} {
  const analyses = reviews.map((review) =>
    analyzeReviewAuthenticity(review)
  );

  const averageScore = Math.round(
    analyses.reduce((sum, a) => sum + a.score.overall, 0) / analyses.length
  );

  const flaggedReviews = reviews
    .filter((_, i) => analyses[i].requiresManualReview)
    .map((r) => r.id);

  let summary = "";
  if (averageScore >= 80) {
    summary = "Overall review quality is excellent with strong authenticity indicators.";
  } else if (averageScore >= 60) {
    summary = "Review quality is good with minor concerns on some reviews.";
  } else {
    summary = `${flaggedReviews.length} reviews flagged for manual review.`;
  }

  return {
    averageAuthenticityScore: averageScore,
    flaggedReviews,
    summary,
  };
}
