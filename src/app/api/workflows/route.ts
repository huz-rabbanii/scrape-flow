import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createWorkflowExecution, WorkflowEngine } from '@/lib/automation/workflows';
import { WorkflowStep, WorkflowTrigger } from '@/types';

// Validation schemas
const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['scrape', 'transform', 'filter', 'merge', 'split', 'webhook', 'email', 'delay', 'condition', 'loop']),
    name: z.string(),
    config: z.record(z.unknown()),
    next: z.union([z.string(), z.object({ true: z.string(), false: z.string() })]).optional(),
  })),
  triggers: z.array(z.object({
    type: z.enum(['schedule', 'webhook', 'manual']),
    config: z.object({
      cron: z.string().optional(),
      webhookPath: z.string().optional(),
    }),
  })),
});

// GET - List all workflows or get single workflow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  try {
    if (id) {
      const workflow = await prisma.workflow.findUnique({
        where: { id },
        include: {
          jobs: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!workflow) {
        return NextResponse.json(
          { success: false, error: 'Workflow not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: workflow });
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { jobs: true, executions: true } },
        },
      }),
      prisma.workflow.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: workflows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Workflows fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        name: validated.name,
        description: validated.description,
        steps: validated.steps as unknown as Prisma.InputJsonValue,
        triggers: validated.triggers as unknown as Prisma.InputJsonValue,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, data: workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Workflow creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

// PUT - Update workflow
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Workflow ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validated = CreateWorkflowSchema.partial().parse(body);

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.steps && { steps: validated.steps as unknown as Prisma.InputJsonValue }),
        ...(validated.triggers && { triggers: validated.triggers as unknown as Prisma.InputJsonValue }),
      },
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error('Workflow update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Workflow ID is required' },
      { status: 400 }
    );
  }

  try {
    await prisma.workflow.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    console.error('Workflow deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
