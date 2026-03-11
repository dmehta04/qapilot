import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class SecurityLayer extends BaseLayer {
  readonly id = 'L8' as const;
  readonly name = 'Security Audit';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] | 'all' = 'all';

  protected parseMetrics(stdout: string, stderr: string): LayerMetrics | undefined {
    const combined = stdout + stderr;
    const criticalMatch = combined.match(/(\d+)\s+critical/i);
    const highMatch = combined.match(/(\d+)\s+high/i);
    const mediumMatch = combined.match(/(\d+)\s+moderate/i) ?? combined.match(/(\d+)\s+medium/i);
    const lowMatch = combined.match(/(\d+)\s+low/i);

    if (!criticalMatch && !highMatch && !mediumMatch && !lowMatch) return undefined;

    return {
      vulnerabilities: {
        critical: criticalMatch ? parseInt(criticalMatch[1], 10) : 0,
        high: highMatch ? parseInt(highMatch[1], 10) : 0,
        medium: mediumMatch ? parseInt(mediumMatch[1], 10) : 0,
        low: lowMatch ? parseInt(lowMatch[1], 10) : 0,
      },
    };
  }
}
