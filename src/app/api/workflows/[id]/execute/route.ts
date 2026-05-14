import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createWorkflowExecution } from '@/lib/automation/workflows';
import { WorkflowStep } from '@/types';
import { Prisma } from '@prisma/client';

// POST - Execute a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json().catch(() => ({}));
    const input = body.input || {};

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Create execution record
    const executionRecord = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: 'RUNNING',
        input: input,
        logs: [],
      },
    });

    // Execute workflow
    const steps = workflow.steps as unknown as WorkflowStep[];
    const engine = createWorkflowExecution(id, input);
    const execution = await engine.execute(steps);

    // Update execution record
    await prisma.workflowExecution.update({
      where: { id: executionRecord.id },
      data: {
        status: execution.status === 'completed' ? 'COMPLETED' : 'FAILED',
        output: execution.output as unknown as Prisma.InputJsonValue,
        logs: execution.logs as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: execution.status === 'completed',
      data: {
        executionId: executionRecord.id,
        status: execution.status,
        output: execution.output,
        logs: execution.logs,
        duration: execution.completedAt 
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : 0,
      },
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Workflow execution failed' },
      { status: 500 }
    );
  }
}

// GET - Get execution history for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  try {
    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: { workflowId: id },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workflowExecution.count({ where: { workflowId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: executions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
