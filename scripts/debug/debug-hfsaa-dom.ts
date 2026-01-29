#!/usr/bin/env npx tsx
/**
 * Debug script to analyze HFSAA DOM structure in detail
 * Usage: npx tsx scripts/debug-hfsaa-dom.ts
 */

import puppeteer from 'puppeteer';

async function debugHFSAADOM() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to HFSAA Bay Area...');
  await page.goto('https://hfsaa.org/bayarea/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content to load
  await new Promise(r => setTimeout(r, 5000));

  // Analyze the Elfsight widget structure
  const domAnalysis = await page.evaluate(() => {
    // Find all elements that look like location cards
    const allElements = Array.from(document.querySelectorAll('*'));

    // Find elements with "location" or "store" in class name
    const storeElements = allElements.filter(el => {
      const className = el.className?.toString() || '';
      return className.includes('store-item') ||
        className.includes('location-item') ||
        className.includes('StoreItem') ||
        className.includes('LocationItem') ||
        className.includes('card__');
    }).slice(0, 10).map(el => ({
      tag: el.tagName,
      className: el.className?.toString()?.substring(0, 200) || '',
      text: (el as HTMLElement).innerText?.substring(0, 200) || ''
    }));

    // Find the sidebar/list container
    const sidebarElements = allElements.filter(el => {
      const className = el.className?.toString() || '';
      return className.includes('Sidebar') ||
        className.includes('directory') ||
        className.includes('list') ||
        className.includes('List');
    }).slice(0, 10).map(el => ({
      tag: el.tagName,
      className: el.className?.toString()?.substring(0, 200) || '',
      childCount: el.children.length,
      textLength: (el as HTMLElement).innerText?.length || 0
    }));

    // Find direct children of the eapps container
    const eappsRoot = document.querySelector('[class*="eapps-store-locator"]');
    const eappsStructure = eappsRoot ? {
      className: eappsRoot.className,
      childCount: eappsRoot.children.length,
      children: Array.from(eappsRoot.children).map(c => ({
        tag: c.tagName,
        className: c.className?.toString()?.substring(0, 100) || ''
      }))
    } : null;

    // Find any scrollable container
    const scrollContainers = allElements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.overflowY === 'scroll' || style.overflowY === 'auto';
    }).slice(0, 5).map(el => ({
      tag: el.tagName,
      className: el.className?.toString()?.substring(0, 100) || '',
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    }));

    // Look for Load More button
    const loadMoreElements = allElements.filter(el => {
      const text = (el as HTMLElement).innerText?.trim() || '';
      return text === 'Load More';
    }).map(el => ({
      tag: el.tagName,
      className: el.className?.toString() || '',
      isButton: el.tagName === 'BUTTON',
      parentTag: el.parentElement?.tagName
    }));

    return {
      storeElements,
      sidebarElements,
      eappsStructure,
      scrollContainers,
      loadMoreElements
    };
  });

  console.log('\n=== DOM ANALYSIS ===\n');
  console.log('Store/Location Elements:', JSON.stringify(domAnalysis.storeElements, null, 2));
  console.log('\nSidebar/List Elements:', JSON.stringify(domAnalysis.sidebarElements, null, 2));
  console.log('\nEapps Structure:', JSON.stringify(domAnalysis.eappsStructure, null, 2));
  console.log('\nScroll Containers:', JSON.stringify(domAnalysis.scrollContainers, null, 2));
  console.log('\nLoad More Buttons:', JSON.stringify(domAnalysis.loadMoreElements, null, 2));

  // Now try to scroll the sidebar specifically
  console.log('\n=== Trying to scroll sidebar ===');

  const scrollResult = await page.evaluate(async () => {
    // Find the sidebar container that should be scrollable
    const sidebar = document.querySelector('[class*="Sidebar"]');
    if (!sidebar) return { found: false };

    // Scroll the sidebar
    const results = [];
    let previousHeight = sidebar.scrollHeight;

    for (let i = 0; i < 5; i++) {
      sidebar.scrollTop = sidebar.scrollHeight;
      await new Promise(r => setTimeout(r, 1500));

      const newHeight = sidebar.scrollHeight;
      results.push({
        scroll: i + 1,
        scrollTop: sidebar.scrollTop,
        scrollHeight: newHeight,
        grew: newHeight > previousHeight
      });
      previousHeight = newHeight;
    }

    return { found: true, results };
  });

  console.log('Scroll Result:', JSON.stringify(scrollResult, null, 2));

  // Get final business count
  const finalText = await page.evaluate(() => document.body.innerText);
  const addressPattern = /\d+\s+[\w\s]+,\s+[\w\s]+,\s*CA\s*\d{5}/g;
  const addresses = finalText.match(addressPattern) || [];
  console.log(`\nFinal count: ${addresses.length} addresses in CA`);

  await browser.close();
}

debugHFSAADOM().catch(console.error);
