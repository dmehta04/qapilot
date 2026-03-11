import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const BIN = join(__dirname, '../../bin/qapilot.ts');

function runCli(args: string[], options?: { cwd?: string }): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync('npx', ['tsx', BIN, ...args], {
      encoding: 'utf-8',
      cwd: options?.cwd,
      timeout: 30_000,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

describe('CLI E2E', () => {
  it('--version prints version number', () => {
    const result = runCli(['--version']);
    expect(result.stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    expect(result.exitCode).toBe(0);
  });

  it('--help shows available commands', () => {
    const result = runCli(['--help']);
    expect(result.stdout).toContain('scan');
    expect(result.stdout).toContain('init');
    expect(result.stdout).toContain('generate');
    expect(result.exitCode).toBe(0);
  });

  it('scan --help shows scan options', () => {
    const result = runCli(['scan', '--help']);
    expect(result.stdout).toContain('--mode');
    expect(result.stdout).toContain('--verbose');
    expect(result.exitCode).toBe(0);
  });

  it('unknown command shows error', () => {
    const result = runCli(['nonexistent']);
    expect(result.exitCode).not.toBe(0);
  });
});

describe('CLI init command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `qapilot-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('init runs without crashing from fixture dir', () => {
    const fixtureDir = join(__dirname, '../fixtures/nextjs-app');
    const result = runCli(['init'], { cwd: fixtureDir });

    const configPath = join(fixtureDir, '.qapilot.yml');
    if (existsSync(configPath)) {
      rmSync(configPath);
    }

    expect(result.exitCode).toBe(0);
  });
});
