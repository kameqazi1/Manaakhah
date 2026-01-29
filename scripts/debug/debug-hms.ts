#!/usr/bin/env npx tsx
/**
 * Debug script to analyze HMS page structure
 * Usage: npx tsx scripts/debug-hms.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugHMSPage() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to HMS certified listing...');
  await page.goto('https://www.hmsusa.org/certified-listing', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content
  await sleep(3000);

  // Scroll to load all content
  console.log('Scrolling to load content...');
  let previousHeight = 0;
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1500);
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`  Scroll ${i + 1}: height = ${currentHeight}`);
    if (currentHeight === previousHeight) break;
    previousHeight = currentHeight;
  }

  // Get sample of page text
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT (first 5000 chars) ===\n');
  console.log(pageText.substring(0, 5000));

  // Check for structured elements
  const domAnalysis = await page.evaluate(() => {
    // Look for table elements
    const tables = Array.from(document.querySelectorAll('table'));
    const tableInfo = tables.map(t => ({
      id: t.id,
      className: t.className?.substring(0, 100) || '',
      rows: t.rows.length,
      firstRowText: t.rows[0]?.innerText?.substring(0, 200) || ''
    }));

    // Look for list elements
    const lists = Array.from(document.querySelectorAll('ul, ol'));
    const listInfo = lists.filter(l => l.children.length > 5).slice(0, 5).map(l => ({
      tag: l.tagName,
      className: l.className?.substring(0, 100) || '',
      children: l.children.length,
      firstItemText: (l.children[0] as HTMLElement)?.innerText?.substring(0, 200) || ''
    }));

    // Look for cards/divs with business-like content
    const allDivs = Array.from(document.querySelectorAll('div'));
    const businessDivs = allDivs.filter(d => {
      const text = d.innerText || '';
      // Look for divs with address-like content
      return text.match(/\d+\s+\w+.*,/) && text.length < 500;
    }).slice(0, 10).map(d => ({
      className: d.className?.substring(0, 100) || '',
      text: d.innerText?.substring(0, 300) || ''
    }));

    return { tableInfo, listInfo, businessDivs };
  });

  console.log('\n=== DOM ANALYSIS ===\n');
  console.log('Tables:', JSON.stringify(domAnalysis.tableInfo, null, 2));
  console.log('\nLists:', JSON.stringify(domAnalysis.listInfo, null, 2));
  console.log('\nBusiness Divs:', JSON.stringify(domAnalysis.businessDivs, null, 2));

  await browser.close();
}

debugHMSPage().catch(console.error);
