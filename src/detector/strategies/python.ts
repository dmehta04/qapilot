import { join } from 'node:path';
import { fileExists, readFile } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const hasPyproject = await fileExists(join(cwd, 'pyproject.toml'));
  const hasRequirements = await fileExists(join(cwd, 'requirements.txt'));
  if (!hasPyproject && !hasRequirements) return null;

  const hasUv = await fileExists(join(cwd, 'uv.lock'));
  const pm = hasUv ? 'uv' as const : 'pip' as const;

  let projectName = 'python-project';
  let testFramework = 'pytest';
  let linter = 'ruff';

  if (hasPyproject) {
    const content = await readFile(join(cwd, 'pyproject.toml'));
    const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
    if (nameMatch) projectName = nameMatch[1];
    if (content.includes('pytest')) testFramework = 'pytest';
    if (content.includes('ruff')) linter = 'ruff';
    else if (content.includes('flake8')) linter = 'flake8';
  }

  return {
    stack: 'python',
    packageManager: pm,
    testFramework,
    linter,
    formatter: linter === 'ruff' ? 'ruff format' : 'black',
    buildCommand: `${pm} install`,
    testCommand: `${pm === 'uv' ? 'uv run ' : ''}pytest`,
    hasTypeScript: false,
    projectName,
  };
}
