/**
 * Database client that switches between Prisma and Mock data
 * based on USE_MOCK_DATA environment variable
 *
 * Uses lazy loading to avoid database connections during build time
 */

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

// Helper to check if we're using mock data
export const isMockMode = () => USE_MOCK_DATA;

// Lazy-loaded database client
let _db: any = null;

function getDb() {
  if (_db) return _db;

  if (USE_MOCK_DATA) {
    console.log("🔧 Using MOCK DATA - no database required");
    const { mockDb } = require("./mock-data/client");
    _db = mockDb;
  } else {
    console.log("🗄️  Using REAL DATABASE - Prisma client");
    const { prisma } = require("./prisma");
    _db = prisma;
  }

  return _db;
}

// Proxy that lazily initializes the database client on first access
export const db = new Proxy({} as any, {
  get(_, prop) {
    return getDb()[prop];
  },
});
