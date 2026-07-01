/**
 * utils/logger.ts
 * Lightweight structured logger. No external dependencies.
 *
 * Dev:  coloured console output with timestamps
 * Prod: JSON lines (easy to ingest in Railway / Datadog / CloudWatch)
 *
 * Swap to Winston or Pino later if needed — only this file changes.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[37m', // white
  info:  '\x1b[36m', // cyan
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function log(level: LogLevel, message: string, meta?: object) {
  const isProd = process.env['NODE_ENV'] === 'production';
  const ts = new Date().toISOString();

  if (isProd) {
    process.stdout.write(
      JSON.stringify({ ts, level, message, ...meta }) + '\n',
    );
  } else {
    const color = COLORS[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    process.stdout.write(
      `${color}[${ts}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}${RESET}\n`,
    );
  }
}

export const logger = {
  debug: (message: string, meta?: object) => log('debug', message, meta),
  info:  (message: string, meta?: object) => log('info',  message, meta),
  warn:  (message: string, meta?: object) => log('warn',  message, meta),
  error: (message: string, meta?: object) => log('error', message, meta),
};
