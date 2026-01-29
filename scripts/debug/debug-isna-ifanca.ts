#!/usr/bin/env npx tsx
/**
 * Debug script to analyze ISNA and IFANCA websites
 * Usage: npx tsx scripts/debug-isna-ifanca.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugISNAIFANCA() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // ISNA - Islamic Society of North America
  console.log('=== ISNA (isna.net) ===\n');

  const isnaUrls = [
    'https://isna.net/',
    'https://isna.net/halal/',
    'https://www.isna.net/halal',
    'https://isna.net/certified-halal/',
  ];

  for (const url of isnaUrls) {
    try {
      console.log(`Trying: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(2000);

      const pageInfo = await page.evaluate(() => ({
        finalUrl: window.location.href,
        title: document.title,
        hasContent: document.body.innerText.length > 500,
        sample: document.body.innerText.substring(0, 500)
      }));

      console.log('  Title:', pageInfo.title);
      console.log('  Has Content:', pageInfo.hasContent);
      if (pageInfo.hasContent) {
        console.log('  Sample:', pageInfo.sample.substring(0, 200));
      }
      console.log();
    } catch (error) {
      console.log('  Error:', (error as Error).message);
      console.log();
    }
  }

  // IFANCA - Islamic Food and Nutrition Council of America
  console.log('\n=== IFANCA (ifanca.org) ===\n');

  const ifancaUrls = [
    'https://www.ifanca.org/',
    'https://ifanca.org/',
    'https://www.ifanca.org/certified-products',
    'https://www.ifanca.org/halal-certified',
    'https://www.ifanca.org/directory',
  ];

  for (const url of ifancaUrls) {
    try {
      console.log(`Trying: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(2000);

      const pageInfo = await page.evaluate(() => ({
        finalUrl: window.location.href,
        title: document.title,
        hasContent: document.body.innerText.length > 500,
        sample: document.body.innerText.substring(0, 1000),
        links: Array.from(document.querySelectorAll('a')).slice(0, 30).map(a => ({
          text: a.textContent?.trim().substring(0, 50),
          href: a.href
        }))
      }));

      console.log('  Final URL:', pageInfo.finalUrl);
      console.log('  Title:', pageInfo.title);
      console.log('  Has Content:', pageInfo.hasContent);
      if (pageInfo.hasContent) {
        console.log('  Sample:', pageInfo.sample.substring(0, 300));
        console.log('  Links with "certif" or "halal":',
          pageInfo.links.filter(l =>
            l.text?.toLowerCase().includes('certif') ||
            l.text?.toLowerCase().includes('halal') ||
            l.href.toLowerCase().includes('certif') ||
            l.href.toLowerCase().includes('halal')
          ).slice(0, 5)
        );
      }
      console.log();
    } catch (error) {
      console.log('  Error:', (error as Error).message);
      console.log();
    }
  }

  // SANHA - South African National Halal Authority (they have US presence?)
  console.log('\n=== SANHA (sanha.org.za) ===\n');

  const sanhaUrls = [
    'https://www.sanha.org.za/',
    'https://sanha.org.za/',
    'https://www.sanha.org.za/directory',
    'https://www.sanha.org.za/certified',
  ];

  for (const url of sanhaUrls) {
    try {
      console.log(`Trying: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(2000);

      const pageInfo = await page.evaluate(() => ({
        finalUrl: window.location.href,
        title: document.title,
        hasContent: document.body.innerText.length > 500,
        sample: document.body.innerText.substring(0, 500)
      }));

      console.log('  Final URL:', pageInfo.finalUrl);
      console.log('  Title:', pageInfo.title);
      console.log('  Has Content:', pageInfo.hasContent);
      if (pageInfo.hasContent) {
        console.log('  Sample:', pageInfo.sample.substring(0, 200));
      }
      console.log();
    } catch (error) {
      console.log('  Error:', (error as Error).message);
      console.log();
    }
  }

  await browser.close();
}

debugISNAIFANCA().catch(console.error);
