import { join } from 'node:path';
import { fileExists, readJson } from '../../utils/fs.js';
import type { DetectedStack, PackageManager } from '../types.js';
import { detectJsPackageManager } from './shared.js';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const pkgPath = join(cwd, 'package.json');
  if (!await fileExists(pkgPath)) return null;

  const pkg = await readJson<PackageJson>(pkgPath);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const pm: PackageManager = await detectJsPackageManager(cwd);
  const hasTs = !!deps['typescript'];
  const testFramework = deps['vitest'] ? 'vitest' : deps['jest'] ? 'jest' : deps['mocha'] ? 'mocha' : 'vitest';
  const linter = deps['eslint'] ? 'eslint' : 'none';
  const formatter = deps['prettier'] ? 'prettier' : 'none';

  return {
    stack: 'nodejs',
    packageManager: pm,
    testFramework,
    linter,
    formatter,
    buildCommand: deps['esbuild'] || deps['tsc'] ? `${pm} run build` : 'echo "no build"',
    testCommand: `${pm} run test`,
    hasTypeScript: hasTs,
    projectName: pkg.name ?? 'node-project',
  };
}
