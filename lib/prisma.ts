/**
 * Lazy-loaded Prisma client
 *
 * IMPORTANT: PrismaClient is NOT imported at the top level.
 * This prevents database connections during Vercel build time.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Lazy initialization - only creates PrismaClient when actually used
export function getPrisma() {
  if (!globalForPrisma.prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

// Keep backward compatibility export (lazy via getter)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma = new Proxy({} as any, {
  get(_, prop) {
    return getPrisma()[prop]
  },
})
