#!/usr/bin/env npx tsx
/**
 * Debug script to analyze SANHA certified establishments page
 * Usage: npx tsx scripts/debug-sanha.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugSANHA() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to SANHA Certified Establishments page...');
  await page.goto('https://sanha.org.za/certified-establishmen/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(5000);

  // Scroll to load content
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);
  }

  const pageData = await page.evaluate(() => {
    const text = document.body.innerText;

    // Look for establishment cards
    const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="listing"], [class*="item"], article'));
    const cardInfo = cards.slice(0, 10).map(c => ({
      className: (c as HTMLElement).className?.substring(0, 100),
      text: (c as HTMLElement).innerText?.substring(0, 300)
    }));

    // Look for links to establishment details
    const establishmentLinks = Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('establishment') || a.href.includes('certified'))
      .slice(0, 20)
      .map(a => ({
        text: a.textContent?.trim().substring(0, 50),
        href: a.href
      }));

    return {
      textSample: text.substring(0, 4000),
      cardInfo,
      establishmentLinks,
      totalTextLength: text.length
    };
  });

  console.log('\n=== PAGE ANALYSIS ===\n');
  console.log('Text Length:', pageData.totalTextLength);
  console.log('\nCards found:', pageData.cardInfo.length);
  console.log(JSON.stringify(pageData.cardInfo.slice(0, 5), null, 2));
  console.log('\nEstablishment Links:', pageData.establishmentLinks.length);
  console.log(JSON.stringify(pageData.establishmentLinks.slice(0, 10), null, 2));
  console.log('\n=== TEXT SAMPLE ===\n');
  console.log(pageData.textSample);

  await browser.close();
}

debugSANHA().catch(console.error);
