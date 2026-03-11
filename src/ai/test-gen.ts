import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import type { LayerID, QAPilotConfig } from '../config/types.js';

export interface GenerateResult {
  sourceFile: string;
  testFile: string;
  passed: boolean;
  error?: string;
}

export interface AiClient {
  generateTestCode(sourceCode: string, filePath: string): Promise<string>;
}

const TEST_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.test.js', '.test.jsx'];

function hasTestFile(filePath: string): boolean {
  const dir = dirname(filePath);
  const base = basename(filePath, extname(filePath));
  return TEST_SUFFIXES.some((suffix) => {
    try {
      statSync(join(dir, `${base}${suffix}`));
      return true;
    } catch {
      return false;
    }
  });
}

export function findFilesWithoutTests(
  dir: string,
  extensions: string[] = ['.ts', '.tsx'],
): string[] {
  const results: string[] = [];

  function walk(current: string) {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) continue;
        walk(fullPath);
        continue;
      }
      if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
      if (TEST_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) continue;
      if (entry.name.endsWith('.d.ts')) continue;
      if (!hasTestFile(fullPath)) results.push(fullPath);
    }
  }

  walk(dir);
  return results;
}

export function buildPrompt(sourceCode: string, filePath: string): string {
  const ext = extname(filePath);
  const framework = ext === '.py' ? 'pytest' : 'vitest';

  return `Generate comprehensive unit tests for the following source file.
Use ${framework} as the test framework. Cover all exported functions, edge cases, and error paths.
Only output the test code, no explanations.

File: ${filePath}

\`\`\`
${sourceCode}
\`\`\``;
}

export function parseGeneratedCode(response: string): string {
  const codeBlockMatch = response.match(/```(?:typescript|tsx?|python|js|jsx)?\n([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  return response.trim();
}

export async function generateTests(
  cwd: string,
  _config: QAPilotConfig,
  _layer?: LayerID,
  client?: AiClient,
): Promise<GenerateResult[]> {
  if (!client) return [];

  const targets = findFilesWithoutTests(join(cwd, 'src'));
  const results: GenerateResult[] = [];

  for (const filePath of targets) {
    try {
      const sourceCode = readFileSync(filePath, 'utf-8');
      const raw = await client.generateTestCode(sourceCode, filePath);
      const code = parseGeneratedCode(raw);

      const ext = extname(filePath);
      const base = basename(filePath, ext);
      const testPath = join(dirname(filePath), `${base}.test${ext}`);

      mkdirSync(dirname(testPath), { recursive: true });
      writeFileSync(testPath, code, 'utf-8');

      results.push({ sourceFile: filePath, testFile: testPath, passed: true });
    } catch (err) {
      results.push({
        sourceFile: filePath,
        testFile: '',
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
