import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { qaPilotConfigSchema } from './schema.js';
import { GLOBAL_DEFAULTS, STACK_DEFAULTS } from './defaults.js';
import type { LayerID, QAPilotConfig, StackType } from './types.js';
import { LAYER_IDS } from './types.js';

function findUp(filename: string, startDir: string): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (true) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}

function resolveEnvVars(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{(\w+)\}/g, (_, varName: string) => process.env[varName] ?? '');
  }
  if (Array.isArray(value)) {
    return value.map(resolveEnvVars);
  }
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveEnvVars(v);
    }
    return resolved;
  }
  return value;
}

function detectStackFromFiles(cwd: string): StackType | undefined {
  const exists = (file: string) => fs.existsSync(path.join(cwd, file));

  if (exists('next.config.js') || exists('next.config.mjs') || exists('next.config.ts'))
    return 'nextjs';
  if (exists('angular.json')) return 'angular';
  if (exists('nuxt.config.ts') || exists('vue.config.js')) return 'vue';
  if (exists('pubspec.yaml')) return 'flutter';
  if (exists('Cargo.toml')) return 'rust';
  if (exists('go.mod')) return 'go';
  if (exists('pom.xml') || exists('build.gradle') || exists('build.gradle.kts')) return 'java';
  if (exists('pyproject.toml') || exists('setup.py') || exists('requirements.txt')) return 'python';
  if (exists('package.json')) return 'react';

  return undefined;
}

function buildStackLayerDefaults(
  stack: StackType,
): NonNullable<QAPilotConfig['layers']> {
  const stackDefaults = STACK_DEFAULTS[stack];
  const overrides: NonNullable<NonNullable<QAPilotConfig['layers']>['overrides']> = {};

  for (const layerId of LAYER_IDS) {
    const command = stackDefaults[layerId];
    if (command) {
      overrides[layerId] = { command, enabled: true };
    }
  }

  return { overrides };
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;

    const baseValue = result[key];
    if (
      baseValue !== null &&
      value !== null &&
      typeof baseValue === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(value)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

function mergeLayerIds(
  base: LayerID[] | undefined,
  override: LayerID[] | undefined,
): LayerID[] | undefined {
  if (!base && !override) return undefined;
  const merged = new Set<LayerID>([...(base ?? []), ...(override ?? [])]);
  return merged.size > 0 ? [...merged] : undefined;
}

function mergeLayers(
  base: QAPilotConfig['layers'],
  override: QAPilotConfig['layers'],
): QAPilotConfig['layers'] {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    skip: mergeLayerIds(base.skip, override.skip),
    warnOnly: mergeLayerIds(base.warnOnly, override.warnOnly),
    overrides: deepMerge(
      (base.overrides ?? {}) as Record<string, unknown>,
      (override.overrides ?? {}) as Record<string, unknown>,
    ) as NonNullable<NonNullable<QAPilotConfig['layers']>['overrides']>,
  };
}

export function loadConfig(cwd: string, overrides?: Partial<QAPilotConfig>): QAPilotConfig {
  const configPath = findUp('.qapilot.yml', cwd) ?? findUp('.qapilot.yaml', cwd);

  let fileConfig: Partial<QAPilotConfig> = {};

  if (configPath) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.load(raw);
    const resolved = resolveEnvVars(parsed);
    fileConfig = qaPilotConfigSchema.parse(resolved);
  }

  const resolvedStack = overrides?.stack ?? fileConfig.stack ?? detectStackFromFiles(cwd);

  let config: QAPilotConfig = {
    version: GLOBAL_DEFAULTS.version,
    mode: 'full',
  };

  if (resolvedStack) {
    config.stack = resolvedStack;
    config.layers = buildStackLayerDefaults(resolvedStack);
  }

  const { layers: fileLayers, ...fileRest } = fileConfig;
  config = { ...config, ...fileRest };
  config.layers = mergeLayers(config.layers, fileLayers);

  if (overrides) {
    const { layers: overrideLayers, ...overrideRest } = overrides;
    config = { ...config, ...overrideRest };
    config.layers = mergeLayers(config.layers, overrideLayers);
  }

  return config;
}
