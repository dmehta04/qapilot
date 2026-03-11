import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonReporter } from '../../../src/reporters/json.js';
import type { PipelineResult, ExecutionContext } from '../../../src/engine/types.js';

function makeTempDir(): string {
  const dir = join(tmpdir(), `qapilot-json-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeResult(overrides?: Partial<PipelineResult>): PipelineResult {
  return {
    config: { version: '1', mode: 'fast' },
    projectName: 'test-project',
    timestamp: '2026-03-11T10:00:00.000Z',
    duration: 1234,
    status: 'pass',
    layers: [
      {
        layer: 'L1',
        name: 'lint',
        status: 'pass',
        duration: 500,
        command: 'eslint src/',
        exitCode: 0,
        stdout: 'ok',
        stderr: '',
      },
      {
        layer: 'L3',
        name: 'unit',
        status: 'fail',
        duration: 700,
        command: 'vitest run',
        exitCode: 1,
        error: 'test failed',
      },
    ],
    summary: { total: 2, passed: 1, failed: 1, warned: 0, skipped: 0 },
    ...overrides,
  };
}

describe('JsonReporter', () => {
  let tempDir: string;
  let outputDir: string;
  const reporter = new JsonReporter();

  beforeEach(() => {
    tempDir = makeTempDir();
    outputDir = join(tempDir, '.qapilot');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('has name "json"', () => {
    expect(reporter.name).toBe('json');
  });

  it('writes valid JSON to output dir', async () => {
    const result = makeResult();
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
    };

    await reporter.report(result, ctx);

    const filePath = join(outputDir, 'report.json');
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
  });

  it('contains all layer results', async () => {
    const result = makeResult();
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(outputDir, 'report.json'), 'utf-8'));
    expect(parsed.layers).toHaveLength(2);
    expect(parsed.layers[0].layer).toBe('L1');
    expect(parsed.layers[1].layer).toBe('L3');
  });

  it('contains overall status', async () => {
    const result = makeResult({ status: 'fail' });
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(outputDir, 'report.json'), 'utf-8'));
    expect(parsed.status).toBe('fail');
  });

  it('contains timestamp', async () => {
    const result = makeResult();
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(outputDir, 'report.json'), 'utf-8'));
    expect(parsed.timestamp).toBe('2026-03-11T10:00:00.000Z');
  });

  it('contains summary counts', async () => {
    const result = makeResult();
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(outputDir, 'report.json'), 'utf-8'));
    expect(parsed.summary.total).toBe(2);
    expect(parsed.summary.passed).toBe(1);
    expect(parsed.summary.failed).toBe(1);
  });

  it('creates output directory if it does not exist', async () => {
    const result = makeResult();
    const customDir = join(tempDir, 'custom-output');
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir: customDir } },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(customDir, 'report.json'), 'utf-8'));
    expect(parsed.projectName).toBe('test-project');
  });

  it('defaults output dir to cwd/.qapilot when not configured', async () => {
    const result = makeResult();
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1' },
    };

    await reporter.report(result, ctx);

    const parsed = JSON.parse(readFileSync(join(tempDir, '.qapilot', 'report.json'), 'utf-8'));
    expect(parsed.projectName).toBe('test-project');
  });
});
