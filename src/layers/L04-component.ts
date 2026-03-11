import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class ComponentLayer extends BaseLayer {
  readonly id = 'L4' as const;
  readonly name = 'Component Tests';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular', 'flutter'];

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
