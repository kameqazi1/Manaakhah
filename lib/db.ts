/**
 * Database client that switches between Prisma and Mock data
 * based on USE_MOCK_DATA environment variable
 */

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

let db: any;

if (USE_MOCK_DATA) {
  console.log("🔧 Using MOCK DATA - no database required");
  // Dynamic import to avoid loading Prisma when using mock data
  const { mockDb } = require("./mock-data/client");
  db = mockDb;
} else {
  console.log("🗄️  Using REAL DATABASE - Prisma client");
  const { prisma } = require("./prisma");
  db = prisma;
}

export { db };

// Helper to check if we're using mock data
export const isMockMode = () => USE_MOCK_DATA;
