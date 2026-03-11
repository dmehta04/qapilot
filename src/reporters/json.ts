import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Reporter, PipelineResult, ExecutionContext } from '../engine/types.js';

export class JsonReporter implements Reporter {
  name = 'json';

  async report(result: PipelineResult, ctx: ExecutionContext): Promise<void> {
    const outputDir = ctx.config.reports?.outputDir ?? join(ctx.cwd, '.qapilot');
    mkdirSync(outputDir, { recursive: true });

    const output = {
      projectName: result.projectName,
      timestamp: result.timestamp,
      duration: result.duration,
      status: result.status,
      summary: result.summary,
      layers: result.layers.map((l) => ({
        layer: l.layer,
        name: l.name,
        status: l.status,
        duration: l.duration,
        command: l.command,
        exitCode: l.exitCode,
        error: l.error,
        metrics: l.metrics,
      })),
    };

    const filePath = join(outputDir, 'report.json');
    writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');
  }
}
