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

export type ScrapedBusinessClaimStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type ReviewStatus = "PUBLISHED" | "PENDING" | "FLAGGED" | "HIDDEN" | "DELETED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "REFUNDED";
export type ConversationStatus = "OPEN" | "RESOLVED" | "CLOSED" | "ARCHIVED";
export type PostType = "ANNOUNCEMENT" | "EVENT" | "RESOURCE" | "QUESTION" | "DISCUSSION" | "PROMOTION";
export type PostStatus = "DRAFT" | "PUBLISHED" | "FLAGGED" | "HIDDEN" | "DELETED";
export type CommentStatus = "PUBLISHED" | "HIDDEN" | "DELETED";
export type ReportReason = "SPAM" | "FAKE" | "OFFENSIVE" | "IRRELEVANT" | "COMPETITOR" | "OTHER";
export type ReportStatus = "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
export type ViewSource = "MAP" | "SEARCH" | "PROFILE" | "RECOMMENDATION" | "COMMUNITY";
export type PriceRange = "BUDGET" | "MODERATE" | "PREMIUM" | "LUXURY";
export type ClaimStatus = "UNCLAIMED" | "CLAIMED" | "DISPUTED";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  shortDescription?: string | null;
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
  serviceList: string[];
  status: BusinessStatus;

  priceRange?: PriceRange | null;
  hoursOfOperation?: any;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  viewCount: number;
  claimStatus: ClaimStatus;
  coverImage?: string | null;
  logoImage?: string | null;
  scrapedFrom?: string | null;
  scrapedAt?: Date | null;
  confidenceScore?: number | null;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown?: any;
  isScraped?: boolean;
  scrapedBusinessId?: string | null;

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
  bookingId?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  text?: string;
  photos: string[];
  tags?: any;

  isVerified: boolean;
  verifiedAt?: Date | null;
  helpfulCount: number;
  reportCount: number;

  ownerResponse?: string | null;
  respondedAt?: Date | null;

  status: ReviewStatus;
  flagReason?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface MockScrapedBusiness {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  category: BusinessCategory;
  description: string | null;
  sourceUrl: string;
  scrapedAt: Date;
  claimStatus: ScrapedBusinessClaimStatus;
  reviewedAt: Date | null;
  metadata: any; // Stores source, confidence, signals, etc.
}

export interface MockConversation {
  id: string;
  businessId: string;
  customerId: string;
  subject?: string | null;
  status: ConversationStatus;
  lastMessageAt: Date;
  unreadByCustomer: number;
  unreadByBusiness: number;
  isBlocked: boolean;
  blockedBy?: string | null;
  blockedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  text?: string;
  attachments: string[];
  read: boolean;
  readAt?: Date | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  isFlagged: boolean;
  flagReason?: string | null;
  createdAt: Date;
}

export interface MockBooking {
  id: string;
  businessId: string;
  customerId: string;
  serviceType: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  notes?: string | null;

  status: BookingStatus;
  statusHistory: any[];

  ownerNotes?: string | null;
  rejectionReason?: string | null;

  reminderSent: boolean;
  reminderSentAt?: Date | null;

  price?: number | null;
  paymentStatus: PaymentStatus;
  paymentId?: string | null;

  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface MockCommunityPost {
  id: string;
  authorId: string;
  businessId?: string | null;
  title: string;
  content: string;
  postType: PostType;
  media: string[];
  tags: string[];

  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;

  status: PostStatus;
  isPinned: boolean;
  flagCount: number;

  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockPostComment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  likeCount: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBusinessView {
  id: string;
  businessId: string;
  userId?: string | null;
  source: ViewSource;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
}

export interface MockDatabase {
  users: MockUser[];
  businesses: MockBusiness[];
  reviews: MockReview[];
  scrapedBusinesses: MockScrapedBusiness[];
  conversations: MockConversation[];
  messages: MockMessage[];
  bookings: MockBooking[];
  communityPosts: MockCommunityPost[];
  postComments: MockPostComment[];
  businessViews: MockBusinessView[];
}
