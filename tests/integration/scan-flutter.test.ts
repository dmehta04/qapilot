import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { detectStack } from '../../src/detector/index.js';
import { loadConfig } from '../../src/config/loader.js';
import { runPipeline } from '../../src/engine/runner.js';

vi.mock('../../src/utils/exec.js', () => ({
  exec: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: 'All tests passed',
    stderr: '',
    duration: 300,
  }),
}));

const FIXTURE = join(__dirname, '../fixtures/flutter-app');

describe('Flutter integration scan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects Flutter stack correctly', async () => {
    const detected = await detectStack(FIXTURE);
    expect(detected.stack).toBe('flutter');
    expect(detected.packageManager).toBe('pub');
  });

  it('loads config with defaults', () => {
    const config = loadConfig(FIXTURE);
    expect(config.version).toBe('1');
  });

  it('runs pipeline with mocked exec', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      stack: 'flutter',
      layers: {
        overrides: {
          L1: { command: 'dart analyze', enabled: true },
          L3: { command: 'flutter test', enabled: true },
          L8: { command: 'flutter pub audit', enabled: true },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.status).toBe('pass');
    expect(result.layers.length).toBeGreaterThan(0);
  });

  it('pipeline result has correct structure', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      layers: {
        overrides: {
          L1: { command: 'dart analyze' },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.config).toBeDefined();
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});
