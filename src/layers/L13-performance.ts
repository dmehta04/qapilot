import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class PerformanceLayer extends BaseLayer {
  readonly id = 'L13' as const;
  readonly name = 'Performance';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular'];

  protected parseMetrics(stdout: string, _stderr: string): LayerMetrics | undefined {
    try {
      const json = JSON.parse(stdout);
      if (json?.categories) {
        const scores: Record<string, number> = {};
        for (const [key, val] of Object.entries(json.categories)) {
          const category = val as { score?: number };
          if (category.score != null) {
            scores[key] = Math.round(category.score * 100);
          }
        }
        if (Object.keys(scores).length > 0) {
          return { lighthouseScores: scores };
        }
      }
    } catch {
      // not JSON lighthouse output
    }
    return undefined;
  }
}
