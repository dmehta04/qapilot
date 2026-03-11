import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class IntegrationLayer extends BaseLayer {
  readonly id = 'L5' as const;
  readonly name = 'Integration Tests';
  readonly defaultTier: LayerTier = 'pr';
  readonly applicableStacks: StackType[] | 'all' = 'all';

  protected parseMetrics(stdout: string, _stderr: string): LayerMetrics | undefined {
    const testsMatch = stdout.match(/Tests?\s+(\d+)\s+passed/i);
    const failedMatch = stdout.match(/(\d+)\s+failed/i);

    if (!testsMatch) return undefined;

    return {
      testsPassed: parseInt(testsMatch[1], 10),
      testsFailed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    };
  }
}
