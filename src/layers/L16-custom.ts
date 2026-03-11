import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class CustomLayer extends BaseLayer {
  readonly id = 'L16' as const;
  readonly name = 'Custom';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] | 'all' = 'all';
}
