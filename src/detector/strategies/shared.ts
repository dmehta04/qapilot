import { join } from 'node:path';
import { fileExists } from '../../utils/fs.js';
import type { PackageManager } from '../types.js';

export async function detectJsPackageManager(cwd: string): Promise<PackageManager> {
  if (await fileExists(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fileExists(join(cwd, 'bun.lockb'))) return 'bun';
  if (await fileExists(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
