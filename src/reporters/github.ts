import { appendFileSync } from 'node:fs';
import type { Reporter, PipelineResult, ExecutionContext } from '../engine/types.js';
import { logger } from '../utils/logger.js';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export class GithubReporter implements Reporter {
  name = 'github';

  async report(result: PipelineResult, _ctx: ExecutionContext): Promise<void> {
    for (const layer of result.layers) {
      if (layer.status === 'fail') {
        process.stdout.write(`::error title=QAPilot ${layer.layer} ${layer.name}::${layer.error ?? 'Layer failed'}\n`);
      } else if (layer.status === 'warn') {
        process.stdout.write(`::warning title=QAPilot ${layer.layer} ${layer.name}::${layer.error ?? 'Layer warned'}\n`);
      }
    }

    const summaryPath = process.env['GITHUB_STEP_SUMMARY'];
    if (summaryPath) {
      const { passed, failed, warned, skipped } = result.summary;
      const statusEmoji = result.status === 'pass' ? ':white_check_mark:' : result.status === 'fail' ? ':x:' : ':warning:';

      const lines = [
        `## ${statusEmoji} QAPilot Report - ${result.projectName}`,
        '',
        `**Status:** ${result.status.toUpperCase()} | **Duration:** ${formatDuration(result.duration)} | **Mode:** ${result.mode}`,
        '',
        `| Metric | Count |`,
        `|--------|-------|`,
        `| Passed | ${passed} |`,
        `| Failed | ${failed} |`,
        `| Warned | ${warned} |`,
        `| Skipped | ${skipped} |`,
        '',
        '### Layer Details',
        '',
        '| Layer | Name | Status | Duration | Command |',
        '|-------|------|--------|----------|---------|',
      ];

      for (const layer of result.layers) {
        const icon = layer.status === 'pass' ? ':white_check_mark:' : layer.status === 'fail' ? ':x:' : layer.status === 'warn' ? ':warning:' : ':fast_forward:';
        lines.push(`| ${layer.layer} | ${layer.name} | ${icon} ${layer.status} | ${formatDuration(layer.duration)} | \`${layer.command || '-'}\` |`);
      }

      appendFileSync(summaryPath, lines.join('\n') + '\n');
    }

    await this.postPrComment(result);
  }

  private async postPrComment(result: PipelineResult): Promise<void> {
    const token = process.env['GITHUB_TOKEN'];
    const repo = process.env['GITHUB_REPOSITORY'];
    const ref = process.env['GITHUB_REF'];

    if (!token || !repo || !ref) return;

    const prMatch = ref.match(/^refs\/pull\/(\d+)\//);
    if (!prMatch) return;

    const prNumber = prMatch[1];
    const { passed, failed, warned, skipped } = result.summary;
    const statusEmoji = result.status === 'pass' ? ':white_check_mark:' : result.status === 'fail' ? ':x:' : ':warning:';

    const layerRows = result.layers
      .map((l) => {
        const icon = l.status === 'pass' ? ':white_check_mark:' : l.status === 'fail' ? ':x:' : l.status === 'warn' ? ':warning:' : ':fast_forward:';
        return `| ${l.layer} | ${l.name} | ${icon} ${l.status} | ${formatDuration(l.duration)} |`;
      })
      .join('\n');

    const body = [
      `## ${statusEmoji} QAPilot Report`,
      '',
      `**${passed}** passed, **${failed}** failed, **${warned}** warned, **${skipped}** skipped`,
      '',
      '| Layer | Name | Status | Duration |',
      '|-------|------|--------|----------|',
      layerRows,
    ].join('\n');

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        logger.warn(`Failed to post PR comment: ${response.status}`);
      }
    } catch (err) {
      logger.warn(`PR comment failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
