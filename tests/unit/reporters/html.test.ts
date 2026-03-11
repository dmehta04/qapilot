import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateHtml, HtmlReporter } from '../../../src/reporters/html.js';
import type { PipelineResult, ExecutionContext } from '../../../src/engine/types.js';

function makeTempDir(): string {
  const dir = join(tmpdir(), `qapilot-html-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeResult(overrides?: Partial<PipelineResult>): PipelineResult {
  return {
    config: { version: '1', mode: 'fast' },
    projectName: 'html-test-project',
    timestamp: '2026-03-11T10:00:00.000Z',
    duration: 2500,
    status: 'pass',
    stack: 'nextjs',
    mode: 'fast',
    layers: [
      { layer: 'L1', name: 'lint', status: 'pass', duration: 500, command: 'eslint src/', exitCode: 0 },
      { layer: 'L3', name: 'unit', status: 'fail', duration: 1000, command: 'vitest run', exitCode: 1 },
      { layer: 'L8', name: 'security', status: 'warn', duration: 300, command: 'audit', exitCode: 1 },
      { layer: 'L10', name: 'visual', status: 'skip', duration: 0 },
    ],
    summary: { total: 4, passed: 1, failed: 1, warned: 1, skipped: 1 },
    ...overrides,
  };
}

describe('generateHtml', () => {
  it('generates valid HTML with doctype', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('contains project name', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('html-test-project');
  });

  it('contains layer status badges', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('PASS');
    expect(html).toContain('FAIL');
    expect(html).toContain('WARN');
    expect(html).toContain('SKIP');
  });

  it('contains timing information', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('Duration');
    expect(html).toContain('2.5s');
  });

  it('contains layer IDs and names', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('L1');
    expect(html).toContain('lint');
    expect(html).toContain('L3');
    expect(html).toContain('unit');
  });

  it('contains command info', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('eslint src/');
    expect(html).toContain('vitest run');
  });

  it('contains summary card values', () => {
    const html = generateHtml(makeResult());
    expect(html).toContain('Passed');
    expect(html).toContain('Failed');
    expect(html).toContain('Warned');
    expect(html).toContain('Skipped');
  });

  it('uses green color for pass status', () => {
    const html = generateHtml(makeResult({ status: 'pass' }));
    expect(html).toContain('#22c55e');
  });

  it('uses red color for fail status', () => {
    const html = generateHtml(makeResult({ status: 'fail' }));
    expect(html).toContain('#ef4444');
  });

  it('uses yellow color for warn status', () => {
    const html = generateHtml(makeResult({ status: 'warn' }));
    expect(html).toContain('#eab308');
  });
});

describe('HtmlReporter', () => {
  let tempDir: string;
  const reporter = new HtmlReporter();

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('has name "html"', () => {
    expect(reporter.name).toBe('html');
  });

  it('writes HTML file to output dir', async () => {
    const outputDir = join(tempDir, '.qapilot');
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
      quiet: true,
    };

    await reporter.report(makeResult(), ctx);

    const content = readFileSync(join(outputDir, 'report.html'), 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('html-test-project');
  });

  it('creates output directory if missing', async () => {
    const outputDir = join(tempDir, 'nested', 'output');
    const ctx: ExecutionContext = {
      cwd: tempDir,
      config: { version: '1', reports: { outputDir } },
      quiet: true,
    };

    await reporter.report(makeResult(), ctx);

    const content = readFileSync(join(outputDir, 'report.html'), 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
  });
});
