#!/usr/bin/env npx tsx
/**
 * Debug script to analyze Zabihah.com with geolocation spoofing
 * Usage: npx tsx scripts/debug-zabihah-geo.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugZabihahGeo() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Spoof geolocation to New York City
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.zabihah.com', ['geolocation']);

  await page.setGeolocation({
    latitude: 40.7580,  // Times Square, NYC
    longitude: -73.9855,
  });

  console.log('Navigating to Zabihah.com with NYC geolocation...');
  await page.goto('https://www.zabihah.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(5000);

  // Scroll to load more content
  console.log('Scrolling to load more restaurants...');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);
  }

  // Extract restaurant data
  const pageData = await page.evaluate(() => {
    const text = document.body.innerText;
    const links = Array.from(document.querySelectorAll('a[href*="/restaurants/"]'));

    const restaurants = links.map(a => {
      const href = a.getAttribute('href') || '';
      // Get the parent container text
      let container = a.parentElement;
      while (container && !container.innerText.includes('mi from you')) {
        container = container.parentElement;
      }

      return {
        href,
        text: container?.innerText?.substring(0, 300) || a.textContent?.substring(0, 100) || ''
      };
    });

    // Filter unique restaurants
    const seen = new Set();
    const unique = restaurants.filter(r => {
      if (seen.has(r.href)) return false;
      seen.add(r.href);
      return r.href.includes('/restaurants/');
    });

    return {
      totalLinks: links.length,
      uniqueRestaurants: unique.length,
      restaurants: unique.slice(0, 20),
      textSample: text.substring(0, 2000)
    };
  });

  console.log(`\nFound ${pageData.uniqueRestaurants} unique restaurants\n`);

  // Parse restaurant details from each entry
  for (const r of pageData.restaurants.slice(0, 10)) {
    console.log('---');
    console.log('URL:', r.href);

    // Parse the text
    const lines = r.text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length > 0) {
      console.log('Name:', lines[0]);
      // Find address line (contains street number)
      const addressLine = lines.find((l: string) => /^\d+\s+\w+/.test(l) || l.includes(', NY'));
      if (addressLine) console.log('Address:', addressLine);
      // Find cuisine types
      const cuisineLine = lines.find((l: string) =>
        ['American', 'Italian', 'Indian', 'Pakistani', 'Middle Eastern', 'Chinese', 'Turkish', 'Mediterranean'].some(c => l.includes(c))
      );
      if (cuisineLine) console.log('Cuisine:', cuisineLine);
    }
  }

  // Now let's try to load a specific restaurant page
  if (pageData.restaurants.length > 0) {
    const restaurantUrl = `https://www.zabihah.com${pageData.restaurants[0].href}`;
    console.log(`\n\n=== Loading restaurant detail page: ${restaurantUrl} ===\n`);

    await page.goto(restaurantUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    const detailData = await page.evaluate(() => {
      return {
        title: document.title,
        text: document.body.innerText.substring(0, 2000),
        jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent)
      };
    });

    console.log('Page Title:', detailData.title);
    console.log('\nPage Text:\n', detailData.text);
    if (detailData.jsonLd.length > 0) {
      console.log('\nJSON-LD Data:', detailData.jsonLd[0]);
    }
  }

  await browser.close();
}

debugZabihahGeo().catch(console.error);
