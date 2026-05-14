import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfDay, subDays } from 'date-fns';

// GET - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const last7Days = subDays(now, 7);

    // Aggregate stats
    const [
      totalJobs,
      activeJobs,
      completedToday,
      failedToday,
      totalResults,
      avgDuration,
      recentResults,
      dailyStats,
    ] = await Promise.all([
      // Total jobs
      prisma.scrapeJob.count(),
      
      // Active/scheduled jobs
      prisma.scrapeJob.count({
        where: { status: { in: ['RUNNING', 'SCHEDULED'] } },
      }),
      
      // Completed today
      prisma.scrapeResult.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'SUCCESS',
        },
      }),
      
      // Failed today
      prisma.scrapeResult.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'FAILED',
        },
      }),
      
      // Total data points
      prisma.scrapeResult.count(),
      
      // Average duration
      prisma.scrapeResult.aggregate({
        _avg: { duration: true },
      }),
      
      // Recent results
      prisma.scrapeResult.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          job: { select: { name: true } },
        },
      }),
      
      // Daily stats for last 7 days
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          AVG(duration) as avg_duration
        FROM "ScrapeResult"
        WHERE created_at >= ${last7Days}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `.catch(() => []), // Fallback if raw query fails
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
        dailyStats,
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
