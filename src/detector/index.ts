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
];

export async function detectStack(cwd: string): Promise<DetectedStack> {
  for (const { name, fn } of strategies) {
    logger.debug(`Trying detector: ${name}`);
    const result = await fn(cwd);
    if (result) {
      logger.info(`Detected stack: ${result.stack} (${result.projectName})`);
      return result;
    }
  }
  throw new Error(`No supported stack detected in ${cwd}. Supported: flutter, rust, go, java, dotnet, angular, nextjs, vue, react, python`);
}

export type { DetectedStack } from './types.js';
