import type { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { detectStack } from '../../detector/index.js';
import type { DetectedStack } from '../../detector/types.js';
import type { QAPilotConfig } from '../../config/types.js';

function buildDefaultConfig(detected: DetectedStack): QAPilotConfig {
  const config: QAPilotConfig = {
    version: '1',
    stack: detected.stack,
    mode: 'fast',
    layers: {
      overrides: {
        L1: { command: `${detected.packageManager} run lint`, enabled: true },
        L3: { command: detected.testCommand, enabled: true },
        L7: { command: `${detected.packageManager} run build`, enabled: true },
      },
    },
    ai: { enabled: true, provider: 'anthropic' },
  };

  if (detected.hasTypeScript) {
    config.layers!.overrides!['L2'] = {
      command: `${detected.packageManager} run typecheck || npx tsc --noEmit`,
      enabled: true,
    };
  }

  return config;
}

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize QAPilot configuration')
    .action(async () => {
      const cwd = process.cwd();
      const detected = await detectStack(cwd);

      console.log(chalk.bold('\n  Detected Stack\n'));
      console.log(`  ${chalk.dim('Project:')}      ${detected.projectName}`);
      console.log(`  ${chalk.dim('Stack:')}        ${detected.stack}`);
      console.log(`  ${chalk.dim('Package Mgr:')} ${detected.packageManager}`);
      console.log(`  ${chalk.dim('Test:')}         ${detected.testFramework}`);
      console.log(`  ${chalk.dim('Linter:')}       ${detected.linter}`);
      console.log(`  ${chalk.dim('TypeScript:')}   ${detected.hasTypeScript ? 'yes' : 'no'}`);
      console.log('');

      const config = buildDefaultConfig(detected);
      const content = yaml.dump(config, { indent: 2, lineWidth: 120 });
      const outPath = join(cwd, '.qapilot.yml');

      writeFileSync(outPath, content, 'utf-8');

      console.log(chalk.green(`  Created ${outPath}`));
      console.log(chalk.dim('\n  Run `qapilot scan` to start the pipeline.\n'));
    });
}
