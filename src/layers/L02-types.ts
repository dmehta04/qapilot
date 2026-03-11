import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class TypesLayer extends BaseLayer {
  readonly id = 'L2' as const;
  readonly name = 'Type Check';
  readonly defaultTier: LayerTier = 'fast';
  readonly applicableStacks: StackType[] = [
    'nextjs', 'react', 'vue', 'angular',
    'python', 'rust', 'java', 'go', 'dotnet', 'flutter',
  ];
}
