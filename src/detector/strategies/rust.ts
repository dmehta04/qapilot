import { join } from 'node:path';
import { fileExists, readFile } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const cargoPath = join(cwd, 'Cargo.toml');
  if (!await fileExists(cargoPath)) return null;

  const content = await readFile(cargoPath);
  const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
  const projectName = nameMatch ? nameMatch[1] : 'rust-project';
  const hasClippy = content.includes('clippy');

  return {
    stack: 'rust',
    packageManager: 'cargo',
    testFramework: 'cargo test',
    linter: hasClippy ? 'clippy' : 'clippy',
    formatter: 'rustfmt',
    buildCommand: 'cargo build',
    testCommand: 'cargo test',
    hasTypeScript: false,
    projectName,
  };
}
