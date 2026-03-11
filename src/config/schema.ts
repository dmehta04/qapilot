import { z } from 'zod';
import { LAYER_IDS, PIPELINE_MODES, STACK_TYPES } from './types.js';

const layerIdSchema = z.enum(LAYER_IDS);

const layerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  command: z.string().optional(),
  timeout: z.number().positive().optional(),
  warnOnly: z.boolean().optional(),
  reason: z.string().optional(),
  threshold: z.record(z.string(), z.number()).optional(),
  endpoints: z.array(z.string()).optional(),
  baseUrl: z.string().url().optional(),
});

const aiConfigSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  provider: z.enum(['anthropic', 'openai']).optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const notificationConfigSchema = z.object({
  slack: z
    .object({
      enabled: z.boolean().optional(),
      channel: z.string().optional(),
      webhookUrl: z.string().url().optional(),
    })
    .optional(),
  github: z
    .object({
      enabled: z.boolean().optional(),
      commentOnPr: z.boolean().optional(),
      statusCheck: z.boolean().optional(),
    })
    .optional(),
});

const buildConfigSchema = z.object({
  command: z.string().optional(),
  preBuild: z.string().optional(),
  postBuild: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

const reportConfigSchema = z.object({
  format: z.enum(['html', 'json', 'markdown']).optional(),
  outputDir: z.string().optional(),
  upload: z
    .object({
      enabled: z.boolean().optional(),
      bucket: z.string().optional(),
      prefix: z.string().optional(),
    })
    .optional(),
});

const layersConfigSchema = z.object({
  skip: z.array(layerIdSchema).optional(),
  warnOnly: z.array(layerIdSchema).optional(),
  overrides: z.record(layerIdSchema, layerConfigSchema).optional(),
});

export const qaPilotConfigSchema = z.object({
  version: z.string(),
  stack: z.enum(STACK_TYPES).optional(),
  mode: z.enum(PIPELINE_MODES).optional(),
  layers: layersConfigSchema.optional(),
  ai: aiConfigSchema.optional(),
  build: buildConfigSchema.optional(),
  notifications: notificationConfigSchema.optional(),
  reports: reportConfigSchema.optional(),
});

export type ParsedQAPilotConfig = z.infer<typeof qaPilotConfigSchema>;
