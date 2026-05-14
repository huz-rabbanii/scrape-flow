/**
 * Pre-built selector templates for common scraping scenarios
 */

import { SelectorConfig } from '@/types';

export const SELECTOR_TEMPLATES: Record<string, SelectorConfig[]> = {
  // E-commerce product page
  product: [
    { name: 'title', selector: 'h1, [itemprop="name"]', extract: 'text' },
    { name: 'price', selector: '[itemprop="price"], .price, [class*="price"]', extract: 'text' },
    { name: 'description', selector: '[itemprop="description"], .description', extract: 'text' },
    { name: 'image', selector: '[itemprop="image"], .product-image img', extract: 'attribute', attribute: 'src' },
    { name: 'rating', selector: '[itemprop="ratingValue"], .rating', extract: 'text' },
    { name: 'reviews', selector: '[itemprop="reviewCount"], .reviews-count', extract: 'text' },
    { name: 'availability', selector: '[itemprop="availability"], .stock-status', extract: 'text' },
    { name: 'sku', selector: '[itemprop="sku"], .sku', extract: 'text' },
    { name: 'brand', selector: '[itemprop="brand"], .brand', extract: 'text' },
  ],

  // Product listing page
  productList: [
    { 
      name: 'products', 
      selector: '.product, [class*="product-card"], [data-product]', 
      multiple: true,
      extract: 'text'
    },
  ],

  // News/Blog article
  article: [
    { name: 'title', selector: 'h1, .article-title, .post-title', extract: 'text' },
    { name: 'author', selector: '[rel="author"], .author, .byline', extract: 'text' },
    { name: 'date', selector: 'time, .date, .published', extract: 'text' },
    { name: 'content', selector: 'article, .article-content, .post-content', extract: 'text' },
    { name: 'tags', selector: '.tags a, .tag, .category', multiple: true, extract: 'text' },
    { name: 'image', selector: '.featured-image img, article img:first-child', extract: 'attribute', attribute: 'src' },
  ],

  // News listing
  newsList: [
    { 
      name: 'headlines', 
      selector: 'h2 a, h3 a, .headline a, .article-link', 
      multiple: true, 
      extract: 'text' 
    },
    { 
      name: 'links', 
      selector: 'h2 a, h3 a, .headline a, .article-link', 
      multiple: true, 
      extract: 'attribute', 
      attribute: 'href' 
    },
  ],

  // Job listing
  job: [
    { name: 'title', selector: 'h1, .job-title', extract: 'text' },
    { name: 'company', selector: '.company, .employer', extract: 'text' },
    { name: 'location', selector: '.location, .job-location', extract: 'text' },
    { name: 'salary', selector: '.salary, .compensation', extract: 'text' },
    { name: 'description', selector: '.job-description, .description', extract: 'text' },
    { name: 'requirements', selector: '.requirements, .qualifications', extract: 'text' },
    { name: 'benefits', selector: '.benefits, .perks', extract: 'text' },
    { name: 'postedDate', selector: '.posted-date, .date', extract: 'text' },
  ],

  // Contact information
  contact: [
    { name: 'email', selector: 'a[href^="mailto:"]', extract: 'attribute', attribute: 'href' },
    { name: 'phone', selector: 'a[href^="tel:"]', extract: 'attribute', attribute: 'href' },
    { name: 'address', selector: 'address, .address, [itemprop="address"]', extract: 'text' },
    { name: 'social', selector: 'a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]', multiple: true, extract: 'attribute', attribute: 'href' },
  ],

  // Real estate listing
  property: [
    { name: 'title', selector: 'h1, .property-title', extract: 'text' },
    { name: 'price', selector: '.price, [class*="price"]', extract: 'text' },
    { name: 'address', selector: '.address, .location', extract: 'text' },
    { name: 'bedrooms', selector: '.beds, .bedrooms, [class*="bed"]', extract: 'text' },
    { name: 'bathrooms', selector: '.baths, .bathrooms, [class*="bath"]', extract: 'text' },
    { name: 'sqft', selector: '.sqft, .area, [class*="size"]', extract: 'text' },
    { name: 'description', selector: '.description, .property-description', extract: 'text' },
    { name: 'images', selector: '.gallery img, .property-image img', multiple: true, extract: 'attribute', attribute: 'src' },
  ],

  // Social media post
  socialPost: [
    { name: 'author', selector: '.author, .username, .profile-name', extract: 'text' },
    { name: 'content', selector: '.post-content, .tweet-text, .status', extract: 'text' },
    { name: 'timestamp', selector: 'time, .timestamp, .date', extract: 'text' },
    { name: 'likes', selector: '.likes, .like-count, [class*="like"]', extract: 'text' },
    { name: 'comments', selector: '.comments, .comment-count, [class*="comment"]', extract: 'text' },
    { name: 'shares', selector: '.shares, .retweets, [class*="share"]', extract: 'text' },
  ],

  // Restaurant/Business
  business: [
    { name: 'name', selector: 'h1, .business-name', extract: 'text' },
    { name: 'rating', selector: '.rating, [itemprop="ratingValue"]', extract: 'text' },
    { name: 'reviewCount', selector: '.review-count, [itemprop="reviewCount"]', extract: 'text' },
    { name: 'address', selector: '.address, [itemprop="address"]', extract: 'text' },
    { name: 'phone', selector: '.phone, [itemprop="telephone"]', extract: 'text' },
    { name: 'hours', selector: '.hours, .opening-hours', extract: 'text' },
    { name: 'categories', selector: '.category, .categories a', multiple: true, extract: 'text' },
    { name: 'priceRange', selector: '.price-range, [class*="price"]', extract: 'text' },
  ],

  // Generic page metadata
  metadata: [
    { name: 'title', selector: 'title', extract: 'text' },
    { name: 'description', selector: 'meta[name="description"]', extract: 'attribute', attribute: 'content' },
    { name: 'keywords', selector: 'meta[name="keywords"]', extract: 'attribute', attribute: 'content' },
    { name: 'ogTitle', selector: 'meta[property="og:title"]', extract: 'attribute', attribute: 'content' },
    { name: 'ogDescription', selector: 'meta[property="og:description"]', extract: 'attribute', attribute: 'content' },
    { name: 'ogImage', selector: 'meta[property="og:image"]', extract: 'attribute', attribute: 'content' },
    { name: 'canonical', selector: 'link[rel="canonical"]', extract: 'attribute', attribute: 'href' },
  ],
};

/**
 * Build selectors dynamically based on patterns
 */
export function buildSelectors(patterns: string[]): SelectorConfig[] {
  return patterns.map((pattern, index) => ({
    name: `field_${index}`,
    selector: pattern,
    extract: 'text',
  }));
}

/**
 * Merge multiple selector templates
 */
export function mergeTemplates(...templateNames: string[]): SelectorConfig[] {
  const merged: SelectorConfig[] = [];
  const seen = new Set<string>();

  for (const name of templateNames) {
    const template = SELECTOR_TEMPLATES[name];
    if (template) {
      for (const selector of template) {
        if (!seen.has(selector.name)) {
          merged.push(selector);
          seen.add(selector.name);
        }
      }
    }
  }

  return merged;
}

/**
 * Common CSS selector helpers
 */
export const CSS_HELPERS = {
  // Attribute selectors
  hasAttribute: (attr: string) => `[${attr}]`,
  attributeEquals: (attr: string, value: string) => `[${attr}="${value}"]`,
  attributeContains: (attr: string, value: string) => `[${attr}*="${value}"]`,
  attributeStartsWith: (attr: string, value: string) => `[${attr}^="${value}"]`,
  attributeEndsWith: (attr: string, value: string) => `[${attr}$="${value}"]`,
  
  // Class selectors
  classContains: (value: string) => `[class*="${value}"]`,
  
  // ID selectors
  idContains: (value: string) => `[id*="${value}"]`,
  
  // Structural selectors
  nthChild: (n: number) => `:nth-child(${n})`,
  nthOfType: (n: number) => `:nth-of-type(${n})`,
  firstChild: ':first-child',
  lastChild: ':last-child',
  
  // Content selectors
  empty: ':empty',
  notEmpty: ':not(:empty)',
};
