import { WorkflowStep, WorkflowExecution, WorkflowLog, SelectorConfig } from '@/types';
import { scraper } from '@/lib/scraper/engine';
import axios from 'axios';

type StepResult = {
  success: boolean;
  data: unknown;
  error?: string;
};

export class WorkflowEngine {
  private execution: WorkflowExecution;
  private context: Map<string, unknown> = new Map();
  private logs: WorkflowLog[] = [];

  constructor(executionId: string, workflowId: string, input?: Record<string, unknown>) {
    this.execution = {
      id: executionId,
      workflowId,
      status: 'running',
      input,
      logs: [],
      startedAt: new Date(),
    };
    
    if (input) {
      Object.entries(input).forEach(([key, value]) => {
        this.context.set(key, value);
      });
    }
  }

  private log(stepId: string, level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      stepId,
      level,
      message,
      data,
    });
  }

  async executeStep(step: WorkflowStep): Promise<StepResult> {
    this.log(step.id, 'info', `Starting step: ${step.name}`);
    
    try {
      let result: unknown;

      switch (step.type) {
        case 'scrape':
          result = await this.executeScrape(step);
          break;
        case 'transform':
          result = await this.executeTransform(step);
          break;
        case 'filter':
          result = await this.executeFilter(step);
          break;
        case 'merge':
          result = await this.executeMerge(step);
          break;
        case 'split':
          result = await this.executeSplit(step);
          break;
        case 'webhook':
          result = await this.executeWebhook(step);
          break;
        case 'delay':
          result = await this.executeDelay(step);
          break;
        case 'condition':
          result = await this.executeCondition(step);
          break;
        case 'loop':
          result = await this.executeLoop(step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      this.context.set(step.id, result);
      this.log(step.id, 'info', `Completed step: ${step.name}`, result);
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(step.id, 'error', `Failed step: ${step.name}`, errorMessage);
      return { success: false, data: null, error: errorMessage };
    }
  }

  private async executeScrape(step: WorkflowStep): Promise<unknown> {
    const { url, selectors, options } = step.config as {
      url: string;
      selectors: Array<{ name: string; selector: string; extract?: string; attribute?: string; multiple?: boolean }>;
      options?: Record<string, unknown>;
    };

    // Resolve URL from context if it's a reference
    const resolvedUrl = this.resolveValue(url) as string;
    
    const result = await scraper.scrape(resolvedUrl, selectors as SelectorConfig[], options);
    return result;
  }

  private async executeTransform(step: WorkflowStep): Promise<unknown> {
    const { input, operations } = step.config as {
      input: string;
      operations: Array<{ type: string; config: Record<string, unknown> }>;
    };

    let data = this.resolveValue(input);

    for (const operation of operations) {
      data = this.applyTransformOperation(data, operation);
    }

    return data;
  }

  private applyTransformOperation(data: unknown, operation: { type: string; config: Record<string, unknown> }): unknown {
    switch (operation.type) {
      case 'map':
        if (Array.isArray(data)) {
          const field = operation.config.field as string;
          return data.map(item => (item as Record<string, unknown>)[field]);
        }
        return data;

      case 'flatten':
        if (Array.isArray(data)) {
          return data.flat(operation.config.depth as number || 1);
        }
        return data;

      case 'unique':
        if (Array.isArray(data)) {
          return Array.from(new Set(data));
        }
        return data;

      case 'sort':
        if (Array.isArray(data)) {
          const field = operation.config.field as string;
          const order = operation.config.order as 'asc' | 'desc' || 'asc';
          return [...data].sort((a, b) => {
            const aVal = field ? (a as Record<string, unknown>)[field] : a;
            const bVal = field ? (b as Record<string, unknown>)[field] : b;
            const comparison = String(aVal).localeCompare(String(bVal));
            return order === 'desc' ? -comparison : comparison;
          });
        }
        return data;

      case 'limit':
        if (Array.isArray(data)) {
          return data.slice(0, operation.config.count as number);
        }
        return data;

      case 'pick':
        if (typeof data === 'object' && data !== null) {
          const fields = operation.config.fields as string[];
          const picked: Record<string, unknown> = {};
          for (const field of fields) {
            picked[field] = (data as Record<string, unknown>)[field];
          }
          return picked;
        }
        return data;

      default:
        return data;
    }
  }

  private async executeFilter(step: WorkflowStep): Promise<unknown> {
    const { input, conditions } = step.config as {
      input: string;
      conditions: Array<{ field: string; operator: string; value: unknown }>;
    };

    const data = this.resolveValue(input);

    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => {
      return conditions.every(condition => {
        const itemValue = (item as Record<string, unknown>)[condition.field];
        return this.evaluateCondition(itemValue, condition.operator, condition.value);
      });
    });
  }

  private evaluateCondition(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'notEquals':
        return actual !== expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'startsWith':
        return String(actual).startsWith(String(expected));
      case 'endsWith':
        return String(actual).endsWith(String(expected));
      case 'greaterThan':
        return Number(actual) > Number(expected);
      case 'lessThan':
        return Number(actual) < Number(expected);
      case 'exists':
        return actual !== null && actual !== undefined;
      case 'isEmpty':
        return actual === '' || actual === null || actual === undefined;
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      default:
        return false;
    }
  }

  private async executeMerge(step: WorkflowStep): Promise<unknown> {
    const { inputs } = step.config as { inputs: string[] };
    
    const resolvedInputs = inputs.map(input => this.resolveValue(input));
    
    // Merge arrays
    if (resolvedInputs.every(Array.isArray)) {
      return resolvedInputs.flat();
    }
    
    // Merge objects
    if (resolvedInputs.every(item => typeof item === 'object' && !Array.isArray(item))) {
      return Object.assign({}, ...resolvedInputs);
    }
    
    return resolvedInputs;
  }

  private async executeSplit(step: WorkflowStep): Promise<unknown> {
    const { input, by, size } = step.config as {
      input: string;
      by?: string;
      size?: number;
    };

    const data = this.resolveValue(input);

    if (!Array.isArray(data)) {
      return [data];
    }

    if (size) {
      const chunks: unknown[][] = [];
      for (let i = 0; i < data.length; i += size) {
        chunks.push(data.slice(i, i + size));
      }
      return chunks;
    }

    if (by) {
      const groups: Record<string, unknown[]> = {};
      for (const item of data) {
        const key = String((item as Record<string, unknown>)[by] ?? 'undefined');
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
      return groups;
    }

    return [data];
  }

  private async executeWebhook(step: WorkflowStep): Promise<unknown> {
    const { url, method, body, headers } = step.config as {
      url: string;
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    };

    const resolvedUrl = this.resolveValue(url) as string;
    const resolvedBody = body ? this.resolveValue(body) : undefined;

    const response = await axios({
      url: resolvedUrl,
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      data: resolvedBody,
    });

    return {
      status: response.status,
      data: response.data,
    };
  }

  private async executeDelay(step: WorkflowStep): Promise<unknown> {
    const { duration } = step.config as { duration: number };
    await new Promise(resolve => setTimeout(resolve, duration));
    return { delayed: duration };
  }

  private async executeCondition(step: WorkflowStep): Promise<unknown> {
    const { input, conditions, operator } = step.config as {
      input: string;
      conditions: Array<{ field: string; operator: string; value: unknown }>;
      operator?: 'and' | 'or';
    };

    const data = this.resolveValue(input) as Record<string, unknown>;
    const logicalOp = operator || 'and';

    let result: boolean;
    if (logicalOp === 'and') {
      result = conditions.every(condition => 
        this.evaluateCondition(data[condition.field], condition.operator, condition.value)
      );
    } else {
      result = conditions.some(condition => 
        this.evaluateCondition(data[condition.field], condition.operator, condition.value)
      );
    }

    return { result, branch: result ? 'true' : 'false' };
  }

  private async executeLoop(step: WorkflowStep): Promise<unknown> {
    const { input, stepToRun } = step.config as {
      input: string;
      stepToRun: WorkflowStep;
    };

    const items = this.resolveValue(input);
    if (!Array.isArray(items)) {
      return [];
    }

    const results: unknown[] = [];
    for (const item of items) {
      this.context.set('_loopItem', item);
      const result = await this.executeStep(stepToRun);
      results.push(result.data);
    }

    return results;
  }

  private resolveValue(reference: unknown): unknown {
    if (typeof reference !== 'string') {
      return reference;
    }

    // Check if it's a reference to a previous step result (e.g., "{{stepId}}" or "{{stepId.field}}")
    const refMatch = reference.match(/^\{\{(.+?)\}\}$/);
    if (refMatch) {
      const path = refMatch[1].split('.');
      let value: unknown = this.context.get(path[0]);
      
      for (let i = 1; i < path.length && value !== undefined; i++) {
        value = (value as Record<string, unknown>)[path[i]];
      }
      
      return value;
    }

    return reference;
  }

  async execute(steps: WorkflowStep[]): Promise<WorkflowExecution> {
    const stepMap = new Map(steps.map(s => [s.id, s]));
    let currentStepId = steps[0]?.id;

    while (currentStepId) {
      const step = stepMap.get(currentStepId);
      if (!step) break;

      const result = await this.executeStep(step);
      
      if (!result.success) {
        this.execution.status = 'failed';
        break;
      }

      // Determine next step
      if (typeof step.next === 'string') {
        currentStepId = step.next;
      } else if (step.next && typeof step.next === 'object') {
        const conditionResult = result.data as { branch?: string };
        currentStepId = step.next[conditionResult.branch as 'true' | 'false'];
      } else {
        // Find next step by index
        const currentIndex = steps.findIndex(s => s.id === currentStepId);
        currentStepId = steps[currentIndex + 1]?.id;
      }
    }

    if (this.execution.status === 'running') {
      this.execution.status = 'completed';
    }

    this.execution.completedAt = new Date();
    this.execution.logs = this.logs;
    this.execution.output = Object.fromEntries(this.context);

    return this.execution;
  }
}

export function createWorkflowExecution(workflowId: string, input?: Record<string, unknown>): WorkflowEngine {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new WorkflowEngine(executionId, workflowId, input);
}
