#!/usr/bin/env npx tsx
/**
 * Debug script to analyze ZabihaFinder page structure
 * Usage: npx tsx scripts/debug-zabihafinder.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugZabihaFinder() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Zabihah.com is the main halal restaurant finder
  console.log('Navigating to Zabihah.com...');

  // Try the main search page first
  await page.goto('https://www.zabihah.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  // Get page structure
  const mainPageAnalysis = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      textSample: document.body.innerText.substring(0, 2000),
      forms: Array.from(document.querySelectorAll('form')).map(f => ({
        action: f.action,
        method: f.method,
        inputs: Array.from(f.querySelectorAll('input')).map(i => ({
          name: i.name,
          type: i.type,
          placeholder: i.placeholder
        }))
      })),
      links: Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
        text: a.textContent?.trim().substring(0, 50),
        href: a.href
      }))
    };
  });

  console.log('\n=== MAIN PAGE ===\n');
  console.log('Title:', mainPageAnalysis.title);
  console.log('URL:', mainPageAnalysis.url);
  console.log('\nForms:', JSON.stringify(mainPageAnalysis.forms, null, 2));
  console.log('\nLinks:', JSON.stringify(mainPageAnalysis.links.slice(0, 10), null, 2));
  console.log('\nText Sample:\n', mainPageAnalysis.textSample);

  // Try to navigate to a city search
  console.log('\n\n=== Trying city search ===\n');

  // Try searching for "New York"
  const searchUrl = 'https://www.zabihah.com/search?city=New+York&state=NY';
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  const searchResults = await page.evaluate(() => {
    return {
      url: window.location.href,
      textSample: document.body.innerText.substring(0, 3000),
      cards: Array.from(document.querySelectorAll('[class*="card"], [class*="listing"], [class*="result"], article')).slice(0, 5).map(el => ({
        className: (el as HTMLElement).className?.substring(0, 100),
        text: (el as HTMLElement).innerText?.substring(0, 300)
      }))
    };
  });

  console.log('Search URL:', searchResults.url);
  console.log('\nCards found:', searchResults.cards.length);
  console.log('Cards:', JSON.stringify(searchResults.cards, null, 2));
  console.log('\nText Sample:\n', searchResults.textSample);

  await browser.close();
}

debugZabihaFinder().catch(console.error);
