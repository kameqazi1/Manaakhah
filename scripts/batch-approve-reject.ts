#!/usr/bin/env npx tsx
/**
 * Batch approve/reject scraped businesses by source
 */

import "dotenv/config";
import { db } from "../lib/db";
import { ScrapedBusinessClaimStatus } from "@prisma/client";

// Type for selected fields from scrapedBusiness query
type ScrapedBusinessSelection = {
  id: string;
  name: string;
  metadata: unknown;
  claimStatus: ScrapedBusinessClaimStatus;
};

async function batchUpdate() {
  // Get ALL scraped businesses (not just pending)
  const all = await db.scrapedBusiness.findMany({
    select: { id: true, name: true, metadata: true, claimStatus: true },
  });

  const hfsaaPending: string[] = [];
  const googleYelpToReject: string[] = [];

  all.forEach((b: ScrapedBusinessSelection) => {
    const source = (b.metadata as any)?.source;
    // HFSAA pending ones to approve
    if (source === "hfsaa" && b.claimStatus === "PENDING_REVIEW") {
      hfsaaPending.push(b.id);
    }
    // Google/Yelp - reject if not already rejected
    if ((source === "google_places" || source === "yelp") && b.claimStatus !== "REJECTED") {
      googleYelpToReject.push(b.id);
    }
  });

  console.log("Found:");
  console.log("  HFSAA pending:", hfsaaPending.length);
  console.log("  Google/Yelp to reject:", googleYelpToReject.length);

  // Reject Google/Yelp first
  if (googleYelpToReject.length > 0) {
    const rejected = await db.scrapedBusiness.updateMany({
      where: { id: { in: googleYelpToReject } },
      data: { claimStatus: "REJECTED", reviewedAt: new Date() },
    });
    console.log("\nRejected", rejected.count, "Google/Yelp businesses");
  }

  // Approve HFSAA - need to do this one by one to create Business entries
  console.log("\nApproving HFSAA businesses...");
  let approved = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  // Get admin user for owner
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admin) {
    console.error("No admin user found! Creating one...");
    // Create a system admin user
    const newAdmin = await db.user.create({
      data: {
        id: "system-admin",
        email: "admin@manaakhah.com",
        name: "System Admin",
        role: "ADMIN",
      },
    });
    console.log("Created system admin:", newAdmin.id);
  }

  const ownerId = admin?.id || "system-admin";

  for (const id of hfsaaPending) {
    try {
      const scraped = await db.scrapedBusiness.findUnique({ where: { id } });
      if (!scraped) continue;

      // Generate slug with random suffix to prevent race conditions
      const baseSlug = scraped.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      const metadata = (scraped.metadata || {}) as any;

      // Check for duplicates before creating
      const existingBiz = await db.business.findFirst({
        where: {
          OR: [
            { name: scraped.name, city: scraped.city },
            ...(scraped.phone ? [{ phone: scraped.phone }] : []),
            { address: scraped.address, city: scraped.city },
          ],
        },
        select: { id: true },
      });

      if (existingBiz) {
        errors++;
        errorDetails.push(`Duplicate: ${scraped.name} in ${scraped.city}`);
        continue;
      }

      // Create business using raw SQL to avoid schema mismatch
      const websiteVal = scraped.website || scraped.sourceUrl || null;
      const descVal = scraped.description || `${scraped.name} in ${scraped.city}`;
      // Use ?? (nullish coalescing) to preserve valid 0 values (equator/prime meridian)
      const latVal = scraped.latitude ?? null;
      const lngVal = scraped.longitude ?? null;
      const phoneVal = scraped.phone || "";
      const confScore = metadata.confidence || null;

      await db.$executeRaw`
        INSERT INTO "Business" (
          id, "ownerId", name, slug, description, category,
          address, city, state, "zipCode", latitude, longitude,
          phone, email, website, status, "verificationStatus",
          "isScraped", "scrapedBusinessId", "scrapedFrom", "scrapedAt",
          "confidenceScore", "createdAt", "updatedAt"
        ) VALUES (
          ${`biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`},
          ${ownerId},
          ${scraped.name},
          ${slug},
          ${descVal},
          ${scraped.category}::"BusinessCategory",
          ${scraped.address},
          ${scraped.city},
          ${scraped.state},
          ${scraped.zipCode},
          ${latVal},
          ${lngVal},
          ${phoneVal},
          ${scraped.email},
          ${websiteVal},
          'PUBLISHED'::"BusinessStatus",
          'PENDING'::"VerificationStatus",
          true,
          ${scraped.id},
          ${metadata.source || scraped.sourceUrl},
          ${scraped.scrapedAt},
          ${confScore},
          NOW(),
          NOW()
        )
      `;

      // Update scraped status
      await db.scrapedBusiness.update({
        where: { id },
        data: { claimStatus: "APPROVED", reviewedAt: new Date() },
      });

      approved++;
      if (approved % 20 === 0) console.log("  Approved", approved, "/", hfsaaPending.length);
    } catch (e: any) {
      errors++;
      if (errors <= 3) {
        console.error("Error for business:", id, "-", e.message);
      }
      errorDetails.push(e.message?.substring(0, 100) || "Unknown error");
    }
  }

  console.log("\n=== Summary ===");
  console.log("HFSAA approved:", approved);
  console.log("HFSAA errors:", errors);
  if (errorDetails.length > 0 && errorDetails.length <= 5) {
    console.log("Error samples:", errorDetails.slice(0, 5));
  }
  console.log("Google/Yelp rejected:", googleYelpToReject.length);
}

batchUpdate().catch(console.error);
