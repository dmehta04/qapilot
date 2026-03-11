import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { detect as detectNextjs } from '../../../src/detector/strategies/nextjs.js';
import { detect as detectReact } from '../../../src/detector/strategies/react.js';
import { detect as detectPython } from '../../../src/detector/strategies/python.js';
import { detect as detectFlutter } from '../../../src/detector/strategies/flutter.js';
import { detect as detectRust } from '../../../src/detector/strategies/rust.js';
import { detect as detectGo } from '../../../src/detector/strategies/go.js';
import { detect as detectJava } from '../../../src/detector/strategies/java.js';
import { detectJsPackageManager } from '../../../src/detector/strategies/shared.js';

const FIXTURES = join(__dirname, '../../fixtures');

describe('nextjs strategy', () => {
  it('detects Next.js fixture correctly', async () => {
    const result = await detectNextjs(join(FIXTURES, 'nextjs-app'));
    expect(result).not.toBeNull();
    expect(result!.stack).toBe('nextjs');
    expect(result!.projectName).toBe('nextjs-fixture');
    expect(result!.testFramework).toBe('vitest');
    expect(result!.linter).toBe('eslint');
    expect(result!.hasTypeScript).toBe(true);
  });

  it('returns null for non-nextjs project', async () => {
    const result = await detectNextjs(join(FIXTURES, 'python-app'));
    expect(result).toBeNull();
  });

  it('returns null for react-only project (no next dep)', async () => {
    const result = await detectNextjs(join(FIXTURES, 'rust-app'));
    expect(result).toBeNull();
  });
});

describe('react strategy', () => {
  it('returns null for nextjs project (has "next" dep)', async () => {
    const result = await detectReact(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });

  it('returns null for non-JS project', async () => {
    const result = await detectReact(join(FIXTURES, 'rust-app'));
    expect(result).toBeNull();
  });
});

describe('python strategy', () => {
  it('detects Python fixture correctly', async () => {
    const result = await detectPython(join(FIXTURES, 'python-app'));
    expect(result).not.toBeNull();
    expect(result!.stack).toBe('python');
    expect(result!.projectName).toBe('python-fixture');
    expect(result!.testFramework).toBe('pytest');
    expect(result!.hasTypeScript).toBe(false);
  });

  it('returns null for non-python project', async () => {
    const result = await detectPython(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });
});

describe('flutter strategy', () => {
  it('detects Flutter fixture correctly', async () => {
    const result = await detectFlutter(join(FIXTURES, 'flutter-app'));
    expect(result).not.toBeNull();
    expect(result!.stack).toBe('flutter');
    expect(result!.packageManager).toBe('pub');
    expect(result!.projectName).toBe('flutter_fixture');
  });

  it('returns null for non-flutter project', async () => {
    const result = await detectFlutter(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });
});

describe('rust strategy', () => {
  it('detects Rust fixture correctly', async () => {
    const result = await detectRust(join(FIXTURES, 'rust-app'));
    expect(result).not.toBeNull();
    expect(result!.stack).toBe('rust');
    expect(result!.packageManager).toBe('cargo');
    expect(result!.projectName).toBe('rust-fixture');
  });

  it('returns null for non-rust project', async () => {
    const result = await detectRust(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });
});

describe('go strategy', () => {
  it('returns null for non-go project', async () => {
    const result = await detectGo(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });
});

describe('java strategy', () => {
  it('returns null for non-java project', async () => {
    const result = await detectJava(join(FIXTURES, 'nextjs-app'));
    expect(result).toBeNull();
  });
});

describe('detectJsPackageManager', () => {
  it('detects pnpm from pnpm-lock.yaml', async () => {
    const pm = await detectJsPackageManager(join(FIXTURES, 'nextjs-app'));
    expect(pm).toBe('pnpm');
  });

  it('defaults to npm when no lockfile found', async () => {
    const pm = await detectJsPackageManager(join(FIXTURES, 'rust-app'));
    expect(pm).toBe('npm');
  });
});
