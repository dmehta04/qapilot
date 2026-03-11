import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectStack } from '../../../src/detector/index.js';

const FIXTURES = join(__dirname, '../../fixtures');

function makeTempDir(): string {
  const dir = join(tmpdir(), `qapilot-det-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('detectStack', () => {
  it('detects Next.js from package.json with "next" dep', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.stack).toBe('nextjs');
  });

  it('detects correct package manager from pnpm-lock.yaml', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.packageManager).toBe('pnpm');
  });

  it('detects Python from pyproject.toml', async () => {
    const result = await detectStack(join(FIXTURES, 'python-app'));
    expect(result.stack).toBe('python');
  });

  it('detects Rust from Cargo.toml', async () => {
    const result = await detectStack(join(FIXTURES, 'rust-app'));
    expect(result.stack).toBe('rust');
    expect(result.packageManager).toBe('cargo');
  });

  it('detects Flutter from pubspec.yaml', async () => {
    const result = await detectStack(join(FIXTURES, 'flutter-app'));
    expect(result.stack).toBe('flutter');
    expect(result.packageManager).toBe('pub');
  });

  it('detects TypeScript presence', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.hasTypeScript).toBe(true);
  });

  it('detects project name from package.json', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.projectName).toBe('nextjs-fixture');
  });

  it('detects test framework from dependencies', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.testFramework).toBe('vitest');
  });

  it('detects linter from dependencies', async () => {
    const result = await detectStack(join(FIXTURES, 'nextjs-app'));
    expect(result.linter).toBe('eslint');
  });

  describe('priority order', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = makeTempDir();
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('Flutter takes priority over package.json', async () => {
      writeFileSync(
        join(tempDir, 'pubspec.yaml'),
        'name: test\nenvironment:\n  flutter: ">=3.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n',
      );
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '18' } }),
      );
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('flutter');
    });

    it('Rust takes priority over package.json', async () => {
      writeFileSync(join(tempDir, 'Cargo.toml'), '[package]\nname = "test"\nversion = "0.1.0"\n');
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '18' } }),
      );
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('rust');
    });

    it('detects Go from go.mod', async () => {
      writeFileSync(join(tempDir, 'go.mod'), 'module github.com/test/app\n\ngo 1.22\n');
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('go');
    });

    it('detects Java from pom.xml', async () => {
      writeFileSync(join(tempDir, 'pom.xml'), '<project><artifactId>my-app</artifactId></project>');
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('java');
    });

    it('detects Java from build.gradle', async () => {
      writeFileSync(join(tempDir, 'build.gradle'), 'apply plugin: "java"');
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('java');
    });

    it('detects React from package.json with "react" but no "next"', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '18', 'react-dom': '18' } }),
      );
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('react');
    });

    it('detects Python from requirements.txt fallback', async () => {
      writeFileSync(join(tempDir, 'requirements.txt'), 'flask==3.0.0\n');
      const result = await detectStack(tempDir);
      expect(result.stack).toBe('python');
    });

    it('detects yarn from yarn.lock', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '18' } }),
      );
      writeFileSync(join(tempDir, 'yarn.lock'), '');
      const result = await detectStack(tempDir);
      expect(result.packageManager).toBe('yarn');
    });

    it('detects npm from package-lock.json', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { react: '18' } }),
      );
      writeFileSync(join(tempDir, 'package-lock.json'), '{}');
      const result = await detectStack(tempDir);
      expect(result.packageManager).toBe('npm');
    });

    it('throws for JS project without recognized framework', async () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { lodash: '4' } }),
      );
      await expect(detectStack(tempDir)).rejects.toThrow('No supported stack');
    });

    it('throws for completely unknown project', async () => {
      await expect(detectStack(tempDir)).rejects.toThrow('No supported stack');
    });
  });
});
