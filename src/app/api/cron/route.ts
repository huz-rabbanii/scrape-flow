import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { scraper } from '@/lib/scraper/engine';
import { SelectorConfig } from '@/types';
import { parseCronExpression } from '@/lib/automation/triggers';

// This endpoint is meant to be called by Vercel Cron or external scheduler
// It checks for scheduled jobs and runs them

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // Find jobs due for execution
    const dueJobs = await prisma.scrapeJob.findMany({
      where: {
        status: 'SCHEDULED',
        nextRunAt: { lte: now },
      },
      take: 10, // Process max 10 jobs per invocation
    });

    const results = [];

    for (const job of dueJobs) {
      try {
        // Update status to running
        await prisma.scrapeJob.update({
          where: { id: job.id },
          data: { status: 'RUNNING' },
        });

        // Execute scrape
        const selectors = JSON.parse(job.selectors) as SelectorConfig[];
        const result = await scraper.scrape(job.url, selectors, { includeMetadata: true });

        // Save result
        await prisma.scrapeResult.create({
          data: {
            jobId: job.id,
            data: JSON.stringify(result.data),
            metadata: JSON.stringify(result.metadata || {}),
            status: result.success ? 'SUCCESS' : 'FAILED',
            error: result.error,
            duration: result.duration,
          },
        });

        // Calculate next run time
        let nextRunAt: Date | undefined;
        if (job.schedule) {
          const cronInfo = parseCronExpression(job.schedule);
          if (cronInfo) {
            nextRunAt = cronInfo.next;
          }
        }

        // Update job status
        await prisma.scrapeJob.update({
          where: { id: job.id },
          data: {
            status: 'SCHEDULED',
            lastRunAt: now,
            nextRunAt,
          },
        });

        results.push({
          jobId: job.id,
          success: result.success,
          duration: result.duration,
        });
      } catch (error) {
        // Mark job as failed but keep schedule
        await prisma.scrapeJob.update({
          where: { id: job.id },
          data: {
            status: 'SCHEDULED',
            lastRunAt: now,
          },
        });

        results.push({
          jobId: job.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Cron execution failed' },
      { status: 500 }
    );
  }
}

// POST - Manually trigger cron for testing
export async function POST(request: NextRequest) {
  return GET(request);
}
