export const LAYER_IDS = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
  'L7',
  'L8',
  'L9',
  'L10',
  'L11',
  'L12',
  'L13',
  'L14',
  'L15',
  'L16',
] as const;

export type LayerID = (typeof LAYER_IDS)[number];

export const LAYER_NAMES: Record<LayerID, string> = {
  L1: 'lint',
  L2: 'types',
  L3: 'unit',
  L4: 'component',
  L5: 'integration',
  L6: 'contract',
  L7: 'smoke',
  L8: 'security',
  L9: 'e2e',
  L10: 'visual',
  L11: 'cross-browser',
  L12: 'mobile',
  L13: 'performance',
  L14: 'accessibility',
  L15: 'chaos',
  L16: 'custom',
};

export const STACK_TYPES = [
  'nextjs',
  'react',
  'vue',
  'angular',
  'flutter',
  'python',
  'rust',
  'java',
  'go',
  'dotnet',
] as const;

export type StackType = (typeof STACK_TYPES)[number];

export const PIPELINE_MODES = ['fast', 'full', 'pre-release'] as const;

export type PipelineMode = (typeof PIPELINE_MODES)[number];

export interface LayerConfig {
  enabled?: boolean;
  command?: string;
  timeout?: number;
  warnOnly?: boolean;
  reason?: string;
  threshold?: Record<string, number>;
  endpoints?: string[];
  baseUrl?: string;
}

export interface AIConfig {
  enabled?: boolean;
  model?: string;
  apiKey?: string;
  provider?: 'anthropic' | 'openai';
  maxTokens?: number;
  temperature?: number;
}

export interface NotificationConfig {
  slack?: {
    enabled?: boolean;
    channel?: string;
    webhookUrl?: string;
  };
  github?: {
    enabled?: boolean;
    commentOnPr?: boolean;
    statusCheck?: boolean;
  };
}

export interface BuildConfig {
  command?: string;
  preBuild?: string;
  postBuild?: string;
  env?: Record<string, string>;
}

export interface ReportConfig {
  format?: 'html' | 'json' | 'markdown';
  outputDir?: string;
  upload?: {
    enabled?: boolean;
    bucket?: string;
    prefix?: string;
  };
}

export interface LayersConfig {
  skip?: LayerID[];
  warnOnly?: LayerID[];
  overrides?: Partial<Record<LayerID, LayerConfig>>;
}

export interface QAPilotConfig {
  version: string;
  stack?: StackType;
  mode?: PipelineMode;
  layers?: LayersConfig;
  ai?: AIConfig;
  build?: BuildConfig;
  notifications?: NotificationConfig;
  reports?: ReportConfig;
}
