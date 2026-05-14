import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { scraper } from '@/lib/scraper/engine';
import { SelectorConfig } from '@/types';

// POST - Run a specific job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get job
    const job = await prisma.scrapeJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update job status
    await prisma.scrapeJob.update({
      where: { id },
      data: { status: 'RUNNING' },
    });

    // Execute scrape
    const selectors = job.selectors as unknown as SelectorConfig[];
    const result = await scraper.scrape(job.url, selectors, { includeMetadata: true });

    // Save result
    await prisma.scrapeResult.create({
      data: {
        jobId: id,
        data: result.data,
        metadata: result.metadata || {},
        status: result.success ? 'SUCCESS' : 'FAILED',
        error: result.error,
        duration: result.duration,
      },
    });

    // Update job status
    await prisma.scrapeJob.update({
      where: { id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        lastRunAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Update job status to failed
    await prisma.scrapeJob.update({
      where: { id },
      data: { status: 'FAILED' },
    }).catch(() => {});

    console.error('Job execution error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Job execution failed' },
      { status: 500 }
    );
  }
}
