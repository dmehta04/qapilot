import chalk from 'chalk';
import type { LayerResult, PipelineResult } from '../engine/types.js';

const VERSION = '0.1.0';

const BANNER = `
  ╔═══════════════════════════════════╗
  ║        ${chalk.bold.cyan('Q A P i l o t')}              ║
  ║   ${chalk.dim('AI-Powered QA Pipeline')}          ║
  ║   ${chalk.dim(`v${VERSION}`)}                          ║
  ╚═══════════════════════════════════╝
`;

export function printBanner() {
  process.stdout.write(BANNER + '\n');
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'pass': return chalk.green('✅');
    case 'fail': return chalk.red('❌');
    case 'warn': return chalk.yellow('⚠️');
    case 'skip': return chalk.gray('⏭️');
    case 'running': return chalk.blue('🔄');
    default: return '  ';
  }
}

function statusColor(status: string): (s: string) => string {
  switch (status) {
    case 'pass': return chalk.green;
    case 'fail': return chalk.red;
    case 'warn': return chalk.yellow;
    case 'skip': return chalk.gray;
    default: return chalk.white;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export function printLayerResult(result: LayerResult) {
  const emoji = statusEmoji(result.status);
  const color = statusColor(result.status);
  const duration = result.duration > 0 ? chalk.dim(` (${formatDuration(result.duration)})`) : '';
  const cmd = result.command ? chalk.dim(` → ${result.command}`) : '';

  console.log(`  ${emoji} ${color(result.layer.padEnd(4))} ${color(result.name.padEnd(15))}${duration}${cmd}`);

  if (result.status === 'fail' && result.error) {
    const firstLine = result.error.split('\n')[0] ?? '';
    if (firstLine) {
      console.log(`       ${chalk.red.dim(firstLine)}`);
    }
  }
}

export function printPipelineResult(result: PipelineResult) {
  console.log('');
  console.log(chalk.bold('  Layer Results'));
  console.log(chalk.dim('  ' + '─'.repeat(60)));

  for (const layer of result.layers) {
    printLayerResult(layer);
  }

  console.log(chalk.dim('  ' + '─'.repeat(60)));
  console.log('');

  const { passed, failed, warned, skipped, total } = result.summary;
  const parts = [
    chalk.green(`${passed} passed`),
    failed > 0 ? chalk.red(`${failed} failed`) : null,
    warned > 0 ? chalk.yellow(`${warned} warned`) : null,
    skipped > 0 ? chalk.gray(`${skipped} skipped`) : null,
    chalk.dim(`${total} total`),
  ].filter(Boolean);

  console.log(`  ${parts.join(chalk.dim(' | '))}`);
  console.log(`  ${chalk.dim('Duration:')} ${formatDuration(result.duration)}`);
  console.log('');

  const verdictColor = result.status === 'pass' ? chalk.green.bold
    : result.status === 'fail' ? chalk.red.bold
    : chalk.yellow.bold;
  const verdictText = result.status === 'pass' ? 'PIPELINE PASSED'
    : result.status === 'fail' ? 'PIPELINE FAILED'
    : 'PIPELINE PASSED WITH WARNINGS';

  console.log(`  ${verdictColor(verdictText)}`);
  console.log('');
}

export function printProgress(layer: string, status: string) {
  const emoji = statusEmoji(status);
  process.stdout.write(`\r  ${emoji} ${chalk.dim(`Running ${layer}...`)}`);
}
