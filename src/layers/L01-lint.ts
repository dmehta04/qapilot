import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class LintLayer extends BaseLayer {
  readonly id = 'L1' as const;
  readonly name = 'Lint';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] | 'all' = 'all';
}
