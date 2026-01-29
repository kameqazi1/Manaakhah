#!/usr/bin/env npx tsx
/**
 * Debug script to analyze HFSAA page with scrolling/load more
 * Usage: npx tsx scripts/debug-hfsaa-full.ts
 */

import puppeteer from 'puppeteer';

async function debugHFSAAPageFull() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to HFSAA Bay Area...');
  await page.goto('https://hfsaa.org/bayarea/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content to load
  await new Promise(r => setTimeout(r, 3000));

  // Try to click "Load More" repeatedly
  console.log('\nTrying to load all content...');
  let loadMoreClicks = 0;
  const maxClicks = 10;

  while (loadMoreClicks < maxClicks) {
    const clicked = await page.evaluate(() => {
      // Find "Load More" button or text
      const buttons = Array.from(document.querySelectorAll('button, div, span, a'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text === 'Load More' || text?.includes('Load More')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            (btn as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    });

    if (clicked) {
      loadMoreClicks++;
      console.log(`  Clicked Load More (${loadMoreClicks})`);
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('  No more Load More buttons found');
      break;
    }
  }

  // Also try scrolling
  console.log('\nScrolling page...');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  }

  // Wait for any lazy loading
  await new Promise(r => setTimeout(r, 2000));

  // Get all the text content
  const fullText = await page.evaluate(() => document.body.innerText);

  console.log('\n=== FULL PAGE TEXT ===\n');
  console.log(fullText);

  console.log('\n=== ANALYSIS ===');

  // Count businesses by looking for address patterns
  const addressPattern = /\d+\s+[\w\s]+,\s+[\w\s]+,\s*CA\s*\d{5}/g;
  const addresses = fullText.match(addressPattern) || [];
  console.log(`\nFound ${addresses.length} addresses in CA`);

  await browser.close();
}

debugHFSAAPageFull().catch(console.error);
