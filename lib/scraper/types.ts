export interface ScraperConfig {
  maxResults?: number;
  rateLimit?: number; // ms between requests
  respectRobotsTxt?: boolean;
  userAgent?: string;
  timeout?: number;
}

export interface ScrapedData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  description: string;
  category: string;
  services?: string[];
  signals: string[]; // Keywords/evidence of Muslim ownership
  confidence: number; // 0-100
  source: string;
  sourceUrl: string;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedData[];
  error?: string;
  scrapedAt: Date;
}
