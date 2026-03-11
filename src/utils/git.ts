import { exec } from './exec.js';

export async function getChangedFiles(cwd: string): Promise<string[]> {
  const result = await exec('git diff --name-only HEAD', { cwd });
  if (result.exitCode !== 0) return [];
  return result.stdout.trim().split('\n').filter(Boolean);
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  const result = await exec('git rev-parse --abbrev-ref HEAD', { cwd });
  return result.stdout.trim();
}

export async function isFeatureBranch(cwd: string): Promise<boolean> {
  const branch = await getCurrentBranch(cwd);
  return branch !== 'main' && branch !== 'master' && branch !== 'develop';
}
