// Mock data types that mirror Prisma schema

export type UserRole = "CONSUMER" | "BUSINESS_OWNER" | "ADMIN";
export type BusinessStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
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
  | "OTHER";

export type BusinessTag =
  | "MUSLIM_OWNED"
  | "HALAL_VERIFIED"
  | "SISTERS_FRIENDLY"
  | "KID_FRIENDLY"
  | "WHEELCHAIR_ACCESSIBLE"
  | "PRAYER_SPACE";

export type ScrapedBusinessStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBusiness {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  category: BusinessCategory;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  website: string | null;
  hours: any;
  services: string[];
  status: BusinessStatus;
  prayerTimes: any;
  jummahTime: string | null;
  aidServices: string[];
  externalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: BusinessTag[];
  photos: string[];
}

export interface MockReview {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  text: string;
  tags: any;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  photos: string[];
}

export interface MockScrapedBusiness {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  category: BusinessCategory;
  description: string;
  services: string[];
  suggestedTags: BusinessTag[];
  source: string; // "google_maps" | "yelp" | "zabihah" | "manual"
  sourceUrl: string;
  confidence: number; // 0-100 - how confident we are this is Muslim-owned
  signals: string[]; // Keywords found that suggest Muslim ownership
  status: ScrapedBusinessStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  scrapedAt: Date;
  reviewedAt: Date | null;
}

export interface MockConversation {
  id: string;
  businessId: string;
  consumerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: Date;
}

export interface MockDatabase {
  users: MockUser[];
  businesses: MockBusiness[];
  reviews: MockReview[];
  scrapedBusinesses: MockScrapedBusiness[];
  conversations: MockConversation[];
  messages: MockMessage[];
}
