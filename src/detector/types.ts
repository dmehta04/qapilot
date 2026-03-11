import type { StackType } from '../config/types.js';

export type PackageManager =
  | 'pnpm' | 'npm' | 'yarn' | 'bun'
  | 'pip' | 'uv'
  | 'cargo'
  | 'pub'
  | 'maven' | 'gradle'
  | 'go'
  | 'dotnet';

export interface DetectedStack {
  stack: StackType;
  packageManager: PackageManager;
  testFramework: string;
  linter: string;
  formatter: string;
  buildCommand: string;
  testCommand: string;
  hasTypeScript: boolean;
  projectName: string;
}
