import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class CrossBrowserLayer extends BaseLayer {
  readonly id = 'L11' as const;
  readonly name = 'Cross-Browser';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular'];
}
