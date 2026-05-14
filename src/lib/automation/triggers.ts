import cronParser from 'cron-parser';

export interface ScheduleInfo {
  cron: string;
  next: Date;
  previous: Date | null;
  isValid: boolean;
  description: string;
}

/**
 * Parse and validate cron expression
 */
export function parseCronExpression(cron: string): ScheduleInfo | null {
  try {
    const interval = cronParser.parseExpression(cron);
    return {
      cron,
      next: interval.next().toDate(),
      previous: interval.hasPrev() ? interval.prev().toDate() : null,
      isValid: true,
      description: describeCron(cron),
    };
  } catch {
    return null;
  }
}

/**
 * Get next N execution times for a cron expression
 */
export function getNextExecutions(cron: string, count: number = 5): Date[] {
  try {
    const interval = cronParser.parseExpression(cron);
    const executions: Date[] = [];
    
    for (let i = 0; i < count; i++) {
      executions.push(interval.next().toDate());
    }
    
    return executions;
  } catch {
    return [];
  }
}

/**
 * Human-readable description of cron expression
 */
export function describeCron(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Invalid cron expression';

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (cron === '* * * * *') return 'Every minute';
  if (cron === '0 * * * *') return 'Every hour';
  if (cron === '0 0 * * *') return 'Every day at midnight';
  if (cron === '0 0 * * 0') return 'Every Sunday at midnight';
  if (cron === '0 0 1 * *') return 'First day of every month at midnight';

  // Build description
  const descriptions: string[] = [];

  // Minute
  if (minute === '*') {
    descriptions.push('every minute');
  } else if (minute.includes('/')) {
    const interval = minute.split('/')[1];
    descriptions.push(`every ${interval} minutes`);
  } else if (minute.includes(',')) {
    descriptions.push(`at minutes ${minute}`);
  } else {
    descriptions.push(`at minute ${minute}`);
  }

  // Hour
  if (hour !== '*') {
    if (hour.includes('/')) {
      const interval = hour.split('/')[1];
      descriptions.push(`every ${interval} hours`);
    } else {
      descriptions.push(`at hour ${hour}`);
    }
  }

  // Day of month
  if (dayOfMonth !== '*') {
    if (dayOfMonth.includes('/')) {
      const interval = dayOfMonth.split('/')[1];
      descriptions.push(`every ${interval} days`);
    } else {
      descriptions.push(`on day ${dayOfMonth}`);
    }
  }

  // Month
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  if (month !== '*') {
    const monthNum = parseInt(month);
    if (!isNaN(monthNum) && monthNames[monthNum]) {
      descriptions.push(`in ${monthNames[monthNum]}`);
    }
  }

  // Day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (dayOfWeek !== '*') {
    const dayNum = parseInt(dayOfWeek);
    if (!isNaN(dayNum) && dayNames[dayNum]) {
      descriptions.push(`on ${dayNames[dayNum]}`);
    }
  }

  return descriptions.join(', ');
}

/**
 * Common cron presets
 */
export const CRON_PRESETS = {
  everyMinute: '* * * * *',
  every5Minutes: '*/5 * * * *',
  every15Minutes: '*/15 * * * *',
  every30Minutes: '*/30 * * * *',
  everyHour: '0 * * * *',
  every6Hours: '0 */6 * * *',
  every12Hours: '0 */12 * * *',
  daily: '0 0 * * *',
  dailyAt9am: '0 9 * * *',
  dailyAt6pm: '0 18 * * *',
  weekly: '0 0 * * 0',
  weekdays: '0 9 * * 1-5',
  weekends: '0 10 * * 0,6',
  monthly: '0 0 1 * *',
  quarterly: '0 0 1 1,4,7,10 *',
  yearly: '0 0 1 1 *',
};

export type TriggerType = 'schedule' | 'webhook' | 'manual' | 'event';

export interface Trigger {
  id: string;
  type: TriggerType;
  config: TriggerConfig;
  active: boolean;
}

export interface TriggerConfig {
  // Schedule trigger
  cron?: string;
  timezone?: string;
  
  // Webhook trigger
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  secret?: string;
  
  // Event trigger
  event?: string;
  filter?: Record<string, unknown>;
}

/**
 * Validate trigger configuration
 */
export function validateTrigger(trigger: Trigger): { valid: boolean; error?: string } {
  switch (trigger.type) {
    case 'schedule':
      if (!trigger.config.cron) {
        return { valid: false, error: 'Cron expression is required for schedule triggers' };
      }
      const parsed = parseCronExpression(trigger.config.cron);
      if (!parsed) {
        return { valid: false, error: 'Invalid cron expression' };
      }
      break;
      
    case 'webhook':
      if (!trigger.config.path) {
        return { valid: false, error: 'Path is required for webhook triggers' };
      }
      if (!trigger.config.path.startsWith('/')) {
        return { valid: false, error: 'Webhook path must start with /' };
      }
      break;
      
    case 'event':
      if (!trigger.config.event) {
        return { valid: false, error: 'Event name is required for event triggers' };
      }
      break;
  }
  
  return { valid: true };
}

/**
 * Check if trigger should fire based on current time
 */
export function shouldTriggerFire(trigger: Trigger, lastRun?: Date): boolean {
  if (!trigger.active) return false;
  
  if (trigger.type === 'schedule' && trigger.config.cron) {
    const now = new Date();
    const schedule = parseCronExpression(trigger.config.cron);
    
    if (!schedule) return false;
    
    // If we have a last run time, check if next execution is before now
    if (lastRun) {
      try {
        const interval = cronParser.parseExpression(trigger.config.cron, { currentDate: lastRun });
        const nextRun = interval.next().toDate();
        return nextRun <= now;
      } catch {
        return false;
      }
    }
    
    return true; // First run
  }
  
  return false;
}
