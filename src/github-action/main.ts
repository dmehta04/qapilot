import { loadConfig } from '../config/loader.js';
import { runPipeline } from '../engine/runner.js';
import { getReporters } from '../reporters/index.js';
import type { PipelineMode } from '../config/types.js';
import type { ExecutionContext } from '../engine/types.js';

function getInput(name: string): string {
  return process.env[`INPUT_${name.toUpperCase().replace(/-/g, '_')}`] ?? '';
}

function setOutput(name: string, value: string) {
  const delimiter = `ghadelimiter_${Date.now()}`;
  process.stdout.write(`::set-output name=${name}::${value}\n`);
  const outputFile = process.env['GITHUB_OUTPUT'];
  if (outputFile) {
    const { appendFileSync } = require('node:fs') as typeof import('node:fs');
    appendFileSync(outputFile, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
  }
}

async function main() {
  try {
    const cwd = process.env['GITHUB_WORKSPACE'] ?? process.cwd();

    const mode = (getInput('mode') || 'full') as PipelineMode;
    const apiKey = getInput('anthropic-api-key');
    const slackWebhook = getInput('slack-webhook');

    if (apiKey) {
      process.env['ANTHROPIC_API_KEY'] = apiKey;
    }

    if (slackWebhook) {
      process.env['QAPILOT_SLACK_WEBHOOK'] = slackWebhook;
    }

    const config = loadConfig(cwd, { mode });

    const ctx: ExecutionContext = { cwd, config, verbose: false, quiet: true };

    const result = await runPipeline(config, cwd);

    const formats = ['github', 'json'];
    if (slackWebhook) formats.push('slack');

    const reporters = getReporters(formats);
    for (const reporter of reporters) {
      await reporter.report(result, ctx);
    }

    setOutput('status', result.status);
    setOutput('passed', String(result.summary.passed));
    setOutput('failed', String(result.summary.failed));
    setOutput('duration', String(result.duration));

    if (result.status === 'fail') {
      process.exitCode = 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`::error::QAPilot failed: ${message}\n`);
    process.exitCode = 1;
  }
}

main();
