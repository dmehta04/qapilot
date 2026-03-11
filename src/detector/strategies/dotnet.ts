import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { fileExists } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const hasSln = await fileExists(join(cwd, '*.sln')).catch(() => false);

  let hasCsproj = hasSln;
  if (!hasCsproj) {
    try {
      const files = await readdir(cwd);
      hasCsproj = files.some(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    } catch {
      return null;
    }
  }

  if (!hasCsproj) return null;

  let projectName = 'dotnet-project';
  try {
    const files = await readdir(cwd);
    const csprojFile = files.find(f => f.endsWith('.csproj'));
    if (csprojFile) projectName = csprojFile.replace('.csproj', '');
    const slnFile = files.find(f => f.endsWith('.sln'));
    if (slnFile) projectName = slnFile.replace('.sln', '');
  } catch { /* use default */ }

  return {
    stack: 'dotnet',
    packageManager: 'dotnet',
    testFramework: 'xunit',
    linter: 'dotnet format',
    formatter: 'dotnet format',
    buildCommand: 'dotnet build',
    testCommand: 'dotnet test',
    hasTypeScript: false,
    projectName,
  };
}
