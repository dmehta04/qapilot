import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function getThreshold(): number {
  const env = (process.env['QAPILOT_LOG_LEVEL'] ?? 'info').toLowerCase() as LogLevel;
  return LEVELS[env] ?? LEVELS.info;
}

function log(level: LogLevel, prefix: string, msg: string) {
  if (LEVELS[level] < getThreshold()) return;
  const ts = new Date().toISOString().slice(11, 19);
  // eslint-disable-next-line no-console
  console.error(`${chalk.dim(ts)} ${prefix} ${msg}`);
}

export const logger = {
  debug: (msg: string) => log('debug', chalk.gray('DBG'), msg),
  info: (msg: string) => log('info', chalk.blue('INF'), msg),
  warn: (msg: string) => log('warn', chalk.yellow('WRN'), msg),
  error: (msg: string) => log('error', chalk.red('ERR'), msg),
};
