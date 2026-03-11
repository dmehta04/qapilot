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
  if (!deps['vue']) return null;

  const pm: PackageManager = await detectJsPackageManager(cwd);
  const hasTs = !!deps['typescript'];
  const testFramework = deps['vitest'] ? 'vitest' : deps['jest'] ? 'jest' : 'vitest';
  const linter = deps['eslint'] ? 'eslint' : 'none';
  const formatter = deps['prettier'] ? 'prettier' : 'none';

  return {
    stack: 'vue',
    packageManager: pm,
    testFramework,
    linter,
    formatter,
    buildCommand: `${pm} run build`,
    testCommand: `${pm} run test`,
    hasTypeScript: hasTs,
    projectName: pkg.name ?? 'vue-project',
  };
}
