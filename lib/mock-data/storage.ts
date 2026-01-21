import { MockDatabase } from "./types";

// Empty initial data - no seed data
const emptyMockData: MockDatabase = {
  users: [],
  businesses: [],
  reviews: [],
  scrapedBusinesses: [],
  conversations: [],
  messages: [],
  bookings: [],
  communityPosts: [],
  postComments: [],
  businessViews: [],
  services: [],
  businessAvailabilities: [],
  availabilityExceptions: [],
};

/**
 * In-memory storage for mock data
 * This acts as our "database" when USE_MOCK_DATA=true
 */
class MockStorage {
  private data: MockDatabase;

  constructor() {
    // Load from localStorage if in browser, otherwise use empty data
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("manakhaah-mock-data");
      this.data = stored ? JSON.parse(stored, this.dateReviver) : { ...emptyMockData };
    } else {
      this.data = { ...emptyMockData };
    }
  }

  // Helper to parse dates from JSON
  private dateReviver(key: string, value: any) {
    const dateFields = [
      "createdAt",
      "updatedAt",
      "emailVerified",
      "scrapedAt",
      "reviewedAt",
    ];
    if (dateFields.includes(key) && value) {
      return new Date(value);
    }
    return value;
  }

  // Get the entire database
  getAll(): MockDatabase {
    return this.data;
  }

  // Get specific collections
  getUsers() {
    return this.data.users;
  }

  getBusinesses() {
    return this.data.businesses;
  }

  getReviews() {
    return this.data.reviews;
  }

  getScrapedBusinesses() {
    return this.data.scrapedBusinesses;
  }

  getConversations() {
    return this.data.conversations;
  }

  getMessages() {
    return this.data.messages;
  }

  getBookings() {
    return this.data.bookings;
  }

  getCommunityPosts() {
    return this.data.communityPosts;
  }

  getPostComments() {
    return this.data.postComments;
  }

  getBusinessViews() {
    return this.data.businessViews;
  }

  getServices() {
    return this.data.services;
  }

  getBusinessAvailabilities() {
    return this.data.businessAvailabilities;
  }

  getAvailabilityExceptions() {
    return this.data.availabilityExceptions;
  }

  // Update the entire database
  setAll(data: MockDatabase) {
    this.data = data;
    this.persist();
  }

  // Update specific collections
  setUsers(users: typeof this.data.users) {
    this.data.users = users;
    this.persist();
  }

  setBusinesses(businesses: typeof this.data.businesses) {
    this.data.businesses = businesses;
    this.persist();
  }

  setReviews(reviews: typeof this.data.reviews) {
    this.data.reviews = reviews;
    this.persist();
  }

  setScrapedBusinesses(scrapedBusinesses: typeof this.data.scrapedBusinesses) {
    this.data.scrapedBusinesses = scrapedBusinesses;
    this.persist();
  }

  setConversations(conversations: typeof this.data.conversations) {
    this.data.conversations = conversations;
    this.persist();
  }

  setMessages(messages: typeof this.data.messages) {
    this.data.messages = messages;
    this.persist();
  }

  setBookings(bookings: typeof this.data.bookings) {
    this.data.bookings = bookings;
    this.persist();
  }

  setCommunityPosts(posts: typeof this.data.communityPosts) {
    this.data.communityPosts = posts;
    this.persist();
  }

  setPostComments(comments: typeof this.data.postComments) {
    this.data.postComments = comments;
    this.persist();
  }

  setBusinessViews(views: typeof this.data.businessViews) {
    this.data.businessViews = views;
    this.persist();
  }

  setServices(services: typeof this.data.services) {
    this.data.services = services;
    this.persist();
  }

  setBusinessAvailabilities(availabilities: typeof this.data.businessAvailabilities) {
    this.data.businessAvailabilities = availabilities;
    this.persist();
  }

  setAvailabilityExceptions(exceptions: typeof this.data.availabilityExceptions) {
    this.data.availabilityExceptions = exceptions;
    this.persist();
  }

  // Persist to localStorage (browser only)
  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem("manakhaah-mock-data", JSON.stringify(this.data));
    }
  }

  // Reset to empty data
  reset() {
    this.data = { ...emptyMockData };
    this.persist();
  }

  // Generate a simple ID
  generateId(prefix: string = "id"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const mockStorage = new MockStorage();
