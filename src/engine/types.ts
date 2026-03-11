import type { LayerID, StackType, PipelineMode, QAPilotConfig } from '../config/types.js';

export interface LayerMetrics {
  coverage?: number;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
  vulnerabilities?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lighthouseScores?: Record<string, number>;
  [key: string]: unknown;
}

export type LayerStatus = 'pass' | 'fail' | 'warn' | 'skip' | 'running';

export interface LayerResult {
  layer: LayerID;
  name: string;
  status: LayerStatus;
  duration: number;
  command?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  metrics?: LayerMetrics;
  skippedReason?: string;
  error?: string;
}

export type PipelineStatus = 'pass' | 'fail' | 'warn';

export interface PipelineResult {
  config: QAPilotConfig;
  projectName: string;
  layers: LayerResult[];
  status: PipelineStatus;
  duration: number;
  stack?: StackType;
  mode?: PipelineMode;
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
    skipped: number;
  };
}

export interface ExecutionContext {
  cwd: string;
  config: QAPilotConfig;
  verbose?: boolean;
  quiet?: boolean;
}

export interface Reporter {
  name: string;
  report(result: PipelineResult, ctx: ExecutionContext): Promise<void>;
}
