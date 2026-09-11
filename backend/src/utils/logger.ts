import { env } from '../config/env.config';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  meta?: Record<string, any>;
  stack?: string;
}

class Logger {
  private formatLog(payload: LogPayload): string {
    if (env.NODE_ENV === 'production') {
      return JSON.stringify(payload);
    }

    const reqStr = payload.requestId ? ` [req-id:${payload.requestId}]` : '';
    const metaStr = payload.meta && Object.keys(payload.meta).length > 0
      ? ` | ${JSON.stringify(payload.meta)}`
      : '';
    const stackStr = payload.stack ? `\n${payload.stack}` : '';

    return `[${payload.timestamp}] ${payload.level.toUpperCase()}${reqStr}: ${payload.message}${metaStr}${stackStr}`;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>, requestId?: string, stack?: string) {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId && { requestId }),
      ...(meta && Object.keys(meta).length > 0 && { meta }),
      ...(stack && { stack })
    };

    const formatted = this.formatLog(payload);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (env.NODE_ENV !== 'production') {
          console.debug(formatted);
        }
        break;
      case 'info':
      default:
        console.log(formatted);
        break;
    }
  }

  info(message: string, meta?: Record<string, any>, requestId?: string) {
    this.log('info', message, meta, requestId);
  }

  warn(message: string, meta?: Record<string, any>, requestId?: string) {
    this.log('warn', message, meta, requestId);
  }

  error(message: string, meta?: Record<string, any>, requestId?: string, stack?: string) {
    this.log('error', message, meta, requestId, stack);
  }

  debug(message: string, meta?: Record<string, any>, requestId?: string) {
    this.log('debug', message, meta, requestId);
  }
}

export const logger = new Logger();
