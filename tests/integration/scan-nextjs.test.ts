import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { detectStack } from '../../src/detector/index.js';
import { loadConfig } from '../../src/config/loader.js';
import { runPipeline } from '../../src/engine/runner.js';

vi.mock('../../src/utils/exec.js', () => ({
  exec: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: 'ok',
    stderr: '',
    duration: 100,
  }),
}));

const FIXTURE = join(__dirname, '../fixtures/nextjs-app');

describe('Next.js integration scan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects Next.js stack correctly', async () => {
    const detected = await detectStack(FIXTURE);
    expect(detected.stack).toBe('nextjs');
    expect(detected.packageManager).toBe('pnpm');
    expect(detected.hasTypeScript).toBe(true);
  });

  it('loads config or uses defaults', () => {
    const config = loadConfig(FIXTURE);
    expect(config.version).toBeDefined();
    expect(config.mode).toBeDefined();
  });

  it('runs applicable layers with mocked exec', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      stack: 'nextjs',
      layers: {
        overrides: {
          L1: { command: 'eslint src/', enabled: true },
          L2: { command: 'tsc --noEmit', enabled: true },
          L3: { command: 'vitest run', enabled: true },
          L7: { command: 'curl http://localhost:3000', enabled: true },
          L8: { command: 'pnpm audit', enabled: true },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.layers.length).toBeGreaterThan(0);
    expect(result.status).toBe('pass');
  });

  it('generates correct pipeline result structure', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      layers: {
        overrides: {
          L1: { command: 'eslint', enabled: true },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.config).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.summary).toBeDefined();
    expect(result.summary.total).toBeGreaterThan(0);
  });

  it('result contains expected data', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      layers: {
        overrides: {
          L1: { command: 'lint' },
          L3: { command: 'test' },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.summary.passed + result.summary.failed + result.summary.warned + result.summary.skipped)
      .toBe(result.summary.total);
  });
});
