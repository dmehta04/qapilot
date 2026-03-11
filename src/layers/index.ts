import type { LayerID, StackType } from '../config/types.js';
import type { BaseLayer, LayerTier } from './base.js';
import { LintLayer } from './L01-lint.js';
import { TypesLayer } from './L02-types.js';
import { UnitLayer } from './L03-unit.js';
import { ComponentLayer } from './L04-component.js';
import { IntegrationLayer } from './L05-integration.js';
import { ContractLayer } from './L06-contract.js';
import { SmokeLayer } from './L07-smoke.js';
import { SecurityLayer } from './L08-security.js';
import { E2ELayer } from './L09-e2e.js';
import { VisualLayer } from './L10-visual.js';
import { CrossBrowserLayer } from './L11-cross-browser.js';
import { MobileLayer } from './L12-mobile.js';
import { PerformanceLayer } from './L13-performance.js';
import { AccessibilityLayer } from './L14-accessibility.js';
import { ChaosLayer } from './L15-chaos.js';
import { CustomLayer } from './L16-custom.js';

const ALL_LAYERS: BaseLayer[] = [
  new LintLayer(),
  new TypesLayer(),
  new UnitLayer(),
  new ComponentLayer(),
  new IntegrationLayer(),
  new ContractLayer(),
  new SmokeLayer(),
  new SecurityLayer(),
  new E2ELayer(),
  new VisualLayer(),
  new CrossBrowserLayer(),
  new MobileLayer(),
  new PerformanceLayer(),
  new AccessibilityLayer(),
  new ChaosLayer(),
  new CustomLayer(),
];

export const layerRegistry = new Map<LayerID, BaseLayer>(
  ALL_LAYERS.map(layer => [layer.id, layer])
);

export function getLayersForTier(tier: LayerTier): BaseLayer[] {
  const tierOrder: LayerTier[] = ['fast', 'pr', 'release'];
  const maxIndex = tierOrder.indexOf(tier);
  return ALL_LAYERS.filter(layer => tierOrder.indexOf(layer.defaultTier) <= maxIndex);
}

export function getLayersForStack(stack: StackType): BaseLayer[] {
  return ALL_LAYERS.filter(layer => layer.isApplicable(stack));
}

export { BaseLayer, type LayerTier } from './base.js';
