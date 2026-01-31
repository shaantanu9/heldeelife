/**
 * Structured Logging Utility
 * Provides consistent logging format for production debugging
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  error?: {
    message: string
    stack?: string
    name?: string
  }
  context?: {
    userId?: string
    requestId?: string
    path?: string
    method?: string
  }
}

class Logger {
  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    if (data) {
      if (data instanceof Error) {
        entry.error = {
          message: data.message,
          stack: data.stack,
          name: data.name,
        }
        // Include any additional properties
        if (Object.keys(data).length > 0) {
          entry.data = { ...data }
        }
      } else {
        entry.data = data
      }
    }

    return entry
  }

  private output(entry: LogEntry) {
    const jsonString = JSON.stringify(entry)

    switch (entry.level) {
      case 'error':
        console.error(jsonString)
        break
      case 'warn':
        console.warn(jsonString)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(jsonString)
        }
        break
      default:
        console.log(jsonString)
    }
  }

  /**
   * Log informational message
   */
  info(message: string, data?: any) {
    const entry = this.formatLog('info', message, data)
    this.output(entry)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any) {
    const entry = this.formatLog('warn', message, data)
    this.output(entry)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, data?: any) {
    const entry = this.formatLog('error', message, error || data)
    this.output(entry)
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.formatLog('debug', message, data)
      this.output(entry)
    }
  }

  /**
   * Log with context (for API routes)
   */
  logWithContext(
    level: LogLevel,
    message: string,
    context: LogEntry['context'],
    data?: any
  ) {
    const entry = this.formatLog(level, message, data)
    entry.context = context
    this.output(entry)
  }
}

export const logger = new Logger()







