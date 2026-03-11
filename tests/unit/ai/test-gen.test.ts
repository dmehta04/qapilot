import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  findFilesWithoutTests,
  buildPrompt,
  parseGeneratedCode,
  generateTests,
  type AiClient,
} from '../../../src/ai/test-gen.js';

function makeTempDir(): string {
  const dir = join(tmpdir(), `qapilot-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('findFilesWithoutTests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('finds files that have no corresponding test file', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'utils.ts'), 'export function foo() {}');
    writeFileSync(join(tempDir, 'src', 'helper.ts'), 'export function bar() {}');

    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith('utils.ts'))).toBe(true);
    expect(files.some((f) => f.endsWith('helper.ts'))).toBe(true);
  });

  it('excludes files that have test files', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'utils.ts'), 'export function foo() {}');
    writeFileSync(join(tempDir, 'src', 'utils.test.ts'), 'test("foo", () => {})');

    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(0);
  });

  it('excludes test files themselves', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'foo.test.ts'), 'test("a", () => {})');
    writeFileSync(join(tempDir, 'src', 'bar.spec.ts'), 'test("b", () => {})');

    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(0);
  });

  it('excludes .d.ts files', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'types.d.ts'), 'declare module "x" {}');

    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(0);
  });

  it('skips node_modules directory', () => {
    mkdirSync(join(tempDir, 'src', 'node_modules', 'dep'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'node_modules', 'dep', 'index.ts'), 'export {}');

    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(0);
  });

  it('handles empty directory gracefully', () => {
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    const files = findFilesWithoutTests(join(tempDir, 'src'));
    expect(files).toHaveLength(0);
  });
});

describe('buildPrompt', () => {
  it('uses vitest framework for .ts files', () => {
    const prompt = buildPrompt('export function add(a: number, b: number) { return a + b; }', 'src/utils.ts');
    expect(prompt).toContain('vitest');
    expect(prompt).toContain('src/utils.ts');
    expect(prompt).toContain('export function add');
  });

  it('uses pytest framework for .py files', () => {
    const prompt = buildPrompt('def add(a, b): return a + b', 'app/utils.py');
    expect(prompt).toContain('pytest');
  });

  it('includes the source code in code block', () => {
    const source = 'export function hello() { return "world"; }';
    const prompt = buildPrompt(source, 'src/hello.ts');
    expect(prompt).toContain('```');
    expect(prompt).toContain(source);
  });
});

describe('parseGeneratedCode', () => {
  it('extracts code from markdown code block', () => {
    const response = 'Here are the tests:\n```typescript\nimport { test } from "vitest";\ntest("a", () => {});\n```\nDone.';
    const code = parseGeneratedCode(response);
    expect(code).toContain('import { test }');
    expect(code).not.toContain('```');
    expect(code).not.toContain('Here are');
  });

  it('returns raw response when no code block present', () => {
    const response = 'import { test } from "vitest";\ntest("a", () => {});';
    const code = parseGeneratedCode(response);
    expect(code).toContain('import { test }');
  });

  it('handles tsx code blocks', () => {
    const response = '```tsx\nconst Component = () => <div />;\n```';
    const code = parseGeneratedCode(response);
    expect(code).toContain('Component');
  });

  it('trims whitespace', () => {
    const response = '  \n  some code  \n  ';
    const code = parseGeneratedCode(response);
    expect(code).toBe('some code');
  });
});

describe('generateTests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
    mkdirSync(join(tempDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when no client provided', async () => {
    const results = await generateTests(tempDir, { version: '1' });
    expect(results).toEqual([]);
  });

  it('generates test files using AI client', async () => {
    writeFileSync(join(tempDir, 'src', 'math.ts'), 'export function add(a: number, b: number) { return a + b; }');

    const mockClient: AiClient = {
      generateTestCode: async () => '```typescript\nimport { add } from "./math";\ntest("add", () => expect(add(1,2)).toBe(3));\n```',
    };

    const results = await generateTests(tempDir, { version: '1' }, undefined, mockClient);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].testFile).toContain('math.test.ts');
    expect(existsSync(results[0].testFile)).toBe(true);
  });

  it('writes parsed test code to disk', async () => {
    writeFileSync(join(tempDir, 'src', 'utils.ts'), 'export const x = 1;');

    const mockClient: AiClient = {
      generateTestCode: async () => 'import { x } from "./utils";\ntest("x", () => expect(x).toBe(1));',
    };

    const results = await generateTests(tempDir, { version: '1' }, undefined, mockClient);
    const content = readFileSync(results[0].testFile, 'utf-8');
    expect(content).toContain('import { x }');
  });

  it('handles AI client errors gracefully', async () => {
    writeFileSync(join(tempDir, 'src', 'broken.ts'), 'export const y = 2;');

    const mockClient: AiClient = {
      generateTestCode: async () => { throw new Error('API rate limit'); },
    };

    const results = await generateTests(tempDir, { version: '1' }, undefined, mockClient);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].error).toContain('API rate limit');
  });

  it('sends correct prompt to client', async () => {
    writeFileSync(join(tempDir, 'src', 'greet.ts'), 'export function greet(name: string) { return `Hello ${name}`; }');

    const mockClient: AiClient = {
      generateTestCode: async (source, path) => {
        expect(source).toContain('greet');
        expect(path).toContain('greet.ts');
        return 'test("greet", () => {});';
      },
    };

    await generateTests(tempDir, { version: '1' }, undefined, mockClient);
  });
});
