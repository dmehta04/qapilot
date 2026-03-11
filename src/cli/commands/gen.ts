import type { Command } from 'commander';
import chalk from 'chalk';
import type { LayerID } from '../../config/types.js';
import { LAYER_IDS } from '../../config/types.js';
import { loadConfig } from '../../config/loader.js';
import { generateTests, buildPrompt } from '../../ai/test-gen.js';
import { aiChat } from '../../ai/client.js';
import type { AiClient } from '../../ai/test-gen.js';

interface GenOptions {
  layer?: string;
  dryRun?: boolean;
}

function parseLayer(raw?: string): LayerID | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase() as LayerID;
  if ((LAYER_IDS as readonly string[]).includes(upper)) return upper;
  return undefined;
}

export function registerGenCommand(program: Command) {
  program
    .command('gen')
    .description('Generate test files using AI')
    .option('-l, --layer <layer>', 'Target layer (e.g. L3, L4, L5)')
    .option('--dry-run', 'Show what would be generated without writing files')
    .action(async (opts: GenOptions) => {
      const cwd = process.cwd();
      const config = loadConfig(cwd);
      const layer = parseLayer(opts.layer);

      if (config.ai?.enabled === false) {
        console.log(chalk.red('  AI features are disabled in config.'));
        process.exit(1);
      }

      console.log(chalk.bold('\n  Generating tests...\n'));

      if (opts.dryRun) {
        console.log(chalk.yellow('  [DRY RUN] Would generate tests for:'));
        console.log(chalk.dim(`    Layer: ${layer ?? 'all missing'}`));
        console.log(chalk.dim(`    Stack: ${config.stack ?? 'auto-detect'}`));
        console.log('');
        return;
      }

      const client: AiClient = {
        async generateTestCode(sourceCode: string, filePath: string): Promise<string> {
          return aiChat(
            'You are an expert test engineer. Generate production-quality test files.',
            buildPrompt(sourceCode, filePath),
            { maxTokens: 4096 },
          );
        },
      };

      const results = await generateTests(cwd, config, layer, client);

      if (results.length === 0) {
        console.log(chalk.yellow('  No tests to generate — all source files have tests.'));
        return;
      }

      console.log(chalk.bold(`  Generated ${results.length} test file(s):\n`));
      for (const r of results) {
        const icon = r.passed ? chalk.green('✅') : chalk.red('❌');
        console.log(`  ${icon} ${chalk.dim(r.sourceFile)} → ${r.testFile}`);
      }

      const passed = results.filter((r) => r.passed).length;
      console.log(
        `\n  ${chalk.green(`${passed}/${results.length}`)} tests passing on first run.\n`,
      );
    });
}
