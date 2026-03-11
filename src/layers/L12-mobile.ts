import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class MobileLayer extends BaseLayer {
  readonly id = 'L12' as const;
  readonly name = 'Mobile Testing';
  readonly defaultTier: LayerTier = 'release';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular', 'flutter'];
}
