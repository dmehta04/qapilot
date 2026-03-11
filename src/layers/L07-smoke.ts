import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class SmokeLayer extends BaseLayer {
  readonly id = 'L7' as const;
  readonly name = 'Smoke Tests';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] | 'all' = 'all';
}
