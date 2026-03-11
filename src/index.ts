import { loadConfig } from './config/loader.js';

export { loadConfig };
export { qaPilotConfigSchema } from './config/schema.js';
export { STACK_DEFAULTS, DEFAULT_LAYER_TIMEOUTS, GLOBAL_DEFAULTS } from './config/defaults.js';

export type {
  QAPilotConfig,
  LayerConfig,
  LayerID,
  StackType,
  PipelineMode,
  AIConfig,
  NotificationConfig,
  BuildConfig,
  ReportConfig,
  LayersConfig,
} from './config/types.js';
export { LAYER_IDS, LAYER_NAMES, STACK_TYPES, PIPELINE_MODES } from './config/types.js';

export type {
  LayerResult,
  LayerStatus,
  LayerMetrics,
  PipelineResult,
  PipelineStatus,
  ExecutionContext,
  Reporter,
} from './engine/types.js';

export async function scan(cwd: string): Promise<void> {
  const config = loadConfig(cwd);
  console.log(`Scanning ${cwd} with stack: ${config.stack ?? 'auto'}, mode: ${config.mode}`);
}

export async function init(cwd: string): Promise<void> {
  const config = loadConfig(cwd);
  console.log(`Initializing .qapilot.yml for stack: ${config.stack ?? 'unknown'}`);
}

export async function generate(cwd: string): Promise<void> {
  const config = loadConfig(cwd);
  console.log(`Generating tests for stack: ${config.stack ?? 'unknown'}`);
}
