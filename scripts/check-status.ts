#!/usr/bin/env npx tsx
import "dotenv/config";
import { db } from "../lib/db";

async function checkStatus() {
  const scraped = await db.scrapedBusiness.findMany({
    select: { metadata: true, claimStatus: true },
  });

  const bySourceAndStatus: Record<string, Record<string, number>> = {};

  scraped.forEach((s) => {
    const source = (s.metadata as any)?.source || "unknown";
    const status = s.claimStatus;
    if (bySourceAndStatus[source] === undefined) {
      bySourceAndStatus[source] = {};
    }
    bySourceAndStatus[source][status] =
      (bySourceAndStatus[source][status] || 0) + 1;
  });

  console.log("=== Scraped Businesses by Source & Status ===");
  Object.entries(bySourceAndStatus).forEach(([source, statuses]) => {
    console.log(source + ":");
    Object.entries(statuses).forEach(([status, count]) => {
      console.log("  " + status + ": " + count);
    });
  });

  const businesses = await db.business.count();
  const scrapedBiz = await db.business.count({ where: { isScraped: true } });
  console.log("");
  console.log("=== Business Table ===");
  console.log("Total businesses:", businesses);
  console.log("Scraped businesses:", scrapedBiz);
}

checkStatus();
