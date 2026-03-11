import { join } from 'node:path';
import { fileExists, readFile } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const goModPath = join(cwd, 'go.mod');
  if (!await fileExists(goModPath)) return null;

  const content = await readFile(goModPath);
  const moduleMatch = content.match(/^module\s+(\S+)/m);
  const moduleName = moduleMatch ? moduleMatch[1] : 'go-project';
  const projectName = moduleName.split('/').pop() ?? 'go-project';

  return {
    stack: 'go',
    packageManager: 'go',
    testFramework: 'go test',
    linter: 'golangci-lint',
    formatter: 'gofmt',
    buildCommand: 'go build ./...',
    testCommand: 'go test ./...',
    hasTypeScript: false,
    projectName,
  };
}
