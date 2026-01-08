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
