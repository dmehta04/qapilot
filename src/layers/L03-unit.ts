import type { StackType } from '../config/types.js';
import type { LayerMetrics } from '../engine/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class UnitLayer extends BaseLayer {
  readonly id = 'L3' as const;
  readonly name = 'Unit Tests';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] | 'all' = 'all';

  protected parseMetrics(stdout: string, _stderr: string): LayerMetrics | undefined {
    // vitest: "Tests  5 passed (5)"
    const vitestMatch = stdout.match(/Tests\s+(\d+)\s+passed/);
    const vitestFailMatch = stdout.match(/(\d+)\s+failed/);

    // pytest: "5 passed, 1 failed"
    const pytestPassMatch = stdout.match(/(\d+)\s+passed/i);
    const pytestFailMatch = stdout.match(/(\d+)\s+failed/i);

    // cargo: "test result: ok. 5 passed; 0 failed"
    const cargoMatch = stdout.match(/test result: (?:ok|FAILED)\. (\d+) passed; (\d+) failed/);

    // coverage: "Coverage: 85.3%"
    const coverageMatch = stdout.match(/(?:coverage|Coverage)[\s:]+(\d+(?:\.\d+)?)\s*%/);

    let passed = 0;
    let failed = 0;

    if (cargoMatch) {
      passed = parseInt(cargoMatch[1], 10);
      failed = parseInt(cargoMatch[2], 10);
    } else if (vitestMatch) {
      passed = parseInt(vitestMatch[1], 10);
      failed = vitestFailMatch ? parseInt(vitestFailMatch[1], 10) : 0;
    } else if (pytestPassMatch) {
      passed = parseInt(pytestPassMatch[1], 10);
      failed = pytestFailMatch ? parseInt(pytestFailMatch[1], 10) : 0;
    } else {
      return undefined;
    }

    const metrics: LayerMetrics = {
      testsPassed: passed,
      testsFailed: failed,
      testsRun: passed + failed,
    };

    if (coverageMatch) {
      metrics.coverage = parseFloat(coverageMatch[1]);
    }

    return metrics;
  }
}
