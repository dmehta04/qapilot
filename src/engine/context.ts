import type { QAPilotConfig, LayerID } from '../config/types.js';
import type { DetectedStack } from '../detector/types.js';
import type { LayerResult } from './types.js';
import { STACK_DEFAULTS, DEFAULT_LAYER_TIMEOUTS } from '../config/defaults.js';

export class PipelineContext {
  readonly cwd: string;
  readonly config: QAPilotConfig;
  readonly detectedStack: DetectedStack;
  readonly startTime: number;
  readonly results: LayerResult[] = [];

  constructor(cwd: string, config: QAPilotConfig, detectedStack: DetectedStack) {
    this.cwd = cwd;
    this.config = config;
    this.detectedStack = detectedStack;
    this.startTime = Date.now();
  }

  addResult(result: LayerResult) {
    this.results.push(result);
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  isLayerEnabled(id: LayerID): boolean {
    if (this.config.layers?.skip?.includes(id)) return false;
    const override = this.config.layers?.overrides?.[id];
    if (override?.enabled === false) return false;
    return true;
  }

  isWarnOnly(id: LayerID): boolean {
    if (this.config.layers?.warnOnly?.includes(id)) return true;
    return this.config.layers?.overrides?.[id]?.warnOnly ?? false;
  }

  getLayerCommand(id: LayerID): string | undefined {
    const override = this.config.layers?.overrides?.[id]?.command;
    if (override) return override;
    const stackDefaults = STACK_DEFAULTS[this.detectedStack.stack];
    return stackDefaults?.[id];
  }

  getLayerTimeout(id: LayerID): number {
    return this.config.layers?.overrides?.[id]?.timeout ?? DEFAULT_LAYER_TIMEOUTS[id] ?? 120_000;
  }
}
