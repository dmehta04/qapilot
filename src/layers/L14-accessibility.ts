import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class AccessibilityLayer extends BaseLayer {
  readonly id = 'L14' as const;
  readonly name = 'Accessibility';
  readonly defaultTier: LayerTier = 'pr';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular'];
}
