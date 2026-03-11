import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class VisualLayer extends BaseLayer {
  readonly id = 'L10' as const;
  readonly name = 'Visual Regression';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular'];
}
