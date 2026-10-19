/**
 * Structured Logging Service for NestJS Enterprise API
 * JSON log lines with a per-request correlation id and user context (AsyncLocalStorage) and audit events.
 */
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface LogContext {
  correlationId: string;
  userId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const storage = new AsyncLocalStorage<LogContext>();

@Injectable()
export class StructuredLoggingService {
  runWithContext<T>(context: LogContext, fn: () => T): T {
    return storage.run(context, fn);
  }

  setContext(context: Partial<LogContext>): void {
    const current = storage.getStore();
    if (current) Object.assign(current, context);
  }

  getContext(): LogContext | null {
    return storage.getStore() ?? null;
  }

  private write(level: string, message: string, extra?: Record<string, unknown>, error?: string) {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.getContext() ?? { correlationId: StructuredLoggingService.createCorrelationId() },
      ...(extra ? { additionalContext: extra } : {}),
      ...(error ? { error } : {}),
    });
    (level === 'Error' ? process.stderr : process.stdout).write(line + '\n');
  }

  logInformation(message: string, additionalContext?: Record<string, unknown>) {
    this.write('Information', message, additionalContext);
  }

  logWarning(message: string, additionalContext?: Record<string, unknown>) {
    this.write('Warning', message, additionalContext);
  }

  logError(message: string, error: string, additionalContext?: Record<string, unknown>) {
    this.write('Error', message, additionalContext, error);
  }

  logAuditEvent(eventType: string, description: string, additionalContext?: Record<string, unknown>) {
    this.write('Audit', `AUDIT: ${description}`, { auditEventType: eventType, ...additionalContext });
  }

  static createCorrelationId(): string {
    return randomUUID();
  }
}
