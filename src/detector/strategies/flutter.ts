import { join } from 'node:path';
import { fileExists, readYaml } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

interface Pubspec {
  name?: string;
  dependencies?: Record<string, unknown>;
  dev_dependencies?: Record<string, unknown>;
  environment?: Record<string, string>;
}

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const pubspecPath = join(cwd, 'pubspec.yaml');
  if (!await fileExists(pubspecPath)) return null;

  const pubspec = await readYaml<Pubspec>(pubspecPath);
  const deps = { ...pubspec.dependencies, ...pubspec.dev_dependencies };
  const hasFlutter = !!deps['flutter'] || !!pubspec.environment?.['flutter'];
  if (!hasFlutter) return null;

  const testFramework = deps['flutter_test'] ? 'flutter_test' : 'flutter_test';
  const linter = deps['flutter_lints'] || deps['very_good_analysis'] ? 'flutter_lints' : 'flutter_lints';

  return {
    stack: 'flutter',
    packageManager: 'pub',
    testFramework,
    linter,
    formatter: 'dart format',
    buildCommand: 'flutter build',
    testCommand: 'flutter test',
    hasTypeScript: false,
    projectName: pubspec.name ?? 'flutter-project',
  };
}
