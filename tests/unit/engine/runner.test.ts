import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '../../../src/engine/runner.js';
import type { QAPilotConfig } from '../../../src/config/types.js';
import type { DetectedStack } from '../../../src/detector/types.js';

const { mockDetectedStack } = vi.hoisted(() => ({
  mockDetectedStack: {
    stack: 'nextjs' as const,
    packageManager: 'pnpm' as const,
    testFramework: 'vitest',
    linter: 'eslint',
    formatter: 'prettier',
    buildCommand: 'pnpm run build',
    testCommand: 'pnpm run test',
    hasTypeScript: true,
    projectName: 'test-project',
  } satisfies DetectedStack,
}));

vi.mock('../../../src/detector/index.js', () => ({
  detectStack: vi.fn().mockResolvedValue(mockDetectedStack),
}));

vi.mock('../../../src/utils/exec.js', () => ({
  exec: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: 'ok',
    stderr: '',
    duration: 50,
  }),
}));

function baseConfig(overrides?: Partial<QAPilotConfig>): QAPilotConfig {
  return {
    version: '1',
    mode: 'fast',
    stack: 'nextjs',
    layers: {
      overrides: {
        L1: { command: 'lint', enabled: true },
        L2: { command: 'typecheck', enabled: true },
        L3: { command: 'test', enabled: true },
        L7: { command: 'smoke', enabled: true },
        L8: { command: 'audit', enabled: true },
      },
    },
    ...overrides,
  };
}

describe('runPipeline', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { detectStack } = vi.mocked(await import('../../../src/detector/index.js'));
    detectStack.mockResolvedValue(mockDetectedStack);
  });

  it('runs fast mode: only fast-tier layers', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');

    expect(result.layers.length).toBeGreaterThan(0);
    expect(result.layers.length).toBeLessThanOrEqual(8);
  });

  it('runs full mode: fast + pr tier layers', async () => {
    const config = baseConfig({ mode: 'full' });
    const result = await runPipeline(config, '/tmp/test');

    expect(result.layers.length).toBeGreaterThan(5);
  });

  it('runs pre-release: all layers', async () => {
    const config = baseConfig({ mode: 'pre-release' });
    const result = await runPipeline(config, '/tmp/test');

    expect(result.layers.length).toBe(16);
  });

  it('skips disabled layers', async () => {
    const config = baseConfig({
      mode: 'fast',
      layers: {
        skip: ['L1'],
        overrides: {
          L2: { command: 'typecheck', enabled: true },
          L3: { command: 'test', enabled: true },
          L7: { command: 'smoke', enabled: true },
          L8: { command: 'audit', enabled: true },
        },
      },
    });

    const result = await runPipeline(config, '/tmp/test');
    const l1 = result.layers.find((l) => l.layer === 'L1');
    expect(l1?.status).toBe('skip');
  });

  it('records all results', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');

    for (const layer of result.layers) {
      expect(layer.status).toBeDefined();
      expect(layer.duration).toBeDefined();
    }
  });

  it('measures total duration', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('sets overall status to pass when all pass', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');
    expect(result.status).toBe('pass');
  });

  it('sets overall status to fail when a layer fails', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fail',
      duration: 10,
    });

    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');
    expect(result.status).toBe('fail');
  });

  it('computes summary counts correctly', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');

    expect(result.summary.total).toBe(result.layers.length);
    expect(
      result.summary.passed +
        result.summary.failed +
        result.summary.warned +
        result.summary.skipped,
    ).toBe(result.summary.total);
  });

  it('calls onLayerStart and onLayerEnd callbacks', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const config = baseConfig({ mode: 'fast' });
    await runPipeline(config, '/tmp/test', { onLayerStart: onStart, onLayerEnd: onEnd });

    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('includes timestamp in ISO format', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('uses detected project name', async () => {
    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');
    expect(result.projectName).toBe('test-project');
  });

  it('stops pipeline on blocking layer failure', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'error', duration: 10 });

    const config = baseConfig({ mode: 'fast' });
    const result = await runPipeline(config, '/tmp/test');

    const failedIndex = result.layers.findIndex((l) => l.status === 'fail');
    expect(failedIndex).toBeGreaterThanOrEqual(0);
    expect(result.layers.length).toBeLessThanOrEqual(failedIndex + 1);
  });
});
