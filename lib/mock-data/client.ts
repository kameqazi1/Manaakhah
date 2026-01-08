import { mockStorage } from "./storage";
import type {
  MockUser,
  MockBusiness,
  MockReview,
  MockScrapedBusiness,
  MockConversation,
  MockMessage,
} from "./types";

/**
 * Mock database client that mimics Prisma's API
 * Supports basic CRUD operations on in-memory data
 */

export const mockDb = {
  user: {
    findUnique: ({ where }: { where: { id?: string; email?: string } }) => {
      const users = mockStorage.getUsers();
      if (where.id) {
        return users.find((u) => u.id === where.id) || null;
      }
      if (where.email) {
        return users.find((u) => u.email === where.email) || null;
      }
      return null;
    },

    findMany: () => {
      return mockStorage.getUsers();
    },

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

    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<MockUser>;
    }) => {
      const users = mockStorage.getUsers();
      const index = users.findIndex((u) => u.id === where.id);
      if (index === -1) throw new Error("User not found");

      users[index] = {
        ...users[index],
        ...data,
        updatedAt: new Date(),
      };
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
      let business;

      if (where.id) {
        business = businesses.find((b) => b.id === where.id);
      } else if (where.slug) {
        business = businesses.find((b) => b.slug === where.slug);
      }

      if (!business) return null;

      // Handle includes
      if (include) {
        const result: any = { ...business };

        if (include.owner) {
          const users = mockStorage.getUsers();
          result.owner = users.find((u) => u.id === business.ownerId);
        }

        if (include.reviews) {
          const reviews = mockStorage.getReviews();
          result.reviews = reviews.filter((r) => r.businessId === business.id).map((review) => {
            if (include.reviews.include?.user) {
              const users = mockStorage.getUsers();
              return {
                ...review,
                user: users.find((u) => u.id === review.userId),
              };
            }
            return review;
          });
        }

        if (include.tags) {
          result.tags = business.tags.map((tag) => ({ tag }));
        }

        if (include.photos) {
          result.photos = business.photos.map((url, index) => ({
            id: `photo-${index}`,
            url,
            order: index,
          }));
        }

        return result;
      }

      return business;
    },

    findMany: ({ where, include, orderBy, take }: { where?: any; include?: any; orderBy?: any; take?: number }) => {
      let businesses = mockStorage.getBusinesses();

      // Apply filters
      if (where) {
        if (where.status) {
          businesses = businesses.filter((b) => b.status === where.status);
        }
        if (where.category) {
          businesses = businesses.filter((b) => b.category === where.category);
        }
        if (where.ownerId) {
          businesses = businesses.filter((b) => b.ownerId === where.ownerId);
        }
        if (where.OR) {
          // Handle search
          const searchTerms = where.OR;
          businesses = businesses.filter((b) => {
            return searchTerms.some((term: any) => {
              if (term.name?.contains) {
                return b.name.toLowerCase().includes(term.name.contains.toLowerCase());
              }
              if (term.description?.contains) {
                return b.description.toLowerCase().includes(term.description.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        if (where.tags?.some) {
          // Handle tag filtering
          const tagFilter = where.tags.some.tag.in;
          businesses = businesses.filter((b) =>
            b.tags.some((tag) => tagFilter.includes(tag))
          );
        }
      }

      // Apply ordering
      if (orderBy) {
        if (orderBy.createdAt === "desc") {
          businesses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (orderBy.createdAt === "asc") {
          businesses.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
      }

      // Apply limit
      if (take) {
        businesses = businesses.slice(0, take);
      }

      // Handle includes
      return businesses.map((business) => {
        if (!include) return business;

        const result: any = { ...business };

        if (include.owner) {
          const users = mockStorage.getUsers();
          result.owner = users.find((u) => u.id === business.ownerId);
        }

        if (include.reviews) {
          const reviews = mockStorage.getReviews();
          result.reviews = reviews.filter((r) => r.businessId === business.id);
        }

        if (include.tags) {
          result.tags = business.tags.map((tag) => ({ tag }));
        }

        if (include.photos) {
          result.photos = business.photos.map((url, index) => ({
            id: `photo-${index}`,
            url,
            order: index,
          }));
        }

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

    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<MockBusiness>;
    }) => {
      const businesses = mockStorage.getBusinesses();
      const index = businesses.findIndex((b) => b.id === where.id);
      if (index === -1) throw new Error("Business not found");

      businesses[index] = {
        ...businesses[index],
        ...data,
        updatedAt: new Date(),
      };
      mockStorage.setBusinesses(businesses);
      return businesses[index];
    },

    delete: ({ where }: { where: { id: string } }) => {
      const businesses = mockStorage.getBusinesses();
      const filtered = businesses.filter((b) => b.id !== where.id);
      mockStorage.setBusinesses(filtered);
      return { count: businesses.length - filtered.length };
    },
  },

  review: {
    findMany: ({ where, include }: { where?: any; include?: any }) => {
      let reviews = mockStorage.getReviews();

      if (where?.businessId) {
        reviews = reviews.filter((r) => r.businessId === where.businessId);
      }

      if (include?.user) {
        const users = mockStorage.getUsers();
        return reviews.map((review) => ({
          ...review,
          user: users.find((u) => u.id === review.userId),
        }));
      }

      return reviews;
    },

    create: ({ data }: { data: Partial<MockReview> }) => {
      const reviews = mockStorage.getReviews();
      const newReview: MockReview = {
        id: mockStorage.generateId("review"),
        businessId: data.businessId!,
        userId: data.userId!,
        rating: data.rating!,
        text: data.text!,
        tags: data.tags || null,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [],
      };
      reviews.push(newReview);
      mockStorage.setReviews(reviews);
      return newReview;
    },
  },

  scrapedBusiness: {
    findMany: ({ where, orderBy }: { where?: any; orderBy?: any }) => {
      let scraped = mockStorage.getScrapedBusinesses();

      if (where?.status) {
        scraped = scraped.filter((s) => s.status === where.status);
      }

      if (orderBy?.scrapedAt === "desc") {
        scraped.sort((a, b) => b.scrapedAt.getTime() - a.scrapedAt.getTime());
      }

      return scraped;
    },

    findUnique: ({ where }: { where: { id: string } }) => {
      return mockStorage.getScrapedBusinesses().find((s) => s.id === where.id) || null;
    },

    create: ({ data }: { data: Partial<MockScrapedBusiness> }) => {
      const scraped = mockStorage.getScrapedBusinesses();
      const newScraped: MockScrapedBusiness = {
        id: mockStorage.generateId("scraped"),
        name: data.name!,
        address: data.address!,
        city: data.city!,
        state: data.state!,
        zipCode: data.zipCode!,
        latitude: data.latitude!,
        longitude: data.longitude!,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        category: data.category!,
        description: data.description!,
        services: data.services || [],
        suggestedTags: data.suggestedTags || [],
        source: data.source!,
        sourceUrl: data.sourceUrl!,
        confidence: data.confidence || 50,
        signals: data.signals || [],
        status: "PENDING",
        reviewedBy: null,
        reviewNote: null,
        scrapedAt: new Date(),
        reviewedAt: null,
      };
      scraped.push(newScraped);
      mockStorage.setScrapedBusinesses(scraped);
      return newScraped;
    },

    update: ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<MockScrapedBusiness>;
    }) => {
      const scraped = mockStorage.getScrapedBusinesses();
      const index = scraped.findIndex((s) => s.id === where.id);
      if (index === -1) throw new Error("Scraped business not found");

      scraped[index] = {
        ...scraped[index],
        ...data,
      };
      mockStorage.setScrapedBusinesses(scraped);
      return scraped[index];
    },

    delete: ({ where }: { where: { id: string } }) => {
      const scraped = mockStorage.getScrapedBusinesses();
      const filtered = scraped.filter((s) => s.id !== where.id);
      mockStorage.setScrapedBusinesses(filtered);
      return { count: scraped.length - filtered.length };
    },
  },
};
