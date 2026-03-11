import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { loadConfig } from '../../../src/config/loader.js';

const FIXTURES = join(__dirname, '../../fixtures/configs');

function makeTempDir(): string {
  const dir = join(tmpdir(), `qapilot-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads from .qapilot.yml in cwd', () => {
    const config = { version: '1', stack: 'nextjs', mode: 'fast' as const };
    writeFileSync(join(tempDir, '.qapilot.yml'), yaml.dump(config), 'utf-8');

    const result = loadConfig(tempDir);
    expect(result.stack).toBe('nextjs');
    expect(result.mode).toBe('fast');
  });

  it('returns defaults when no config file exists', () => {
    const result = loadConfig(tempDir);
    expect(result.version).toBe('1');
    expect(result.mode).toBe('full');
  });

  it('merges CLI overrides over file config over defaults', () => {
    const config = { version: '1', stack: 'nextjs', mode: 'fast' as const };
    writeFileSync(join(tempDir, '.qapilot.yml'), yaml.dump(config), 'utf-8');

    const result = loadConfig(tempDir, { mode: 'full' });
    expect(result.mode).toBe('full');
    expect(result.stack).toBe('nextjs');
  });

  it('validates and rejects bad config', () => {
    const badConfig = { version: 123, stack: 'invalid' };
    writeFileSync(join(tempDir, '.qapilot.yml'), yaml.dump(badConfig), 'utf-8');

    expect(() => loadConfig(tempDir)).toThrow();
  });

  it('loads .qapilot.yaml variant', () => {
    const config = { version: '1', mode: 'full' as const };
    writeFileSync(join(tempDir, '.qapilot.yaml'), yaml.dump(config), 'utf-8');

    const result = loadConfig(tempDir);
    expect(result.mode).toBe('full');
  });

  it('resolves ${ENV_VAR} references in config values', () => {
    process.env['QAPILOT_TEST_STACK'] = 'python';
    const config = { version: '1', stack: '${QAPILOT_TEST_STACK}' };
    writeFileSync(join(tempDir, '.qapilot.yml'), yaml.dump(config), 'utf-8');

    const result = loadConfig(tempDir);
    expect(result.stack).toBe('python');
    delete process.env['QAPILOT_TEST_STACK'];
  });

  it('prefers .qapilot.yml over other variants', () => {
    writeFileSync(
      join(tempDir, '.qapilot.yml'),
      yaml.dump({ version: '1', stack: 'nextjs' }),
      'utf-8',
    );
    writeFileSync(
      join(tempDir, '.qapilot.yaml'),
      yaml.dump({ version: '1', stack: 'python' }),
      'utf-8',
    );

    const result = loadConfig(tempDir);
    expect(result.stack).toBe('nextjs');
  });

  it('overrides take precedence over file values', () => {
    writeFileSync(
      join(tempDir, '.qapilot.yml'),
      yaml.dump({ version: '1', stack: 'nextjs', mode: 'fast' }),
      'utf-8',
    );

    const result = loadConfig(tempDir, { stack: 'python', mode: 'pre-release' });
    expect(result.stack).toBe('python');
    expect(result.mode).toBe('pre-release');
  });

  it('preserves layers config from file', () => {
    const config = {
      version: '1',
      layers: {
        skip: ['L8', 'L10'],
        overrides: { L1: { command: 'custom-lint' } },
      },
    };
    writeFileSync(join(tempDir, '.qapilot.yml'), yaml.dump(config), 'utf-8');

    const result = loadConfig(tempDir);
    expect(result.layers?.skip).toEqual(['L8', 'L10']);
    expect(result.layers?.overrides?.L1?.command).toBe('custom-lint');
  });
});
