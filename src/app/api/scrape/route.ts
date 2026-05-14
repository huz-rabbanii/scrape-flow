import { NextRequest, NextResponse } from 'next/server';
import { scraper } from '@/lib/scraper/engine';
import { SELECTOR_TEMPLATES } from '@/lib/scraper/selectors';
import prisma from '@/lib/db';
import { z } from 'zod';

// Validation schema
const ScrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL'),
  selectors: z.array(z.object({
    name: z.string(),
    selector: z.string(),
    extract: z.enum(['text', 'html', 'attribute']).optional(),
    attribute: z.string().optional(),
    multiple: z.boolean().optional(),
    transform: z.string().optional(),
    default: z.string().optional(),
  })).optional(),
  template: z.string().optional(),
  options: z.object({
    includeMetadata: z.boolean().optional(),
    includeLinks: z.boolean().optional(),
    includeImages: z.boolean().optional(),
    headers: z.record(z.string()).optional(),
  }).optional(),
  saveResult: z.boolean().optional(),
  jobId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ScrapeRequestSchema.parse(body);

    // Get selectors from template or custom
    let selectors = validated.selectors;
    if (validated.template && SELECTOR_TEMPLATES[validated.template]) {
      selectors = SELECTOR_TEMPLATES[validated.template];
    }

    if (!selectors || selectors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No selectors provided. Use custom selectors or a template.' },
        { status: 400 }
      );
    }

    // Execute scrape
    const result = await scraper.scrape(validated.url, selectors, validated.options);

    // Save result if requested
    if (validated.saveResult && validated.jobId) {
      await prisma.scrapeResult.create({
        data: {
          jobId: validated.jobId,
          data: JSON.stringify(result.data),
          metadata: JSON.stringify(result.metadata || {}),
          status: result.success ? 'SUCCESS' : 'FAILED',
          error: result.error,
          duration: result.duration,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Scrape error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}

// GET - Quick scrape with query params
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const template = searchParams.get('template') || 'metadata';

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    const selectors = SELECTOR_TEMPLATES[template] || SELECTOR_TEMPLATES['metadata'];
    const result = await scraper.scrape(url, selectors, { includeMetadata: true });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}
