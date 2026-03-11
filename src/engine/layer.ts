import type { LayerID, QAPilotConfig } from '../config/types.js';
import { LAYER_NAMES } from '../config/types.js';
import { STACK_DEFAULTS, DEFAULT_LAYER_TIMEOUTS } from '../config/defaults.js';
import type { LayerResult, ExecutionContext } from './types.js';
import { exec } from '../utils/exec.js';

const LAYER_STACKS: Partial<Record<LayerID, string[]>> = {
  L10: ['nextjs', 'react', 'vue', 'angular'],
  L11: ['nextjs', 'react', 'vue', 'angular'],
  L12: ['flutter', 'nextjs', 'react', 'vue', 'angular'],
  L15: ['nextjs', 'react', 'python', 'java', 'go', 'dotnet'],
};

export function isLayerApplicable(layer: LayerID, stack: string): boolean {
  const allowed = LAYER_STACKS[layer];
  if (!allowed) return true;
  return allowed.includes(stack);
}

export function isLayerEnabled(layer: LayerID, config: QAPilotConfig): boolean {
  if (config.layers?.skip?.includes(layer)) return false;
  const override = config.layers?.overrides?.[layer];
  if (override?.enabled === false) return false;
  return true;
}

export function getLayerCommand(
  layer: LayerID,
  config: QAPilotConfig,
  stack: string,
): string | undefined {
  const override = config.layers?.overrides?.[layer];
  if (override?.command) return override.command;
  const defaults = STACK_DEFAULTS[stack as keyof typeof STACK_DEFAULTS];
  return defaults?.[layer];
}

export function getLayerTimeout(layer: LayerID, config: QAPilotConfig): number {
  const override = config.layers?.overrides?.[layer];
  if (override?.timeout) return override.timeout;
  return DEFAULT_LAYER_TIMEOUTS[layer] ?? 120_000;
}

export function isWarnOnly(layer: LayerID, config: QAPilotConfig): boolean {
  if (config.layers?.warnOnly?.includes(layer)) return true;
  const override = config.layers?.overrides?.[layer];
  return override?.warnOnly === true;
}

export async function executeLayer(
  layer: LayerID,
  ctx: ExecutionContext,
): Promise<LayerResult> {
  const name = LAYER_NAMES[layer];
  const stack = ctx.config.stack ?? 'react';

  if (!isLayerApplicable(layer, stack)) {
    return { layer, name, status: 'skip', duration: 0 };
  }

  if (!isLayerEnabled(layer, ctx.config)) {
    return { layer, name, status: 'skip', duration: 0 };
  }

  const command = getLayerCommand(layer, ctx.config, stack);
  if (!command) {
    return { layer, name, status: 'skip', duration: 0 };
  }

  const timeout = getLayerTimeout(layer, ctx.config);
  const start = Date.now();

  try {
    const result = await exec(command, { cwd: ctx.cwd, timeout });
    const duration = Date.now() - start;

    if (result.exitCode === 0) {
      return {
        layer,
        name,
        status: 'pass',
        duration,
        command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0,
      };
    }

    const status = isWarnOnly(layer, ctx.config) ? 'warn' : 'fail';
    return {
      layer,
      name,
      status,
      duration,
      command,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      layer,
      name,
      status: 'fail',
      duration,
      command,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
