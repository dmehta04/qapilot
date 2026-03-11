import type { Command } from 'commander';
import chalk from 'chalk';
import { exec } from '../../utils/exec.js';

interface Check {
  label: string;
  test: () => Promise<boolean>;
}

async function commandExists(cmd: string): Promise<boolean> {
  const result = await exec(`command -v ${cmd}`);
  return result.exitCode === 0;
}

async function nodeVersionOk(): Promise<boolean> {
  const result = await exec('node --version');
  if (result.exitCode !== 0) return false;
  const major = parseInt(result.stdout.trim().replace('v', '').split('.')[0] ?? '0', 10);
  return major >= 20;
}

function buildChecks(): Check[] {
  return [
    { label: 'Node.js >= 20', test: nodeVersionOk },
    { label: 'pnpm installed', test: () => commandExists('pnpm') },
    { label: 'npm installed', test: () => commandExists('npm') },
    {
      label: 'Test framework (vitest/jest)',
      test: async () => {
        const v = await commandExists('vitest');
        const j = await commandExists('jest');
        return v || j;
      },
    },
    {
      label: 'Playwright installed',
      test: async () => {
        const result = await exec('npx playwright --version');
        return result.exitCode === 0;
      },
    },
    {
      label: 'AI key configured',
      test: async () => {
        return !!(process.env['ANTHROPIC_API_KEY'] || process.env['QAPILOT_AI_KEY']);
      },
    },
    {
      label: 'Git available',
      test: () => commandExists('git'),
    },
  ];
}

export function registerDoctorCommand(program: Command) {
  program
    .command('doctor')
    .description('Check prerequisites and environment')
    .action(async () => {
      console.log(chalk.bold('\n  QAPilot Doctor\n'));

      const checks = buildChecks();
      let allPassed = true;

      for (const check of checks) {
        const ok = await check.test();
        const icon = ok ? chalk.green('pass') : chalk.red('FAIL');
        console.log(`  [${icon}] ${check.label}`);
        if (!ok) allPassed = false;
      }

      console.log('');
      if (allPassed) {
        console.log(chalk.green('  All checks passed. Ready to run.\n'));
      } else {
        console.log(chalk.yellow('  Some checks failed. Install missing tools before running.\n'));
      }
    });
}
