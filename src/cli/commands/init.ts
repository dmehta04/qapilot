import type { Command } from 'commander';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { detectStack } from '../../detector/index.js';
import type { DetectedStack } from '../../detector/types.js';
import type { QAPilotConfig, LayerID } from '../../config/types.js';

function readScripts(cwd: string): Record<string, string> {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

function buildDefaultConfig(detected: DetectedStack, cwd: string): QAPilotConfig {
  const scripts = readScripts(cwd);
  const pm = detected.packageManager;
  const skip: LayerID[] = [];

  const hasLint = !!scripts['lint'];
  const hasTest = !!scripts['test'] || !!scripts['test:run'];
  const hasBuild = !!scripts['build'];
  const hasTypecheck = !!scripts['typecheck'];

  if (!hasTest) {
    skip.push('L3');
    skip.push('L4');
  }

  const config: QAPilotConfig = {
    version: '1',
    stack: detected.stack,
    mode: 'fast',
    layers: {
      skip: skip.length > 0 ? skip : undefined,
      overrides: {},
    },
    ai: { enabled: true, provider: 'anthropic' },
  };

  if (hasLint) config.layers!.overrides!['L1'] = { command: `${pm} run lint`, enabled: true };
  if (hasTest) config.layers!.overrides!['L3'] = { command: detected.testCommand, enabled: true };
  if (hasBuild) config.layers!.overrides!['L7'] = { command: `${pm} run build`, enabled: true };
  if (hasTypecheck || detected.hasTypeScript) {
    config.layers!.overrides!['L2'] = {
      command: hasTypecheck ? `${pm} run typecheck` : 'npx tsc --noEmit',
      enabled: true,
    };
  }

  config.layers!.overrides!['L8'] = { command: `${pm} audit --audit-level=high`, warnOnly: true };

  return config;
}

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize QAPilot configuration')
    .action(async () => {
      const cwd = process.cwd();
      let detected: DetectedStack;
      try {
        detected = await detectStack(cwd);
      } catch (err) {
        console.log(chalk.yellow(`\n  ⚠ No supported stack detected in ${cwd}`));
        console.log(chalk.dim('  This may be a docs-only or unsupported project. Skipping.\n'));
        return;
      }

      console.log(chalk.bold('\n  Detected Stack\n'));
      console.log(`  ${chalk.dim('Project:')}      ${detected.projectName}`);
      console.log(`  ${chalk.dim('Stack:')}        ${detected.stack}`);
      console.log(`  ${chalk.dim('Package Mgr:')} ${detected.packageManager}`);
      console.log(`  ${chalk.dim('Test:')}         ${detected.testFramework}`);
      console.log(`  ${chalk.dim('Linter:')}       ${detected.linter}`);
      console.log(`  ${chalk.dim('TypeScript:')}   ${detected.hasTypeScript ? 'yes' : 'no'}`);
      console.log('');

      const config = buildDefaultConfig(detected, cwd);
      const content = yaml.dump(config, { indent: 2, lineWidth: 120 });
      const outPath = join(cwd, '.qapilot.yml');

      writeFileSync(outPath, content, 'utf-8');

      console.log(chalk.green(`  Created ${outPath}`));
      console.log(chalk.dim('\n  Run `qapilot scan` to start the pipeline.\n'));
    });
}
