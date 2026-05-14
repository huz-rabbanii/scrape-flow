import * as cheerio from 'cheerio';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  items: string[];
  type: 'ordered' | 'unordered';
}

/**
 * Parse HTML tables into structured data
 */
export function parseTable(html: string, tableSelector: string = 'table'): TableData[] {
  const $ = cheerio.load(html);
  const tables: TableData[] = [];

  $(tableSelector).each((_, table) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers
    $(table).find('thead tr th, thead tr td, tr:first-child th').each((_, th) => {
      headers.push($(th).text().trim());
    });

    // If no thead, try first row
    if (headers.length === 0) {
      $(table).find('tr:first-child td').each((_, td) => {
        headers.push($(td).text().trim());
      });
    }

    // Extract rows
    const rowSelector = headers.length > 0 ? 'tbody tr, tr:not(:first-child)' : 'tr';
    $(table).find(rowSelector).each((_, tr) => {
      const row: string[] = [];
      $(tr).find('td').each((_, td) => {
        row.push($(td).text().trim());
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });

    tables.push({ headers, rows });
  });

  return tables;
}

/**
 * Parse HTML lists into structured data
 */
export function parseList(html: string, listSelector: string = 'ul, ol'): ListData[] {
  const $ = cheerio.load(html);
  const lists: ListData[] = [];

  $(listSelector).each((_, list) => {
    const items: string[] = [];
    const type = $(list).prop('tagName')?.toLowerCase() === 'ol' ? 'ordered' : 'unordered';

    $(list).find('> li').each((_, li) => {
      items.push($(li).text().trim());
    });

    lists.push({ items, type });
  });

  return lists;
}

/**
 * Parse JSON-LD structured data from HTML
 */
export function parseJsonLd(html: string): Record<string, unknown>[] {
  const $ = cheerio.load(html);
  const jsonLdData: Record<string, unknown>[] = [];

  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const content = $(script).html();
      if (content) {
        const parsed = JSON.parse(content);
        jsonLdData.push(parsed);
      }
    } catch {
      // Invalid JSON, skip
    }
  });

  return jsonLdData;
}

/**
 * Parse prices from text
 */
export function parsePrice(text: string): { value: number; currency: string } | null {
  // Match common price patterns
  const patterns = [
    /\$\s?([\d,]+\.?\d*)/,           // $99.99
    /USD\s?([\d,]+\.?\d*)/i,         // USD 99.99
    /€\s?([\d,]+\.?\d*)/,            // €99.99
    /EUR\s?([\d,]+\.?\d*)/i,         // EUR 99.99
    /£\s?([\d,]+\.?\d*)/,            // £99.99
    /GBP\s?([\d,]+\.?\d*)/i,         // GBP 99.99
    /([\d,]+\.?\d*)\s?(?:USD|EUR|GBP|\$|€|£)/i, // 99.99 USD
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      let currency = 'USD';
      
      if (text.includes('€') || text.toLowerCase().includes('eur')) {
        currency = 'EUR';
      } else if (text.includes('£') || text.toLowerCase().includes('gbp')) {
        currency = 'GBP';
      }
      
      return { value, currency };
    }
  }

  return null;
}

/**
 * Parse dates from text
 */
export function parseDate(text: string): Date | null {
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})/,                    // 2024-01-15
    /(\d{2})\/(\d{2})\/(\d{4})/,                  // 01/15/2024
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,              // January 15, 2024
    /(\d{1,2})\s+(\w+)\s+(\d{4})/,                // 15 January 2024
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[0]);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Extract and clean article content
 */
export function parseArticle(html: string): {
  title: string | null;
  author: string | null;
  publishDate: string | null;
  content: string;
  wordCount: number;
} {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, .advertisement, .ad, .sidebar').remove();

  // Try to find title
  const title = $('h1').first().text().trim() ||
                $('article h1').first().text().trim() ||
                $('[class*="title"]').first().text().trim() ||
                null;

  // Try to find author
  const author = $('[class*="author"]').first().text().trim() ||
                 $('[rel="author"]').first().text().trim() ||
                 $('meta[name="author"]').attr('content') ||
                 null;

  // Try to find publish date
  const publishDate = $('time').attr('datetime') ||
                      $('[class*="date"]').first().text().trim() ||
                      $('meta[property="article:published_time"]').attr('content') ||
                      null;

  // Extract main content
  const articleContent = $('article').html() || 
                         $('[class*="content"]').html() || 
                         $('main').html() ||
                         $('body').html() || '';
  
  const content = cheerio.load(articleContent).text().trim().replace(/\s+/g, ' ');
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  return {
    title,
    author,
    publishDate,
    content,
    wordCount,
  };
}

/**
 * Parse product information
 */
export function parseProduct(html: string): {
  name: string | null;
  price: { value: number; currency: string } | null;
  description: string | null;
  images: string[];
  rating: number | null;
  reviews: number | null;
  availability: string | null;
} {
  const $ = cheerio.load(html);
  
  // Try to find from JSON-LD first
  const jsonLd = parseJsonLd(html);
  const productSchema = jsonLd.find((item: any) => 
    item['@type'] === 'Product' || 
    item['@type']?.includes?.('Product')
  ) as any;

  if (productSchema) {
    return {
      name: productSchema.name || null,
      price: productSchema.offers?.price 
        ? { value: parseFloat(productSchema.offers.price), currency: productSchema.offers.priceCurrency || 'USD' }
        : null,
      description: productSchema.description || null,
      images: Array.isArray(productSchema.image) 
        ? productSchema.image 
        : productSchema.image ? [productSchema.image] : [],
      rating: productSchema.aggregateRating?.ratingValue 
        ? parseFloat(productSchema.aggregateRating.ratingValue) 
        : null,
      reviews: productSchema.aggregateRating?.reviewCount 
        ? parseInt(productSchema.aggregateRating.reviewCount) 
        : null,
      availability: productSchema.offers?.availability || null,
    };
  }

  // Fallback to DOM parsing
  const name = $('[itemprop="name"]').first().text().trim() ||
               $('h1').first().text().trim() ||
               null;

  const priceText = $('[itemprop="price"]').attr('content') ||
                    $('[class*="price"]').first().text().trim() ||
                    '';
  const price = parsePrice(priceText);

  const description = $('[itemprop="description"]').text().trim() ||
                      $('[class*="description"]').first().text().trim() ||
                      null;

  const images: string[] = [];
  $('[itemprop="image"], [class*="product"] img, [class*="gallery"] img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src');
    if (src) images.push(src);
  });

  const ratingText = $('[itemprop="ratingValue"]').text().trim() ||
                     $('[class*="rating"]').first().text().trim() || '';
  const ratingMatch = ratingText.match(/([\d.]+)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  const reviewsText = $('[itemprop="reviewCount"]').text().trim() ||
                      $('[class*="review"]').first().text().trim() || '';
  const reviewsMatch = reviewsText.match(/(\d+)/);
  const reviews = reviewsMatch ? parseInt(reviewsMatch[1]) : null;

  const availability = $('[itemprop="availability"]').attr('content') ||
                       $('[class*="stock"], [class*="availability"]').first().text().trim() ||
                       null;

  return { name, price, description, images, rating, reviews, availability };
}
