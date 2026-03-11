import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class E2ELayer extends BaseLayer {
  readonly id = 'L9' as const;
  readonly name = 'E2E Tests';
  readonly defaultTier: LayerTier = 'pr';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular', 'flutter'];

  protected parseMetrics(stdout: string, _stderr: string): LayerMetrics | undefined {
    const passedMatch = stdout.match(/(\d+)\s+passed/i);
    const failedMatch = stdout.match(/(\d+)\s+failed/i);

    if (!passedMatch) return undefined;

    return {
      testsPassed: parseInt(passedMatch[1], 10),
      testsFailed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    };
  }
}
