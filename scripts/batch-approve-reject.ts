#!/usr/bin/env npx tsx
/**
 * Batch approve/reject scraped businesses by source
 */

import "dotenv/config";
import { db } from "../lib/db";

async function batchUpdate() {
  // Get all pending scraped businesses
  const all = await db.scrapedBusiness.findMany({
    where: { claimStatus: "PENDING_REVIEW" },
    select: { id: true, name: true, metadata: true },
  });

  const hfsaa: string[] = [];
  const googleYelp: string[] = [];

  all.forEach((b) => {
    const source = (b.metadata as any)?.source;
    if (source === "hfsaa") hfsaa.push(b.id);
    if (source === "google_places" || source === "yelp") googleYelp.push(b.id);
  });

  console.log("Found:");
  console.log("  HFSAA pending:", hfsaa.length);
  console.log("  Google/Yelp pending:", googleYelp.length);

  // Reject Google/Yelp first
  if (googleYelp.length > 0) {
    const rejected = await db.scrapedBusiness.updateMany({
      where: { id: { in: googleYelp } },
      data: { claimStatus: "REJECTED", reviewedAt: new Date() },
    });
    console.log("\nRejected", rejected.count, "Google/Yelp businesses");
  }

  // Approve HFSAA - need to do this one by one to create Business entries
  console.log("\nApproving HFSAA businesses...");
  let approved = 0;
  let errors = 0;

  // Get admin user for owner
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admin) {
    console.error("No admin user found!");
    return;
  }

  for (const id of hfsaa) {
    try {
      const scraped = await db.scrapedBusiness.findUnique({ where: { id } });
      if (!scraped) continue;

      // Generate slug
      const baseSlug = scraped.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const existing = await db.business.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true },
      });
      const slug =
        existing.length === 0 ? baseSlug : baseSlug + "-" + (existing.length + 1);

      const metadata = (scraped.metadata || {}) as any;

      // Create business
      await db.business.create({
        data: {
          name: scraped.name,
          slug,
          description: scraped.description || scraped.name + " in " + scraped.city,
          category: scraped.category,
          address: scraped.address,
          city: scraped.city,
          state: scraped.state,
          zipCode: scraped.zipCode,
          latitude: scraped.latitude || 37.5485,
          longitude: scraped.longitude || -121.9886,
          phone: scraped.phone || "",
          email: scraped.email,
          website: scraped.website || scraped.sourceUrl,
          ownerId: admin.id,
          status: "PUBLISHED",
          verificationStatus: "UNVERIFIED",
          isScraped: true,
          scrapedBusinessId: scraped.id,
          scrapedFrom: metadata.source || scraped.sourceUrl,
          scrapedAt: scraped.scrapedAt,
          confidenceScore: metadata.confidence || null,
        },
      });

      // Update scraped status
      await db.scrapedBusiness.update({
        where: { id },
        data: { claimStatus: "APPROVED", reviewedAt: new Date() },
      });

      approved++;
      if (approved % 20 === 0) console.log("  Approved", approved, "/", hfsaa.length);
    } catch (e: any) {
      errors++;
      // Likely duplicate slug, skip silently
    }
  }

  console.log("\n=== Summary ===");
  console.log("HFSAA approved:", approved);
  console.log("HFSAA errors (likely duplicates):", errors);
  console.log("Google/Yelp rejected:", googleYelp.length);
}

batchUpdate().catch(console.error);
