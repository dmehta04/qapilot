import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class ChaosLayer extends BaseLayer {
  readonly id = 'L15' as const;
  readonly name = 'Chaos Engineering';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] | 'all' = 'all';
}
