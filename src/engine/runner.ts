import type { QAPilotConfig, LayerID } from '../config/types.js';
import { LAYER_NAMES } from '../config/types.js';
import type { LayerResult, PipelineResult, PipelineStatus } from './types.js';
import { PipelineContext } from './context.js';
import { detectStack } from '../detector/index.js';
import { getLayersForTier } from '../layers/index.js';
import { logger } from '../utils/logger.js';

const MODE_TIER_MAP = {
  fast: 'fast',
  full: 'pr',
  'pre-release': 'release',
} as const;

export type OnLayerStart = (layer: LayerID, name: string) => void;
export type OnLayerEnd = (result: LayerResult) => void;

export interface RunPipelineOptions {
  onLayerStart?: OnLayerStart;
  onLayerEnd?: OnLayerEnd;
}

export async function runPipeline(
  config: QAPilotConfig,
  cwd: string,
  options?: RunPipelineOptions,
): Promise<PipelineResult> {
  const detected = await detectStack(cwd);
  const resolvedConfig: QAPilotConfig = {
    ...config,
    stack: config.stack ?? detected.stack,
  };

  const ctx = new PipelineContext(cwd, resolvedConfig, detected);
  const mode = resolvedConfig.mode ?? 'fast';
  const tier = MODE_TIER_MAP[mode];
  const layers = getLayersForTier(tier);
  const start = Date.now();
  const results: LayerResult[] = [];

  for (const layer of layers) {
    options?.onLayerStart?.(layer.id, layer.name);
    const result = await layer.execute(ctx);
    results.push(result);
    ctx.addResult(result);
    options?.onLayerEnd?.(result);

    if (result.status === 'fail') {
      const blocking =
        resolvedConfig.layers?.overrides?.[layer.id]?.warnOnly !== true &&
        !resolvedConfig.layers?.warnOnly?.includes(layer.id);
      if (blocking) {
        logger.warn(`Layer ${layer.id} (${layer.name}) failed — stopping pipeline`);
        break;
      }
    }
  }

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    warned: results.filter((r) => r.status === 'warn').length,
    skipped: results.filter((r) => r.status === 'skip').length,
  };

  const status: PipelineStatus = summary.failed > 0 ? 'fail' : summary.warned > 0 ? 'warn' : 'pass';

  return {
    config: resolvedConfig,
    projectName: detected.projectName,
    timestamp: new Date().toISOString(),
    duration: Date.now() - start,
    layers: results,
    status,
    summary,
    stack: resolvedConfig.stack,
    mode,
  };
}

export { layerRegistry, getLayersForTier } from '../layers/index.js';
export { LAYER_NAMES };
