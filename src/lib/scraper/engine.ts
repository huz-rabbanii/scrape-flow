import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { SelectorConfig, ScrapedData, ScrapeOptions, ScrapeResult } from '@/types';

// Create an https agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export class ScrapingEngine {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async fetchPage(url: string, options: ScrapeOptions = {}): Promise<string> {
    const headers = {
      'User-Agent': options.userAgent || this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers,
    };

    const response = await axios.get(url, {
      headers,
      maxRedirects: 5,
      timeout: options.timeout || 30000,
      validateStatus: (status) => status < 400,
      httpsAgent,
    });
    
    return response.data;
  }

  extractData(html: string, selectors: SelectorConfig[]): ScrapedData {
    const $ = cheerio.load(html);
    const result: ScrapedData = {};

    for (const selector of selectors) {
      try {
        const elements = $(selector.selector);
        
        if (selector.multiple) {
          result[selector.name] = elements.map((_, el) => 
            this.extractValue($, $(el), selector)
          ).get();
        } else {
          const element = elements.first();
          result[selector.name] = this.extractValue($, element, selector);
        }
      } catch (error) {
        result[selector.name] = selector.default ?? null;
      }
    }

    return result;
  }

  private extractValue(
    $: cheerio.CheerioAPI, 
    element: cheerio.Cheerio<cheerio.AnyNode>, 
    selector: SelectorConfig
  ): string | null {
    if (!element.length) {
      return selector.default ?? null;
    }

    let value: string | null = null;

    switch (selector.extract) {
      case 'text':
        value = element.text().trim();
        break;
      case 'html':
        value = element.html();
        break;
      case 'attribute':
        value = element.attr(selector.attribute || 'href') || null;
        break;
      default:
        value = element.text().trim();
    }

    // Apply transformations
    if (value && selector.transform) {
      value = this.applyTransform(value, selector.transform);
    }

    return value || selector.default || null;
  }

  private applyTransform(value: string, transform: string): string {
    switch (transform) {
      case 'lowercase':
        return value.toLowerCase();
      case 'uppercase':
        return value.toUpperCase();
      case 'trim':
        return value.trim();
      case 'number':
        return parseFloat(value.replace(/[^0-9.-]/g, '')).toString();
      case 'removeSpaces':
        return value.replace(/\s+/g, ' ').trim();
      case 'extractEmail':
        const emailMatch = value.match(/[\w.-]+@[\w.-]+\.\w+/);
        return emailMatch ? emailMatch[0] : value;
      case 'extractPhone':
        const phoneMatch = value.match(/[\d\s()+-]{10,}/);
        return phoneMatch ? phoneMatch[0].trim() : value;
      case 'extractUrl':
        const urlMatch = value.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : value;
      default:
        return value;
    }
  }

  extractMetadata(html: string, url: string): Record<string, string | null> {
    const $ = cheerio.load(html);
    
    return {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || null,
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
      author: $('meta[name="author"]').attr('content') || null,
      image: $('meta[property="og:image"]').attr('content') || null,
      canonical: $('link[rel="canonical"]').attr('href') || url,
      favicon: $('link[rel="icon"]').attr('href') || 
               $('link[rel="shortcut icon"]').attr('href') || null,
    };
  }

  extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: Set<string> = new Set();
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.add(absoluteUrl);
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return Array.from(links);
  }

  extractImages(html: string, baseUrl: string): Array<{ src: string; alt: string | null }> {
    const $ = cheerio.load(html);
    const images: Array<{ src: string; alt: string | null }> = [];
    
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          images.push({
            src: absoluteUrl,
            alt: $(el).attr('alt') || null,
          });
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return images;
  }

  private formatError(error: unknown): string {
    if (!(error instanceof Error)) return 'Unknown error occurred';
    
    const message = error.message.toLowerCase();
    
    // SSL/Certificate errors
    if (message.includes('certificate') || message.includes('ssl') || message.includes('tls')) {
      return `SSL Certificate Error: ${error.message}. Try using HTTP instead of HTTPS, or the site may have an invalid certificate.`;
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('etimedout')) {
      return `Request Timeout: The website took too long to respond. Try again later or check if the URL is accessible.`;
    }
    
    // Connection errors
    if (message.includes('econnrefused') || message.includes('enotfound')) {
      return `Connection Failed: Could not connect to the website. Check if the URL is correct and the site is online.`;
    }
    
    // 403 Forbidden
    if (message.includes('403') || message.includes('forbidden')) {
      return `Access Denied (403): The website blocked the request. It may have anti-bot protection.`;
    }
    
    // 404 Not Found
    if (message.includes('404') || message.includes('not found')) {
      return `Page Not Found (404): The URL doesn't exist. Check if the URL is correct.`;
    }
    
    // Rate limiting
    if (message.includes('429') || message.includes('too many')) {
      return `Rate Limited (429): Too many requests. Wait a few minutes before trying again.`;
    }
    
    // Generic HTTP errors
    if (message.includes('status code')) {
      return `HTTP Error: ${error.message}. The website returned an error response.`;
    }
    
    return error.message;
  }

  async scrape(url: string, selectors: SelectorConfig[], options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const startTime = Date.now();
    
    try {
      const html = await this.fetchPage(url, options);
      const data = this.extractData(html, selectors);
      const metadata = options.includeMetadata ? this.extractMetadata(html, url) : undefined;
      const links = options.includeLinks ? this.extractLinks(html, url) : undefined;
      const images = options.includeImages ? this.extractImages(html, url) : undefined;

      return {
        success: true,
        data,
        metadata,
        links,
        images,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        error: this.formatError(error),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const scraper = new ScrapingEngine();
