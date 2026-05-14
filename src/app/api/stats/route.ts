import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfDay } from 'date-fns';
import { getSessionId } from '@/lib/session';

// GET - Dashboard statistics
export async function GET() {
  try {
    const sessionId = await getSessionId();
    const todayStart = startOfDay(new Date());

    // Get job IDs for this session
    const sessionJobs = await prisma.scrapeJob.findMany({
      where: { sessionId },
      select: { id: true },
    });
    const jobIds = sessionJobs.map(j => j.id);

    // Aggregate stats (filtered by session)
    const [
      totalJobs,
      activeJobs,
      completedToday,
      failedToday,
      totalResults,
      avgDuration,
      recentResults,
    ] = await Promise.all([
      // Total jobs for this session
      prisma.scrapeJob.count({ where: { sessionId } }),
      
      // Active/scheduled jobs for this session
      prisma.scrapeJob.count({
        where: { sessionId, status: { in: ['RUNNING', 'SCHEDULED'] } },
      }),
      
      // Completed today (for session's jobs)
      prisma.scrapeResult.count({
        where: {
          jobId: { in: jobIds },
          createdAt: { gte: todayStart },
          status: 'SUCCESS',
        },
      }),
      
      // Failed today (for session's jobs)
      prisma.scrapeResult.count({
        where: {
          jobId: { in: jobIds },
          createdAt: { gte: todayStart },
          status: 'FAILED',
        },
      }),
      
      // Total data points (for session's jobs)
      prisma.scrapeResult.count({
        where: { jobId: { in: jobIds } },
      }),
      
      // Average duration (for session's jobs)
      prisma.scrapeResult.aggregate({
        where: { jobId: { in: jobIds } },
        _avg: { duration: true },
      }),
      
      // Recent results (for session's jobs)
      prisma.scrapeResult.findMany({
        where: { jobId: { in: jobIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          job: { select: { name: true } },
        },
      }),
    ]);

    // Build recent activity
    const recentActivity = recentResults.map(result => ({
      id: result.id,
      type: result.status === 'SUCCESS' ? 'job_completed' : 'job_failed',
      message: `${result.job.name} - ${result.status === 'SUCCESS' ? 'completed successfully' : 'failed'}`,
      timestamp: result.createdAt,
      metadata: {
        jobId: result.jobId,
        duration: result.duration,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalJobs,
          activeJobs,
          completedToday,
          failedToday,
          totalDataPoints: totalResults,
          avgResponseTime: Math.round(avgDuration._avg?.duration || 0),
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
