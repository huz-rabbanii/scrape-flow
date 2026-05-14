// Scraping Types
export interface SelectorConfig {
  name: string;
  selector: string;
  extract?: 'text' | 'html' | 'attribute';
  attribute?: string;
  multiple?: boolean;
  transform?: string;
  default?: string;
}

export interface ScrapeOptions {
  userAgent?: string;
  headers?: Record<string, string>;
  proxy?: {
    url: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  includeMetadata?: boolean;
  includeLinks?: boolean;
  includeImages?: boolean;
}

export interface ScrapedData {
  [key: string]: string | string[] | null;
}

export interface ScrapeResult {
  success: boolean;
  data: ScrapedData;
  metadata?: Record<string, string | null>;
  links?: string[];
  images?: Array<{ src: string; alt: string | null }>;
  error?: string;
  duration: number;
  timestamp: string;
}

// Job Types
export interface JobConfig {
  url: string;
  selectors: SelectorConfig[];
  options?: ScrapeOptions;
  schedule?: string;
  webhookUrl?: string;
}

export interface Job {
  id: string;
  name: string;
  description?: string;
  config: JobConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'scheduled';
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow Types
export type WorkflowStepType = 
  | 'scrape'
  | 'transform'
  | 'filter'
  | 'merge'
  | 'split'
  | 'webhook'
  | 'email'
  | 'delay'
  | 'condition'
  | 'loop';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: Record<string, unknown>;
  next?: string | { true: string; false: string };
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'manual';
  config: {
    cron?: string;
    webhookPath?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  logs: WorkflowLog[];
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowLog {
  timestamp: string;
  stepId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  totalDataPoints: number;
  avgResponseTime: number;
}

export interface RecentActivity {
  id: string;
  type: 'job_completed' | 'job_failed' | 'workflow_executed' | 'data_exported';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Form Types
export interface CreateJobInput {
  name: string;
  description?: string;
  url: string;
  selectors: SelectorConfig[];
  schedule?: string;
  webhookUrl?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
  triggers: WorkflowTrigger[];
}

// Export Types
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'xml';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
