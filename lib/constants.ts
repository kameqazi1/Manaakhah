export const BUSINESS_CATEGORIES = [
  { value: 'HALAL_FOOD', label: 'Halal Food' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'GROCERY', label: 'Grocery Store' },
  { value: 'MASJID', label: 'Masjid / Islamic Center' },
  { value: 'AUTO_REPAIR', label: 'Auto Repair' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'HANDYMAN', label: 'Handyman' },
  { value: 'TUTORING', label: 'Tutoring / Education' },
  { value: 'LEGAL_SERVICES', label: 'Legal Services' },
  { value: 'ACCOUNTING', label: 'Accounting / CPA' },
  { value: 'HEALTH_WELLNESS', label: 'Health & Wellness' },
  { value: 'BARBER_SALON', label: 'Barber / Salon' },
  { value: 'CHILDCARE', label: 'Childcare' },
  { value: 'COMMUNITY_AID', label: 'Community Aid' },
  { value: 'OTHER', label: 'Other Services' },
] as const;

export const BUSINESS_TAGS = [
  { value: 'MUSLIM_OWNED', label: 'Muslim-Owned', icon: '🕌' },
  { value: 'HALAL_VERIFIED', label: 'Halal Verified', icon: '✓' },
  { value: 'SISTERS_FRIENDLY', label: 'Sisters-Friendly', icon: '👩' },
  { value: 'KID_FRIENDLY', label: 'Kid-Friendly', icon: '👶' },
  { value: 'WHEELCHAIR_ACCESSIBLE', label: 'Wheelchair Accessible', icon: '♿' },
  { value: 'PRAYER_SPACE', label: 'Prayer Space Available', icon: '🤲' },
] as const;

export const REVIEW_TAGS = [
  { value: 'serviceQuality', label: 'Great Service' },
  { value: 'cleanliness', label: 'Very Clean' },
  { value: 'familyFriendly', label: 'Family-Friendly' },
  { value: 'authentic', label: 'Authentic' },
  { value: 'goodValue', label: 'Good Value' },
  { value: 'friendly', label: 'Friendly Staff' },
] as const;

export const DISTANCE_OPTIONS = [
  { value: '5', label: 'Within 5 miles' },
  { value: '10', label: 'Within 10 miles' },
  { value: '25', label: 'Within 25 miles' },
  { value: '50', label: 'Within 50 miles' },
] as const;

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const PRAYER_TIMES = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const;

// Fremont, CA coordinates (Bay Area)
export const DEFAULT_LOCATION = {
  latitude: 37.5485,
  longitude: -121.9886,
  city: 'Fremont, CA',
  zoom: 11,
} as const;

export const HALAL_CERTIFICATION_LEVELS = [
  { value: 'SELF_CERTIFIED', label: 'Self-Certified', description: 'Owner claims halal compliance', icon: '📝' },
  { value: 'COMMUNITY_VERIFIED', label: 'Community Verified', description: 'Verified by community members', icon: '👥' },
  { value: 'CERTIFIED_BODY', label: 'Certified Body', description: 'Certified by recognized halal authority', icon: '✅' },
  { value: 'ISNA_CERTIFIED', label: 'ISNA Certified', description: 'Islamic Society of North America certified', icon: '🏆' },
  { value: 'IFANCA_CERTIFIED', label: 'IFANCA Certified', description: 'Islamic Food and Nutrition Council certified', icon: '🏆' },
] as const;

export const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'newest', label: 'Newest' },
] as const;

export const PRICE_RANGES = [
  { value: 'BUDGET', label: '$', description: 'Budget-friendly' },
  { value: 'MODERATE', label: '$$', description: 'Moderate' },
  { value: 'PREMIUM', label: '$$$', description: 'Premium' },
  { value: 'LUXURY', label: '$$$$', description: 'Luxury' },
] as const;

export const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or misleading' },
  { value: 'FAKE', label: 'Fake or fraudulent' },
  { value: 'OFFENSIVE', label: 'Offensive content' },
  { value: 'IRRELEVANT', label: 'Not relevant' },
  { value: 'COMPETITOR', label: 'Competitor review' },
  { value: 'OTHER', label: 'Other reason' },
] as const;

export const DEAL_TYPES = [
  { value: 'PERCENTAGE_OFF', label: '% Off', icon: '%' },
  { value: 'FIXED_AMOUNT_OFF', label: '$ Off', icon: '$' },
  { value: 'BUY_ONE_GET_ONE', label: 'BOGO', icon: '2x' },
  { value: 'SPECIAL_PRICE', label: 'Special Price', icon: '★' },
  { value: 'FREE_ITEM', label: 'Free Item', icon: '🎁' },
] as const;

export const EVENT_TYPES = [
  { value: 'PROMOTION', label: 'Promotion', icon: '🎉' },
  { value: 'WORKSHOP', label: 'Workshop', icon: '📚' },
  { value: 'COMMUNITY', label: 'Community Event', icon: '👥' },
  { value: 'RELIGIOUS', label: 'Religious Event', icon: '🕌' },
  { value: 'CHARITY', label: 'Charity Event', icon: '❤️' },
] as const;
