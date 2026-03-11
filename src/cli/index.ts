import { Command } from 'commander';

const program = new Command();

program
  .name('qapilot')
  .description('AI-powered multi-layer QA pipeline')
  .version('0.1.0');

program
  .command('scan')
  .description('Run QA pipeline on the current project')
  .option('-m, --mode <mode>', 'Pipeline mode: fast | full | pre-release', 'full')
  .option('-s, --stack <stack>', 'Override detected stack')
  .option('--skip <layers>', 'Comma-separated layer IDs to skip')
  .option('--only <layers>', 'Run only these layer IDs')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Minimal output')
  .action(async (_options) => {
    const { scan } = await import('../index.js');
    await scan(process.cwd());
  });

program
  .command('init')
  .description('Generate .qapilot.yml config for the current project')
  .option('-s, --stack <stack>', 'Override detected stack')
  .option('--force', 'Overwrite existing config')
  .action(async (_options) => {
    const { init } = await import('../index.js');
    await init(process.cwd());
  });

program
  .command('generate')
  .description('AI-generate missing tests for the project')
  .option('-l, --layer <layer>', 'Generate tests for a specific layer')
  .option('--dry-run', 'Preview without writing files')
  .action(async (_options) => {
    const { generate } = await import('../index.js');
    await generate(process.cwd());
  });

export function run(argv: string[]): void {
  program.parse(argv);
}
