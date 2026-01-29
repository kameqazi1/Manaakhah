#!/usr/bin/env npx tsx
/**
 * Debug script to analyze Zabihah.com browse/location pages
 * Usage: npx tsx scripts/debug-zabihah-browse.ts
 */

import puppeteer from 'puppeteer';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugZabihahBrowse() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Try different URL patterns to find browse/location pages
  const urlsToTry = [
    'https://www.zabihah.com/browse',
    'https://www.zabihah.com/browse/usa',
    'https://www.zabihah.com/usa',
    'https://www.zabihah.com/restaurants/usa/ny/new-york',
    'https://www.zabihah.com/reg/USA/New%20York/NY/New%20York',
    'https://www.zabihah.com/sub/USA/New%20York/NY/New%20York',
  ];

  for (const url of urlsToTry) {
    console.log(`\n=== Trying: ${url} ===\n`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await sleep(2000);

      const pageInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          textLength: document.body.innerText.length,
          textSample: document.body.innerText.substring(0, 500),
          hasError: document.body.innerText.includes('404') || document.body.innerText.includes('not found'),
        };
      });

      console.log('Final URL:', pageInfo.url);
      console.log('Title:', pageInfo.title);
      console.log('Text Length:', pageInfo.textLength);
      console.log('Has Error:', pageInfo.hasError);
      if (!pageInfo.hasError) {
        console.log('Sample:', pageInfo.textSample);
      }
    } catch (error) {
      console.log('Error:', (error as Error).message);
    }
  }

  // Try to find browse links from homepage
  console.log('\n=== Checking homepage for browse/location links ===\n');
  await page.goto('https://www.zabihah.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  const homeLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links
      .filter(a => {
        const href = a.href.toLowerCase();
        return href.includes('browse') ||
          href.includes('region') ||
          href.includes('state') ||
          href.includes('city') ||
          href.includes('/usa') ||
          href.includes('/us/');
      })
      .slice(0, 20)
      .map(a => ({
        text: a.textContent?.trim().substring(0, 50),
        href: a.href
      }));
  });

  console.log('Browse/Location links found:', homeLinks.length);
  console.log(JSON.stringify(homeLinks, null, 2));

  // Look for API calls in network
  console.log('\n=== Looking for API patterns in script tags ===\n');
  const scriptInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    const apiPatterns: string[] = [];
    scripts.forEach(s => {
      const content = s.textContent || '';
      if (content.includes('api') || content.includes('fetch') || content.includes('axios')) {
        // Extract potential API URLs
        const matches = content.match(/["']\/api\/[^"']+["']/g) || [];
        apiPatterns.push(...matches);
      }
    });
    return apiPatterns.slice(0, 10);
  });

  console.log('API patterns found:', scriptInfo);

  await browser.close();
}

debugZabihahBrowse().catch(console.error);
