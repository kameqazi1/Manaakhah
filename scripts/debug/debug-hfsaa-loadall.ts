#!/usr/bin/env npx tsx
/**
 * Debug script to properly load all HFSAA content
 * Usage: npx tsx scripts/debug-hfsaa-loadall.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugHFSAALoadAll() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to HFSAA Bay Area...');
  await page.goto('https://hfsaa.org/bayarea/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content to load
  await sleep(3000);

  // Load all content by clicking Load More repeatedly
  console.log('\nLoading all locations...');

  let previousCount = 0;
  for (let i = 0; i < 20; i++) {
    // Scroll the list container
    await page.evaluate(() => {
      const listContainer = document.querySelector('[class*="directory-locations-list__Container"]');
      if (listContainer) {
        listContainer.scrollTop = listContainer.scrollHeight;
      }
    });

    await sleep(500);

    // Click Load More button
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('[class*="directory-locations-list__StyledButton"]') as HTMLElement;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        if (rect.height > 0) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!clicked) {
      console.log(`  Iteration ${i + 1}: No more Load More button`);
      break;
    }

    console.log(`  Iteration ${i + 1}: Clicked Load More`);
    await sleep(1500);

    // Count current addresses
    const count = await page.evaluate(() => {
      const addresses = document.body.innerText.match(/\d+\s+[\w\s]+,\s+[\w\s]+,\s*[A-Z]{2}\s*\d{5}/g) || [];
      return addresses.length;
    });

    console.log(`    Now have ${count} locations`);

    if (count === previousCount) {
      console.log('  No new content loaded, stopping');
      break;
    }
    previousCount = count;

    if (count >= 36) {
      console.log('  All locations loaded!');
      break;
    }
  }

  // Get final count
  const finalCount = await page.evaluate(() => {
    const addresses = document.body.innerText.match(/\d+\s+[\w\s]+,\s+[\w\s]+,\s*[A-Z]{2}\s*\d{5}/g) || [];
    return addresses.length;
  });
  console.log(`\nFinal count: ${finalCount} locations`);

  // Extract businesses
  console.log('\n=== Extracting businesses ===\n');

  const businessData = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    // Find the start of listings (after "X locations")
    const locationsIdx = lines.findIndex((l: string) => /^\d+\s+locations$/.test(l));
    if (locationsIdx === -1) return { error: 'Could not find locations marker', businesses: [] };

    const listingLines = lines.slice(locationsIdx + 1);

    // Parse businesses
    const businesses: Array<{
      name: string;
      status?: string;
      hours?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      phone?: string;
      website?: string;
    }> = [];

    let i = 0;
    while (i < listingLines.length) {
      const line = listingLines[i];

      // Skip footer/navigation
      if (line.includes('Load More') ||
        line.includes('© ') ||
        line.includes('Stadia Maps') ||
        line.includes('OpenMapTiles') ||
        line.includes('info@hfsaa')) {
        break;
      }

      // Check if this looks like a business name (not an address, phone, or website)
      const isAddress = /^\d+\s+\w+/.test(line) && line.includes(',');
      const isPhone = /^\+?\d[\d\s\-()]+$/.test(line);
      const isWebsite = /\.(com|us|org|net|site|co|online)$/i.test(line);
      const isStatus = line === 'Closed' || line === 'Open' || line.startsWith('Opens ') || line.startsWith('Closes ');

      if (!isAddress && !isPhone && !isWebsite && !isStatus && line.length > 2) {
        // This is likely a business name
        const business: {
          name: string;
          status?: string;
          hours?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          phone?: string;
          website?: string;
        } = { name: line };

        // Look ahead for status, hours, address, phone, website
        let j = i + 1;
        while (j < listingLines.length && j < i + 8) {
          const nextLine = listingLines[j];

          const isNextAddress = /^\d+\s+\w+/.test(nextLine) && nextLine.includes(',');
          const isNextPhone = /^\+?\d[\d\s\-()]+$/.test(nextLine);
          const isNextWebsite = /\.(com|us|org|net|site|co|online)$/i.test(nextLine);
          const isNextStatus = nextLine === 'Closed' || nextLine === 'Open';

          if (isNextStatus) {
            business.status = nextLine;
          } else if (nextLine.match(/Opens .* at/)) {
            business.hours = nextLine;
          } else if (isNextAddress) {
            // Parse address: "123 Street, City, ST ZIP, USA"
            const addressMatch = nextLine.match(/^(.+),\s*([\w\s]+),\s*([A-Z]{2})\s*(\d{5})(?:,\s*USA)?$/);
            if (addressMatch) {
              business.address = addressMatch[1].trim();
              business.city = addressMatch[2].trim();
              business.state = addressMatch[3];
              business.zip = addressMatch[4];
            } else {
              business.address = nextLine;
            }
          } else if (isNextPhone) {
            business.phone = nextLine;
          } else if (isNextWebsite) {
            business.website = nextLine;
          } else if (!isNextStatus && nextLine.length > 2) {
            // Unknown line, might be next business
            break;
          }

          j++;
        }

        if (business.address || business.city) {
          businesses.push(business);
        }

        i = j;
      } else {
        i++;
      }
    }

    return { error: null, businesses };
  });

  if (businessData.error) {
    console.log('Error:', businessData.error);
  } else {
    console.log(`Extracted ${businessData.businesses.length} businesses:`);
    for (const b of businessData.businesses.slice(0, 5)) {
      console.log(`\n  ${b.name}`);
      console.log(`    Address: ${b.address}, ${b.city}, ${b.state} ${b.zip}`);
      if (b.phone) console.log(`    Phone: ${b.phone}`);
      if (b.website) console.log(`    Website: ${b.website}`);
    }
    if (businessData.businesses.length > 5) {
      console.log(`\n  ... and ${businessData.businesses.length - 5} more`);
    }
  }

  await browser.close();
}

debugHFSAALoadAll().catch(console.error);
