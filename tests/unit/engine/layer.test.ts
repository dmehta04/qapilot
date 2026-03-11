import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isLayerApplicable,
  isLayerEnabled,
  getLayerCommand,
  getLayerTimeout,
  isWarnOnly,
  executeLayer,
} from '../../../src/engine/layer.js';
import type { QAPilotConfig } from '../../../src/config/types.js';
import type { ExecutionContext } from '../../../src/engine/types.js';

vi.mock('../../../src/utils/exec.js', () => ({
  exec: vi.fn(),
}));

function makeCtx(config: Partial<QAPilotConfig> = {}): ExecutionContext {
  return {
    cwd: '/tmp/test',
    config: { version: '1', stack: 'nextjs', mode: 'fast', ...config },
  };
}

describe('isLayerApplicable', () => {
  it('returns true for layers without stack restrictions', () => {
    expect(isLayerApplicable('L1', 'nextjs')).toBe(true);
    expect(isLayerApplicable('L3', 'python')).toBe(true);
    expect(isLayerApplicable('L8', 'rust')).toBe(true);
  });

  it('returns true for L10 with applicable stack', () => {
    expect(isLayerApplicable('L10', 'nextjs')).toBe(true);
    expect(isLayerApplicable('L10', 'react')).toBe(true);
  });

  it('returns false for L10 with non-applicable stack', () => {
    expect(isLayerApplicable('L10', 'python')).toBe(false);
    expect(isLayerApplicable('L10', 'rust')).toBe(false);
  });

  it('L12 is applicable to flutter', () => {
    expect(isLayerApplicable('L12', 'flutter')).toBe(true);
  });
});

describe('isLayerEnabled', () => {
  it('returns true when no skip config', () => {
    expect(isLayerEnabled('L1', { version: '1' })).toBe(true);
  });

  it('returns false when layer is in skip array', () => {
    expect(isLayerEnabled('L8', { version: '1', layers: { skip: ['L8'] } })).toBe(false);
  });

  it('returns false when layer override has enabled=false', () => {
    expect(
      isLayerEnabled('L1', {
        version: '1',
        layers: { overrides: { L1: { enabled: false } } },
      }),
    ).toBe(false);
  });
});

describe('getLayerCommand', () => {
  it('returns override command when set', () => {
    const config: QAPilotConfig = {
      version: '1',
      layers: { overrides: { L1: { command: 'custom-lint' } } },
    };
    expect(getLayerCommand('L1', config, 'nextjs')).toBe('custom-lint');
  });

  it('returns stack default when no override', () => {
    const config: QAPilotConfig = { version: '1' };
    const cmd = getLayerCommand('L1', config, 'nextjs');
    expect(cmd).toBe('pnpm eslint src/');
  });

  it('returns undefined for unknown stack', () => {
    const config: QAPilotConfig = { version: '1' };
    const cmd = getLayerCommand('L1', config, 'unknownstack');
    expect(cmd).toBeUndefined();
  });
});

describe('getLayerTimeout', () => {
  it('returns override timeout when set', () => {
    const config: QAPilotConfig = {
      version: '1',
      layers: { overrides: { L1: { timeout: 30000 } } },
    };
    expect(getLayerTimeout('L1', config)).toBe(30000);
  });

  it('returns default timeout when no override', () => {
    const config: QAPilotConfig = { version: '1' };
    expect(getLayerTimeout('L1', config)).toBe(60_000);
  });

  it('returns 120000 for layers without a specific default', () => {
    const config: QAPilotConfig = { version: '1' };
    expect(getLayerTimeout('L16', config)).toBe(120_000);
  });
});

describe('isWarnOnly', () => {
  it('returns false by default', () => {
    expect(isWarnOnly('L1', { version: '1' })).toBe(false);
  });

  it('returns true when layer is in warnOnly array', () => {
    expect(isWarnOnly('L1', { version: '1', layers: { warnOnly: ['L1'] } })).toBe(true);
  });

  it('returns true when override has warnOnly=true', () => {
    expect(
      isWarnOnly('L1', {
        version: '1',
        layers: { overrides: { L1: { warnOnly: true } } },
      }),
    ).toBe(true);
  });
});

describe('executeLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns pass when command exits 0', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({ exitCode: 0, stdout: 'ok', stderr: '', duration: 100 });

    const ctx = makeCtx({ layers: { overrides: { L1: { command: 'lint' } } } });
    const result = await executeLayer('L1', ctx);
    expect(result.status).toBe('pass');
    expect(result.command).toBe('lint');
    expect(result.exitCode).toBe(0);
  });

  it('returns fail when command exits non-zero', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'error', duration: 50 });

    const ctx = makeCtx({ layers: { overrides: { L1: { command: 'lint' } } } });
    const result = await executeLayer('L1', ctx);
    expect(result.status).toBe('fail');
    expect(result.exitCode).toBe(1);
  });

  it('returns skip when layer is disabled in config', async () => {
    const ctx = makeCtx({ layers: { skip: ['L1'] } });
    const result = await executeLayer('L1', ctx);
    expect(result.status).toBe('skip');
    expect(result.duration).toBe(0);
  });

  it('returns skip when layer is not applicable to stack', async () => {
    const ctx = makeCtx({ stack: 'python' });
    const result = await executeLayer('L10', ctx);
    expect(result.status).toBe('skip');
  });

  it('returns skip when no command configured', async () => {
    const ctx = makeCtx({ stack: 'nextjs' });
    const result = await executeLayer('L16', ctx);
    expect(result.status).toBe('skip');
  });

  it('returns warn for warnOnly layer that fails', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'warn', duration: 50 });

    const ctx = makeCtx({
      layers: {
        warnOnly: ['L1'],
        overrides: { L1: { command: 'lint' } },
      },
    });
    const result = await executeLayer('L1', ctx);
    expect(result.status).toBe('warn');
  });

  it('records duration', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '', duration: 200 });

    const ctx = makeCtx({ layers: { overrides: { L1: { command: 'lint' } } } });
    const result = await executeLayer('L1', ctx);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('captures stdout and stderr', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockResolvedValue({
      exitCode: 0,
      stdout: 'lint output',
      stderr: 'lint warnings',
      duration: 50,
    });

    const ctx = makeCtx({ layers: { overrides: { L1: { command: 'lint' } } } });
    const result = await executeLayer('L1', ctx);
    expect(result.stdout).toBe('lint output');
    expect(result.stderr).toBe('lint warnings');
  });

  it('returns fail with error message on exec exception', async () => {
    const { exec } = await import('../../../src/utils/exec.js');
    vi.mocked(exec).mockRejectedValue(new Error('Command timed out'));

    const ctx = makeCtx({ layers: { overrides: { L1: { command: 'lint' } } } });
    const result = await executeLayer('L1', ctx);
    expect(result.status).toBe('fail');
    expect(result.error).toContain('timed out');
  });
});
