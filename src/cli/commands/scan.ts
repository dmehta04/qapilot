import type { Command } from 'commander';
import type { PipelineMode } from '../../config/types.js';
import { loadConfig } from '../../config/loader.js';
import { runPipeline } from '../../engine/runner.js';
import { printBanner, printPipelineResult, printProgress } from '../output.js';
import { getReporters } from '../../reporters/index.js';
import type { ExecutionContext } from '../../engine/types.js';

interface ScanOptions {
  mode?: PipelineMode;
  config?: string;
  format?: string;
  output?: string;
  ai?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

export function registerScanCommand(program: Command) {
  program
    .command('scan')
    .description('Run the QA pipeline')
    .option('-m, --mode <mode>', 'Pipeline mode: fast, full, or pre-release', 'fast')
    .option('-c, --config <path>', 'Path to config file')
    .option('-f, --format <formats>', 'Output formats (comma-separated: json,html,console)', 'console')
    .option('-o, --output <dir>', 'Output directory for reports')
    .option('--no-ai', 'Disable AI features')
    .action(async (opts: ScanOptions) => {
      const cwd = process.cwd();
      const verbose = opts.verbose ?? program.opts().verbose ?? false;
      const quiet = opts.quiet ?? program.opts().quiet ?? false;

      if (!quiet) printBanner();

      const config = loadConfig(cwd, {
        mode: opts.mode,
        ai: opts.ai === false ? { enabled: false } : undefined,
        reports: opts.output ? { outputDir: opts.output } : undefined,
      });

      const ctx: ExecutionContext = { cwd, config, verbose, quiet };

      const result = await runPipeline(config, cwd, {
        onLayerStart: quiet ? undefined : (_layer, name) => printProgress(name, 'running'),
        onLayerEnd: undefined,
      });

      const formats = (opts.format ?? 'console').split(',').map((f) => f.trim());
      const reporters = getReporters(formats);

      for (const reporter of reporters) {
        await reporter.report(result, ctx);
      }

      if (!quiet && !formats.includes('console')) {
        printPipelineResult(result);
      }

      process.exit(result.status === 'fail' ? 1 : 0);
    });
}
