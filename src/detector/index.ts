import { join, basename } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
import type { DetectedStack } from './types.js';
import { detect as detectFlutter } from './strategies/flutter.js';
import { detect as detectRust } from './strategies/rust.js';
import { detect as detectGo } from './strategies/go.js';
import { detect as detectJava } from './strategies/java.js';
import { detect as detectDotnet } from './strategies/dotnet.js';
import { detect as detectAngular } from './strategies/angular.js';
import { detect as detectNextjs } from './strategies/nextjs.js';
import { detect as detectVue } from './strategies/vue.js';
import { detect as detectReact } from './strategies/react.js';
import { detect as detectPython } from './strategies/python.js';
import { detect as detectNodejs } from './strategies/nodejs.js';
import { logger } from '../utils/logger.js';

type Strategy = (cwd: string) => Promise<DetectedStack | null>;

const strategies: Array<{ name: string; fn: Strategy }> = [
  { name: 'flutter', fn: detectFlutter },
  { name: 'rust', fn: detectRust },
  { name: 'go', fn: detectGo },
  { name: 'java', fn: detectJava },
  { name: 'dotnet', fn: detectDotnet },
  { name: 'angular', fn: detectAngular },
  { name: 'nextjs', fn: detectNextjs },
  { name: 'vue', fn: detectVue },
  { name: 'react', fn: detectReact },
  { name: 'python', fn: detectPython },
  { name: 'nodejs', fn: detectNodejs },
];

const MONOREPO_SUBDIRS = [
  'web',
  'frontend',
  'app',
  'api',
  'backend',
  'dashboard',
  'engine',
  'server',
  'client',
  'packages',
  'services',
  'mobile',
  'ui',
  'core',
  'lib',
];

async function detectInDir(cwd: string): Promise<DetectedStack | null> {
  for (const { name, fn } of strategies) {
    logger.debug(`Trying detector: ${name}`);
    const result = await fn(cwd);
    if (result) return result;
  }
  return null;
}

export async function detectStack(cwd: string): Promise<DetectedStack> {
  const rootResult = await detectInDir(cwd);
  if (rootResult) {
    logger.info(`Detected stack: ${rootResult.stack} (${rootResult.projectName})`);
    return rootResult;
  }

  logger.debug('No root stack detected, scanning subdirectories for monorepo...');
  const subprojects: Array<{ path: string; stack: DetectedStack }> = [];

  let entries: string[] = [];
  try {
    entries = readdirSync(cwd);
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build')
      continue;
    const fullPath = join(cwd, entry);
    try {
      if (!statSync(fullPath).isDirectory()) continue;
    } catch {
      continue;
    }

    if (!MONOREPO_SUBDIRS.includes(entry.toLowerCase())) {
      const isLikelySubproject = entries.length <= 20;
      if (!isLikelySubproject) continue;
    }

    const subResult = await detectInDir(fullPath);
    if (subResult) {
      subResult.projectName = `${basename(cwd)}/${entry}`;
      subprojects.push({ path: entry, stack: subResult });
    }
  }

  if (subprojects.length > 0) {
    const primary = subprojects[0].stack;
    const monoResult: DetectedStack = {
      ...primary,
      projectName: basename(cwd),
      isMonorepo: true,
      subprojects,
    };
    logger.info(`Detected monorepo: ${basename(cwd)} with ${subprojects.length} subprojects`);
    for (const sp of subprojects) {
      logger.info(`  - ${sp.path}: ${sp.stack.stack} (${sp.stack.packageManager})`);
    }
    return monoResult;
  }

  throw new Error(
    `No supported stack detected in ${cwd}. ` +
      `Checked root and subdirectories. ` +
      `Supported: flutter, rust, go, java, dotnet, angular, nextjs, vue, react, python, nodejs`,
  );
}

export type { DetectedStack } from './types.js';
