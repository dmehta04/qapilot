import type { Reporter, PipelineResult, ExecutionContext } from '../engine/types.js';
import { logger } from '../utils/logger.js';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export class SlackReporter implements Reporter {
  name = 'slack';

  async report(result: PipelineResult, ctx: ExecutionContext): Promise<void> {
    const webhookUrl =
      ctx.config.notifications?.slack?.webhookUrl ?? process.env['QAPILOT_SLACK_WEBHOOK'];

    if (!webhookUrl) {
      logger.warn('Slack webhook not configured, skipping Slack report');
      return;
    }

    const emoji = result.status === 'pass' ? ':white_check_mark:' : result.status === 'fail' ? ':x:' : ':warning:';
    const statusText = result.status.toUpperCase();
    const { passed, failed, warned, skipped } = result.summary;

    const ciUrl = process.env['GITHUB_SERVER_URL'] && process.env['GITHUB_REPOSITORY'] && process.env['GITHUB_RUN_ID']
      ? `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/actions/runs/${process.env['GITHUB_RUN_ID']}`
      : undefined;

    const lines = [
      `${emoji} *${result.projectName}* | QAPilot ${statusText}`,
      `Layers: ${passed} passed, ${failed} failed, ${warned} warned, ${skipped} skipped`,
      `Mode: ${result.mode} | Stack: ${result.stack}`,
      `Duration: ${formatDuration(result.duration)}`,
    ];

    if (ciUrl) {
      lines.push(`<${ciUrl}|View CI Run>`);
    }

    const payload = { text: lines.join('\n') };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error(`Slack webhook returned ${response.status}`);
      }
    } catch (err) {
      logger.error(`Slack webhook failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
