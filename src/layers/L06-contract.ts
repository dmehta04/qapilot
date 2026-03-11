import type { StackType } from '../config/types.js';
import { BaseLayer, type LayerTier } from './base.js';

export class ContractLayer extends BaseLayer {
  readonly id = 'L6' as const;
  readonly name = 'Contract Tests';
  readonly defaultTier: LayerTier = 'pr';
  readonly applicableStacks: StackType[] = ['nextjs', 'react', 'vue', 'angular', 'python', 'java', 'go'];
}
