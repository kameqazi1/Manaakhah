#!/usr/bin/env npx tsx
/**
 * Debug script to analyze IFANCA certified companies page
 * Usage: npx tsx scripts/debug-ifanca-certified.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugIFANCACertified() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to IFANCA Certified Companies page...');
  await page.goto('https://ifanca.org/certified-companies/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  // Scroll to load all content
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1500);
  }

  const pageData = await page.evaluate(() => {
    const text = document.body.innerText;

    // Look for company listings
    const allElements = Array.from(document.querySelectorAll('*'));

    // Find potential company cards/entries
    const potentialCards = allElements.filter(el => {
      const text = (el as HTMLElement).innerText || '';
      // Companies often have addresses or locations
      return text.length > 50 && text.length < 500 &&
        (text.includes(',') || text.includes('LLC') || text.includes('Inc') || text.includes('Corp'));
    }).slice(0, 20).map(el => ({
      tag: el.tagName,
      className: (el as HTMLElement).className?.substring(0, 100),
      text: (el as HTMLElement).innerText?.substring(0, 300)
    }));

    // Look for tables
    const tables = Array.from(document.querySelectorAll('table'));
    const tableInfo = tables.map(t => ({
      rows: t.rows.length,
      headers: Array.from(t.querySelectorAll('th')).map(th => th.textContent?.trim()),
      firstRowData: t.rows[1] ? Array.from(t.rows[1].cells).map(c => c.textContent?.trim().substring(0, 50)) : []
    }));

    // Look for lists
    const lists = Array.from(document.querySelectorAll('ul, ol'));
    const listInfo = lists.filter(l => l.children.length > 5).slice(0, 5).map(l => ({
      items: l.children.length,
      firstItems: Array.from(l.children).slice(0, 3).map(c => (c as HTMLElement).innerText?.substring(0, 100))
    }));

    return {
      textSample: text.substring(0, 3000),
      potentialCards,
      tableInfo,
      listInfo,
      totalTextLength: text.length
    };
  });

  console.log('\n=== PAGE ANALYSIS ===\n');
  console.log('Text Length:', pageData.totalTextLength);
  console.log('\nTables found:', pageData.tableInfo.length);
  console.log('Tables:', JSON.stringify(pageData.tableInfo, null, 2));
  console.log('\nLists found:', pageData.listInfo.length);
  console.log('Lists:', JSON.stringify(pageData.listInfo, null, 2));
  console.log('\nPotential Cards:', pageData.potentialCards.length);
  console.log(JSON.stringify(pageData.potentialCards.slice(0, 5), null, 2));
  console.log('\n=== TEXT SAMPLE ===\n');
  console.log(pageData.textSample);

  await browser.close();
}

debugIFANCACertified().catch(console.error);
