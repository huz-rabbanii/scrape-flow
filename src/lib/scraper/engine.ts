import * as cheerio from 'cheerio';
import axios from 'axios';
import { SelectorConfig, ScrapedData, ScrapeOptions, ScrapeResult } from '@/types';

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
    element: cheerio.Cheerio<cheerio.Element>, 
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
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const scraper = new ScrapingEngine();
