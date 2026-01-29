/**
 * Base Scraper Classes
 *
 * Abstract base classes for implementing data source scrapers.
 * Provides common functionality for both static (Cheerio) and
 * browser-based (Puppeteer) scrapers.
 */

import type { Browser, Page } from "puppeteer";
import type {
  DataSource,
  ScraperConfig,
  ScrapedEstablishment,
  ScraperResult,
  ScraperStats,
  ScraperError,
  RegionalChapter,
  Logger,
  AddressDefaults,
  ParsedAddress,
} from "../types";
import {
  createLogger,
  sleep,
  parseAddress,
  normalizePhone,
  normalizeWebsite,
} from "../utils";

// =============================================================================
// SCRAPER SOURCE INTERFACE
// =============================================================================

/**
 * Interface that all scraper sources must implement
 */
export interface ScraperSource {
  /** Unique identifier for this source */
  name: DataSource;

  /** Human-readable display name */
  displayName: string;

  /** Description of this data source */
  description: string;

  /** Does this scraper require a browser (Puppeteer)? */
  requiresBrowser: boolean;

  /**
   * Scrape establishments from this source
   *
   * @param config - Scraper configuration
   * @returns Array of scraped establishments
   */
  scrape(config: ScraperConfig): Promise<ScrapedEstablishment[]>;
}

// =============================================================================
// BASE SCRAPER SOURCE
// =============================================================================

/**
 * Abstract base class for all scraper sources.
 * Provides common utilities and structure.
 */
export abstract class BaseScraperSource implements ScraperSource {
  abstract name: DataSource;
  abstract displayName: string;
  abstract description: string;
  abstract requiresBrowser: boolean;

  protected logger: Logger;

  constructor(verbose: boolean = false) {
    this.logger = createLogger(verbose);
  }

  /**
   * Main scrape method - must be implemented by subclasses
   */
  abstract scrape(config: ScraperConfig): Promise<ScrapedEstablishment[]>;

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  /**
   * Parse address into components
   */
  protected parseAddress(text: string, defaults?: AddressDefaults): ParsedAddress {
    return parseAddress(text, defaults);
  }

  /**
   * Normalize phone number
   */
  protected normalizePhone(phone: string): string {
    return normalizePhone(phone);
  }

  /**
   * Normalize website URL
   */
  protected normalizeWebsite(url: string): string {
    return normalizeWebsite(url);
  }

  /**
   * Sleep for rate limiting
   */
  protected async sleep(ms: number): Promise<void> {
    return sleep(ms);
  }

  /**
   * Create an empty stats object
   */
  protected createEmptyStats(): ScraperStats {
    return {
      found: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      geocoded: 0,
      geocodeFailed: 0,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    error: Error,
    startTime: number
  ): ScraperResult {
    return {
      success: false,
      source: this.name,
      establishments: [],
      stats: this.createEmptyStats(),
      errors: [
        {
          source: this.name,
          message: error.message,
          retryable: true,
        },
      ],
      duration: Date.now() - startTime,
    };
  }

  /**
   * Create a success result
   */
  protected createSuccessResult(
    establishments: ScrapedEstablishment[],
    stats: ScraperStats,
    startTime: number,
    errors: ScraperError[] = []
  ): ScraperResult {
    return {
      success: true,
      source: this.name,
      establishments,
      stats,
      errors,
      duration: Date.now() - startTime,
    };
  }
}

// =============================================================================
// BROWSER SCRAPER SOURCE
// =============================================================================

/**
 * Base class for scrapers that require a browser (Puppeteer).
 * Handles browser lifecycle and common browser operations.
 */
export abstract class BrowserScraperSource extends BaseScraperSource {
  requiresBrowser = true as const;

  protected browser: Browser | null = null;

  /**
   * Regional chapters to scrape (override in subclasses)
   */
  protected abstract chapters: RegionalChapter[];

  /**
   * Main scrape implementation
   */
  async scrape(config: ScraperConfig): Promise<ScrapedEstablishment[]> {
    const startTime = Date.now();
    const allEstablishments: ScrapedEstablishment[] = [];

    // Filter chapters by config
    const chaptersToScrape = this.filterChapters(config);

    if (chaptersToScrape.length === 0) {
      this.logger.warn("No chapters match the provided filters");
      return [];
    }

    this.logger.info(
      `Scraping ${chaptersToScrape.length} chapters from ${this.displayName}`
    );

    // Launch browser
    const puppeteer = await import("puppeteer");
    this.browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      for (const chapter of chaptersToScrape) {
        this.logger.info(`\n--- Scraping: ${chapter.region} ---`);
        this.logger.debug(`URL: ${chapter.url}`);

        try {
          const establishments = await this.scrapeChapter(chapter, config);
          allEstablishments.push(...establishments);

          this.logger.info(
            `  Found ${establishments.length} establishments in ${chapter.region}`
          );
        } catch (error) {
          this.logger.error(
            `  Error scraping ${chapter.region}:`,
            error instanceof Error ? error.message : error
          );
        }

        // Rate limiting between chapters
        await this.sleep(config.rateLimit || 2000);
      }
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.info(
      `\nCompleted ${this.displayName} scraping in ${(duration / 1000).toFixed(1)}s`
    );
    this.logger.info(`Total establishments found: ${allEstablishments.length}`);

    return allEstablishments;
  }

  /**
   * Scrape a single chapter - must be implemented by subclasses
   */
  protected abstract scrapeChapter(
    chapter: RegionalChapter,
    config: ScraperConfig
  ): Promise<ScrapedEstablishment[]>;

  /**
   * Filter chapters based on config
   */
  protected filterChapters(config: ScraperConfig): RegionalChapter[] {
    let filtered = [...this.chapters];

    if (config.region) {
      const regionLower = config.region.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.region.toLowerCase().includes(regionLower) ||
          regionLower.includes(c.region.toLowerCase())
      );
    }

    if (config.state) {
      const stateLower = config.state.toLowerCase();
      filtered = filtered.filter((c) => c.state.toLowerCase() === stateLower);
    }

    return filtered;
  }

  /**
   * Create a new page with standard settings
   */
  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const page = await this.browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    return page;
  }

  /**
   * Scroll to bottom of page to trigger lazy loading
   */
  protected async scrollToBottom(
    page: Page,
    options: {
      maxScrolls?: number;
      scrollDelay?: number;
      onScroll?: (scrollNum: number, height: number) => void;
    } = {}
  ): Promise<void> {
    const { maxScrolls = 50, scrollDelay = 1500, onScroll } = options;

    let previousHeight = 0;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.sleep(scrollDelay);

      // Check if page height increased
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);

      if (onScroll) {
        onScroll(scrollCount + 1, currentHeight);
      }

      if (currentHeight === previousHeight) {
        // No new content loaded
        break;
      }

      previousHeight = currentHeight;
      scrollCount++;
    }
  }

  /**
   * Wait for an element with retry
   */
  protected async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click an element and wait
   */
  protected async clickAndWait(
    page: Page,
    selector: string,
    waitTime: number = 1000
  ): Promise<boolean> {
    try {
      await page.click(selector);
      await this.sleep(waitTime);
      return true;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// STATIC SCRAPER SOURCE
// =============================================================================

/**
 * Base class for scrapers that use static HTML parsing (Cheerio).
 * Used when JavaScript execution is not required.
 */
export abstract class StaticScraperSource extends BaseScraperSource {
  requiresBrowser = false as const;

  /**
   * Fetch HTML content from a URL
   */
  protected async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Load Cheerio from HTML
   */
  protected async loadCheerio(html: string) {
    const cheerio = await import("cheerio");
    return cheerio.load(html);
  }
}
