import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { detectStack } from '../../src/detector/index.js';
import { loadConfig } from '../../src/config/loader.js';
import { runPipeline } from '../../src/engine/runner.js';

vi.mock('../../src/utils/exec.js', () => ({
  exec: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: '5 passed in 1.2s',
    stderr: '',
    duration: 200,
  }),
}));

const FIXTURE = join(__dirname, '../fixtures/python-app');

describe('Python integration scan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects Python stack correctly', async () => {
    const detected = await detectStack(FIXTURE);
    expect(detected.stack).toBe('python');
    expect(detected.hasTypeScript).toBe(false);
  });

  it('loads config with defaults', () => {
    const config = loadConfig(FIXTURE);
    expect(config.version).toBe('1');
  });

  it('runs pipeline with mocked exec', async () => {
    const config = loadConfig(FIXTURE, {
      mode: 'fast',
      stack: 'python',
      layers: {
        overrides: {
          L1: { command: 'ruff check .', enabled: true },
          L3: { command: 'pytest tests/', enabled: true },
          L8: { command: 'pip-audit', enabled: true },
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
          L1: { command: 'ruff' },
        },
      },
    });

    const result = await runPipeline(config, FIXTURE);

    expect(result.config).toBeDefined();
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
