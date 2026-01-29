#!/usr/bin/env npx tsx
/**
 * Debug script to analyze HFSAA page structure
 * Usage: npx tsx scripts/debug-hfsaa.ts
 */

import puppeteer from 'puppeteer';

async function debugHFSAAPage() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to HFSAA Bay Area...');
  await page.goto('https://hfsaa.org/bayarea/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content to load
  await new Promise(r => setTimeout(r, 5000));

  // Check what elements exist
  const analysis = await page.evaluate(() => {
    const hasElfsight = document.querySelector('[class*="elfsight"], [class*="eapps"], iframe[src*="elfsight"]') !== null;

    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src,
      id: f.id,
      className: f.className
    }));

    const elfsightElements = Array.from(document.querySelectorAll('[class*="eapps"]')).map(el => ({
      className: el.className,
      children: el.children.length,
      innerHTML: el.innerHTML.substring(0, 500)
    }));

    // Look for the store locator widget specifically
    const storeLocator = document.querySelector('[class*="eapps-google-maps"]');
    const storeLocatorInfo = storeLocator ? {
      className: storeLocator.className,
      childrenCount: storeLocator.children.length,
      innerHTML: storeLocator.innerHTML.substring(0, 1000)
    } : null;

    // Get all text content to see structure
    const bodyText = document.body.innerText;

    // Look for specific patterns that might indicate business listings
    const allDivs = Array.from(document.querySelectorAll('div'));
    const potentialCards = allDivs.filter(d => {
      const text = d.innerText || '';
      // Look for divs that contain address-like text
      return text.match(/\d+\s+\w+.*,\s*[A-Z]{2}\s*\d{5}/);
    }).slice(0, 5).map(d => ({
      className: d.className,
      text: d.innerText.substring(0, 300)
    }));

    return {
      hasElfsight,
      iframes,
      elfsightElements,
      storeLocatorInfo,
      bodyTextLength: bodyText.length,
      sampleText: bodyText.substring(0, 3000),
      potentialCards
    };
  });

  console.log('\n=== ANALYSIS ===\n');
  console.log('Has Elfsight:', analysis.hasElfsight);
  console.log('\nIframes:', JSON.stringify(analysis.iframes, null, 2));
  console.log('\nElfsight Elements:', JSON.stringify(analysis.elfsightElements, null, 2));
  console.log('\nStore Locator Info:', JSON.stringify(analysis.storeLocatorInfo, null, 2));
  console.log('\nBody Text Length:', analysis.bodyTextLength);
  console.log('\nPotential Cards:', JSON.stringify(analysis.potentialCards, null, 2));
  console.log('\n=== SAMPLE TEXT (first 3000 chars) ===\n');
  console.log(analysis.sampleText);

  await browser.close();
}

debugHFSAAPage().catch(console.error);
