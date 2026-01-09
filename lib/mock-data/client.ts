import { mockStorage } from "./storage";
import type {
  MockUser,
  MockBusiness,
  MockReview,
  MockScrapedBusiness,
  MockConversation,
  MockMessage,
  MockBooking,
  MockCommunityPost,
  MockPostComment,
  MockBusinessView,
} from "./types";

/**
 * Mock database client that mimics Prisma's API
 * Supports basic CRUD operations on in-memory data
 */

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const mockDb = {
  user: {
    findUnique: ({ where }: { where: { id?: string; email?: string } }) => {
      const users = mockStorage.getUsers();
      if (where.id) return users.find((u) => u.id === where.id) || null;
      if (where.email) return users.find((u) => u.email === where.email) || null;
      return null;
    },
    findMany: () => mockStorage.getUsers(),
    create: ({ data }: { data: Partial<MockUser> }) => {
      const users = mockStorage.getUsers();
      const newUser: MockUser = {
        id: mockStorage.generateId("user"),
        email: data.email!,
        password: data.password!,
        name: data.name || null,
        phone: data.phone || null,
        role: data.role || "CONSUMER",
        image: data.image || null,
        emailVerified: data.emailVerified || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(newUser);
      mockStorage.setUsers(users);
      return newUser;
    },
    update: ({ where, data }: { where: { id: string }; data: Partial<MockUser> }) => {
      const users = mockStorage.getUsers();
      const index = users.findIndex((u) => u.id === where.id);
      if (index === -1) throw new Error("User not found");
      users[index] = { ...users[index], ...data, updatedAt: new Date() };
      mockStorage.setUsers(users);
      return users[index];
    },
    delete: ({ where }: { where: { id: string } }) => {
      const users = mockStorage.getUsers();
      const filtered = users.filter((u) => u.id !== where.id);
      mockStorage.setUsers(filtered);
      return { count: users.length - filtered.length };
    },
  },

  business: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string }; include?: any }) => {
      const businesses = mockStorage.getBusinesses();
      let business = where.id
        ? businesses.find((b) => b.id === where.id)
        : where.slug
        ? businesses.find((b) => b.slug === where.slug)
        : null;

      if (!business) return null;

      if (include) {
        const result: any = { ...business };
        if (include.owner) {
          result.owner = mockStorage.getUsers().find((u) => u.id === business!.ownerId);
        }
        if (include.reviews) {
          const reviews = mockStorage.getReviews().filter((r) => r.businessId === business!.id);
          result.reviews = include.reviews.include?.user
            ? reviews.map((r) => ({ ...r, user: mockStorage.getUsers().find((u) => u.id === r.userId) }))
            : reviews;
        }
        if (include.tags) result.tags = business!.tags.map((tag) => ({ tag }));
        if (include.photos) result.photos = business!.photos.map((url, i) => ({ id: `photo-${i}`, url, order: i }));
        return result;
      }
      return business;
    },

    findMany: ({ where, include, orderBy, take }: { where?: any; include?: any; orderBy?: any; take?: number }) => {
      let businesses = mockStorage.getBusinesses();

      // Filters
      if (where) {
        if (where.status) businesses = businesses.filter((b) => b.status === where.status);
        if (where.category) businesses = businesses.filter((b) => b.category === where.category);
        if (where.ownerId) businesses = businesses.filter((b) => b.ownerId === where.ownerId);
        if (where.verificationStatus) businesses = businesses.filter((b) => b.verificationStatus === where.verificationStatus);
        if (where.OR) {
          businesses = businesses.filter((b) =>
            where.OR.some((term: any) =>
              (term.name?.contains && b.name.toLowerCase().includes(term.name.contains.toLowerCase())) ||
              (term.description?.contains && b.description.toLowerCase().includes(term.description.contains.toLowerCase()))
            )
          );
        }
        if (where.tags?.some) {
          const tagFilter = where.tags.some.tag.in;
          businesses = businesses.filter((b) => b.tags.some((tag) => tagFilter.includes(tag)));
        }
      }

      // Ordering
      if (orderBy) {
        if (orderBy.createdAt) businesses.sort((a, b) => orderBy.createdAt === "desc" ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime());
        if (orderBy.averageRating) businesses.sort((a, b) => orderBy.averageRating === "desc" ? (b.averageRating || 0) - (a.averageRating || 0) : (a.averageRating || 0) - (b.averageRating || 0));
      }

      if (take) businesses = businesses.slice(0, take);

      return businesses.map((b) => {
        if (!include) return b;
        const result: any = { ...b };
        if (include.owner) result.owner = mockStorage.getUsers().find((u) => u.id === b.ownerId);
        if (include.reviews) result.reviews = mockStorage.getReviews().filter((r) => r.businessId === b.id);
        if (include.tags) result.tags = b.tags.map((tag) => ({ tag }));
        if (include.photos) result.photos = b.photos.map((url, i) => ({ id: `photo-${i}`, url, order: i }));
        return result;
      });
    },

    create: ({ data }: { data: Partial<MockBusiness> }) => {
      const businesses = mockStorage.getBusinesses();
      const newBusiness: MockBusiness = {
        id: mockStorage.generateId("biz"),
        ownerId: data.ownerId!,
        name: data.name!,
        slug: data.slug!,
        description: data.description!,
        shortDescription: data.shortDescription || null,
        category: data.category!,
        address: data.address!,
        city: data.city!,
        state: data.state || "CA",
        zipCode: data.zipCode!,
        latitude: data.latitude!,
        longitude: data.longitude!,
        phone: data.phone!,
        email: data.email || null,
        website: data.website || null,
        hours: data.hours || null,
        services: data.services || [],
        status: data.status || "DRAFT",
        priceRange: data.priceRange || null,
        hoursOfOperation: data.hoursOfOperation || null,
        verificationStatus: data.verificationStatus || "PENDING",
        verifiedAt: data.verifiedAt || null,
        verifiedBy: data.verifiedBy || null,
        viewCount: data.viewCount || 0,
        claimStatus: data.claimStatus || "UNCLAIMED",
        coverImage: data.coverImage || null,
        logoImage: data.logoImage || null,
        scrapedFrom: data.scrapedFrom || null,
        scrapedAt: data.scrapedAt || null,
        confidenceScore: data.confidenceScore || null,
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        ratingBreakdown: data.ratingBreakdown || null,
        prayerTimes: data.prayerTimes || null,
        jummahTime: data.jummahTime || null,
        aidServices: data.aidServices || [],
        externalUrl: data.externalUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        photos: [],
      };
      businesses.push(newBusiness);
      mockStorage.setBusinesses(businesses);
      return newBusiness;
    },

    update: ({ where, data }: { where: { id: string }; data: Partial<MockBusiness> }) => {
      const businesses = mockStorage.getBusinesses();
      const index = businesses.findIndex((b) => b.id === where.id);
      if (index === -1) throw new Error("Business not found");
      businesses[index] = { ...businesses[index], ...data, updatedAt: new Date() };
      mockStorage.setBusinesses(businesses);
      return businesses[index];
    },

    delete: ({ where }: { where: { id: string } }) => {
      const businesses = mockStorage.getBusinesses();
      const filtered = businesses.filter((b) => b.id !== where.id);
      mockStorage.setBusinesses(filtered);
      return { count: businesses.length - filtered.length };
    },

    // Location-based search
    findNearby: ({ lat, lng, radius, where }: { lat: number; lng: number; radius: number; where?: any }) => {
      let businesses = mockStorage.getBusinesses().filter((b) => b.status === "PUBLISHED");

      if (where) {
        if (where.category) businesses = businesses.filter((b) => b.category === where.category);
        if (where.verificationStatus) businesses = businesses.filter((b) => b.verificationStatus === where.verificationStatus);
      }

      return businesses
        .map((b) => ({
          ...b,
          distance: calculateDistance(lat, lng, b.latitude, b.longitude),
        }))
        .filter((b) => b.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    },
  },

  review: {
    findMany: ({ where, include, orderBy, take }: { where?: any; include?: any; orderBy?: any; take?: number }) => {
      let reviews = mockStorage.getReviews();

      if (where) {
        if (where.businessId) reviews = reviews.filter((r) => r.businessId === where.businessId);
        if (where.userId) reviews = reviews.filter((r) => r.userId === where.userId);
        if (where.rating) reviews = reviews.filter((r) => r.rating === where.rating);
        if (where.status) reviews = reviews.filter((r) => r.status === where.status);
        if (where.isVerified !== undefined) reviews = reviews.filter((r) => r.isVerified === where.isVerified);
      }

      if (orderBy) {
        if (orderBy.createdAt) reviews.sort((a, b) => orderBy.createdAt === "desc" ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime());
        if (orderBy.helpfulCount) reviews.sort((a, b) => orderBy.helpfulCount === "desc" ? b.helpfulCount - a.helpfulCount : a.helpfulCount - b.helpfulCount);
      }

      if (take) reviews = reviews.slice(0, take);

      return reviews.map((r) => {
        if (!include) return r;
        const result: any = { ...r };
        if (include.user) result.user = mockStorage.getUsers().find((u) => u.id === r.userId);
        if (include.business) result.business = mockStorage.getBusinesses().find((b) => b.id === r.businessId);
        return result;
      });
    },

    create: ({ data }: { data: Partial<MockReview> }) => {
      const reviews = mockStorage.getReviews();
      const newReview: MockReview = {
        id: mockStorage.generateId("review"),
        businessId: data.businessId!,
        userId: data.userId!,
        bookingId: data.bookingId || null,
        rating: data.rating!,
        title: data.title || null,
        content: data.content!,
        text: data.text || data.content!,
        photos: data.photos || [],
        tags: data.tags || null,
        isVerified: data.isVerified || false,
        verifiedAt: data.verifiedAt || null,
        helpfulCount: data.helpfulCount || 0,
        reportCount: data.reportCount || 0,
        ownerResponse: data.ownerResponse || null,
        respondedAt: data.respondedAt || null,
        status: data.status || "PUBLISHED",
        flagReason: data.flagReason || null,
        moderatedBy: data.moderatedBy || null,
        moderatedAt: data.moderatedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      reviews.push(newReview);
      mockStorage.setReviews(reviews);

      // Update business rating
      const businesses = mockStorage.getBusinesses();
      const businessIndex = businesses.findIndex((b) => b.id === data.businessId);
      if (businessIndex !== -1) {
        const businessReviews = reviews.filter((r) => r.businessId === data.businessId && r.status === "PUBLISHED");
        const avgRating = businessReviews.reduce((sum, r) => sum + r.rating, 0) / businessReviews.length;
        businesses[businessIndex].averageRating = Math.round(avgRating * 10) / 10;
        businesses[businessIndex].totalReviews = businessReviews.length;
        mockStorage.setBusinesses(businesses);
      }

      return newReview;
    },

    update: ({ where, data }: { where: { id: string }; data: Partial<MockReview> }) => {
      const reviews = mockStorage.getReviews();
      const index = reviews.findIndex((r) => r.id === where.id);
      if (index === -1) throw new Error("Review not found");
      reviews[index] = { ...reviews[index], ...data, updatedAt: new Date() };
      mockStorage.setReviews(reviews);
      return reviews[index];
    },

    delete: ({ where }: { where: { id: string } }) => {
      const reviews = mockStorage.getReviews();
      const filtered = reviews.filter((r) => r.id !== where.id);
      mockStorage.setReviews(filtered);
      return { count: reviews.length - filtered.length };
    },
  },

  booking: {
    findMany: ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any }) => {
      let bookings = mockStorage.getBookings();

      if (where) {
        if (where.businessId) bookings = bookings.filter((b) => b.businessId === where.businessId);
        if (where.customerId) bookings = bookings.filter((b) => b.customerId === where.customerId);
        if (where.status) bookings = bookings.filter((b) => b.status === where.status);
      }

      if (orderBy?.appointmentDate) {
        bookings.sort((a, b) => orderBy.appointmentDate === "desc"
          ? b.appointmentDate.getTime() - a.appointmentDate.getTime()
          : a.appointmentDate.getTime() - b.appointmentDate.getTime()
        );
      }

      return bookings.map((b) => {
        if (!include) return b;
        const result: any = { ...b };
        if (include.business) result.business = mockStorage.getBusinesses().find((bus) => bus.id === b.businessId);
        if (include.customer) result.customer = mockStorage.getUsers().find((u) => u.id === b.customerId);
        return result;
      });
    },

    create: ({ data }: { data: Partial<MockBooking> }) => {
      const bookings = mockStorage.getBookings();
      const newBooking: MockBooking = {
        id: mockStorage.generateId("booking"),
        businessId: data.businessId!,
        customerId: data.customerId!,
        serviceType: data.serviceType!,
        appointmentDate: data.appointmentDate!,
        appointmentTime: data.appointmentTime!,
        duration: data.duration!,
        notes: data.notes || null,
        status: data.status || "PENDING",
        statusHistory: data.statusHistory || [],
        ownerNotes: data.ownerNotes || null,
        rejectionReason: data.rejectionReason || null,
        reminderSent: data.reminderSent || false,
        reminderSentAt: data.reminderSentAt || null,
        price: data.price || null,
        paymentStatus: data.paymentStatus || "NOT_REQUIRED",
        paymentId: data.paymentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: data.confirmedAt || null,
        completedAt: data.completedAt || null,
        cancelledAt: data.cancelledAt || null,
      };
      bookings.push(newBooking);
      mockStorage.setBookings(bookings);
      return newBooking;
    },

    update: ({ where, data }: { where: { id: string }; data: Partial<MockBooking> }) => {
      const bookings = mockStorage.getBookings();
      const index = bookings.findIndex((b) => b.id === where.id);
      if (index === -1) throw new Error("Booking not found");
      bookings[index] = { ...bookings[index], ...data, updatedAt: new Date() };
      mockStorage.setBookings(bookings);
      return bookings[index];
    },
  },

  conversation: {
    findMany: ({ where, include }: { where?: any; include?: any }) => {
      let conversations = mockStorage.getConversations();

      if (where) {
        if (where.businessId) conversations = conversations.filter((c) => c.businessId === where.businessId);
        if (where.customerId) conversations = conversations.filter((c) => c.customerId === where.customerId);
        if (where.status) conversations = conversations.filter((c) => c.status === where.status);
      }

      conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      return conversations.map((c) => {
        if (!include) return c;
        const result: any = { ...c };
        if (include.business) result.business = mockStorage.getBusinesses().find((b) => b.id === c.businessId);
        if (include.customer) result.customer = mockStorage.getUsers().find((u) => u.id === c.customerId);
        if (include.messages) result.messages = mockStorage.getMessages().filter((m) => m.conversationId === c.id);
        return result;
      });
    },

    findUnique: ({ where, include }: { where: { id: string }; include?: any }) => {
      const conversation = mockStorage.getConversations().find((c) => c.id === where.id);
      if (!conversation) return null;

      if (!include) return conversation;
      const result: any = { ...conversation };
      if (include.business) result.business = mockStorage.getBusinesses().find((b) => b.id === conversation.businessId);
      if (include.customer) result.customer = mockStorage.getUsers().find((u) => u.id === conversation.customerId);
      if (include.messages) result.messages = mockStorage.getMessages().filter((m) => m.conversationId === conversation.id);
      return result;
    },

    create: ({ data }: { data: Partial<MockConversation> }) => {
      const conversations = mockStorage.getConversations();
      const newConversation: MockConversation = {
        id: mockStorage.generateId("conv"),
        businessId: data.businessId!,
        customerId: data.customerId!,
        subject: data.subject || null,
        status: data.status || "OPEN",
        lastMessageAt: new Date(),
        unreadByCustomer: 0,
        unreadByBusiness: 0,
        isBlocked: false,
        blockedBy: null,
        blockedReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      conversations.push(newConversation);
      mockStorage.setConversations(conversations);
      return newConversation;
    },

    update: ({ where, data }: { where: { id: string }; data: Partial<MockConversation> }) => {
      const conversations = mockStorage.getConversations();
      const index = conversations.findIndex((c) => c.id === where.id);
      if (index === -1) throw new Error("Conversation not found");
      conversations[index] = { ...conversations[index], ...data, updatedAt: new Date() };
      mockStorage.setConversations(conversations);
      return conversations[index];
    },
  },

  message: {
    findMany: ({ where, orderBy }: { where?: any; orderBy?: any }) => {
      let messages = mockStorage.getMessages();

      if (where?.conversationId) {
        messages = messages.filter((m) => m.conversationId === where.conversationId);
      }

      if (orderBy?.createdAt) {
        messages.sort((a, b) => orderBy.createdAt === "desc"
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime()
        );
      }

      return messages;
    },

    create: ({ data }: { data: Partial<MockMessage> }) => {
      const messages = mockStorage.getMessages();
      const newMessage: MockMessage = {
        id: mockStorage.generateId("msg"),
        conversationId: data.conversationId!,
        senderId: data.senderId!,
        content: data.content!,
        text: data.text || data.content!,
        attachments: data.attachments || [],
        read: false,
        readAt: null,
        editedAt: null,
        deletedAt: null,
        isFlagged: false,
        flagReason: null,
        createdAt: new Date(),
      };
      messages.push(newMessage);
      mockStorage.setMessages(messages);

      // Update conversation lastMessageAt
      const conversations = mockStorage.getConversations();
      const convIndex = conversations.findIndex((c) => c.id === data.conversationId);
      if (convIndex !== -1) {
        conversations[convIndex].lastMessageAt = new Date();
        conversations[convIndex].updatedAt = new Date();
        mockStorage.setConversations(conversations);
      }

      return newMessage;
    },
  },

  communityPost: {
    findMany: ({ where, orderBy, take }: { where?: any; orderBy?: any; take?: number }) => {
      let posts = mockStorage.getCommunityPosts();

      if (where) {
        if (where.status) posts = posts.filter((p) => p.status === where.status);
        if (where.postType) posts = posts.filter((p) => p.postType === where.postType);
        if (where.authorId) posts = posts.filter((p) => p.authorId === where.authorId);
        if (where.businessId) posts = posts.filter((p) => p.businessId === where.businessId);
      }

      if (orderBy?.publishedAt) {
        posts.sort((a, b) => orderBy.publishedAt === "desc"
          ? b.publishedAt.getTime() - a.publishedAt.getTime()
          : a.publishedAt.getTime() - b.publishedAt.getTime()
        );
      }

      if (take) posts = posts.slice(0, take);

      return posts;
    },

    create: ({ data }: { data: Partial<MockCommunityPost> }) => {
      const posts = mockStorage.getCommunityPosts();
      const newPost: MockCommunityPost = {
        id: mockStorage.generateId("post"),
        authorId: data.authorId!,
        businessId: data.businessId || null,
        title: data.title!,
        content: data.content!,
        postType: data.postType!,
        media: data.media || [],
        tags: data.tags || [],
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        status: data.status || "PUBLISHED",
        isPinned: false,
        flagCount: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      posts.push(newPost);
      mockStorage.setCommunityPosts(posts);
      return newPost;
    },
  },

  scrapedBusiness: {
    findMany: ({ where }: { where?: any }) => {
      let scraped = mockStorage.getScrapedBusinesses();
      if (where?.status) scraped = scraped.filter((s) => s.status === where.status);
      return scraped;
    },

    update: ({ where, data }: { where: { id: string }; data: Partial<MockScrapedBusiness> }) => {
      const scraped = mockStorage.getScrapedBusinesses();
      const index = scraped.findIndex((s) => s.id === where.id);
      if (index === -1) throw new Error("Scraped business not found");
      scraped[index] = { ...scraped[index], ...data };
      mockStorage.setScrapedBusinesses(scraped);
      return scraped[index];
    },
  },
};
