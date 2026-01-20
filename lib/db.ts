/**
 * Database client that switches between Prisma and Mock data
 * based on USE_MOCK_DATA environment variable
 *
 * Uses lazy loading to avoid database connections during build time
 */

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

// Helper to check if we're using mock data
export const isMockMode = () => USE_MOCK_DATA;

// Lazy-loaded database client - only connects when actually used
function getDb() {
  if (USE_MOCK_DATA) {
    const { mockDb } = require("./mock-data/client");
    return mockDb;
  } else {
    const { getPrisma } = require("./prisma");
    return getPrisma();
  }
}

// Proxy that lazily initializes the database client on first access
// This prevents any database connection during Vercel build time
export const db = new Proxy({} as any, {
  get(_, prop) {
    return getDb()[prop];
  },
});
