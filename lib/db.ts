/**
 * Database client that switches between Prisma and Mock data
 * based on USE_MOCK_DATA environment variable
 *
 * Uses lazy loading to avoid database connections during build time
 */

// Helper to check if we're using mock data
export const isMockMode = () => process.env.USE_MOCK_DATA === "true";

// Cached database client
let _db: any = null;

// Lazy-loaded database client - only connects when actually used at runtime
function getDb() {
  if (_db) return _db;

  if (process.env.USE_MOCK_DATA === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockDb } = require("./mock-data/client");
    _db = mockDb;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPrisma } = require("./prisma");
    _db = getPrisma();
  }
  return _db;
}

// Proxy that lazily initializes the database client on first property access
// This prevents any database connection during Vercel build time
export const db = new Proxy({} as any, {
  get(_, prop) {
    const client = getDb();
    const value = client[prop];
    // If it's a function, bind it to the client
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
