import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { parseCronExpression, getNextExecutions } from '@/lib/automation/triggers';

// Validation schemas
const CreateJobSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  url: z.string().url('Invalid URL'),
  selectors: z.array(z.object({
    name: z.string(),
    selector: z.string(),
    extract: z.enum(['text', 'html', 'attribute']).optional(),
    attribute: z.string().optional(),
    multiple: z.boolean().optional(),
    transform: z.string().optional(),
    default: z.string().optional(),
  })),
  schedule: z.string().nullable().optional(),
  workflowId: z.string().optional(),
});

const UpdateJobSchema = CreateJobSchema.partial();

// GET - List all jobs or get single job
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  try {
    if (id) {
      // Get single job with results
      const job = await prisma.scrapeJob.findUnique({
        where: { id },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      // Return job directly - PostgreSQL handles JSON natively
      return NextResponse.json({ success: true, data: job });
    }

    // List jobs with pagination
    const where = status ? { status: status as any } : {};
    
    const [jobs, total] = await Promise.all([
      prisma.scrapeJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { results: true } },
        },
      }),
      prisma.scrapeJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateJobSchema.parse(body);

    // Validate cron expression if provided
    let nextRunAt: Date | undefined;
    if (validated.schedule) {
      const cronInfo = parseCronExpression(validated.schedule);
      if (!cronInfo) {
        return NextResponse.json(
          { success: false, error: 'Invalid cron expression' },
          { status: 400 }
        );
      }
      nextRunAt = cronInfo.next;
    }

    const job = await prisma.scrapeJob.create({
      data: {
        name: validated.name,
        description: validated.description,
        url: validated.url,
        selectors: validated.selectors,
        schedule: validated.schedule,
        status: validated.schedule ? 'SCHEDULED' : 'PENDING',
        nextRunAt,
        workflowId: validated.workflowId,
      },
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Job creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// PUT - Update job
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Job ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validated = UpdateJobSchema.parse(body);

    // Validate cron expression if provided
    let nextRunAt: Date | undefined;
    if (validated.schedule) {
      const cronInfo = parseCronExpression(validated.schedule);
      if (!cronInfo) {
        return NextResponse.json(
          { success: false, error: 'Invalid cron expression' },
          { status: 400 }
        );
      }
      nextRunAt = cronInfo.next;
    }

    const job = await prisma.scrapeJob.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.url && { url: validated.url }),
        ...(validated.selectors && { selectors: validated.selectors }),
        ...(validated.schedule !== undefined && { 
          schedule: validated.schedule || null,
          status: validated.schedule ? 'SCHEDULED' : 'PENDING',
          nextRunAt: validated.schedule ? nextRunAt : null,
        }),
      },
    });

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Job update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE - Delete job
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Job ID is required' },
      { status: 400 }
    );
  }

  try {
    await prisma.scrapeJob.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    console.error('Job deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
