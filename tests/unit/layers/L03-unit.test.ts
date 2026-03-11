import { describe, it, expect } from 'vitest';
import { UnitLayer } from '../../../src/layers/L03-unit.js';

describe('UnitLayer', () => {
  const layer = new UnitLayer();

  it('has correct id', () => {
    expect(layer.id).toBe('L3');
  });

  it('has correct name', () => {
    expect(layer.name).toBe('Unit Tests');
  });

  it('default tier is fast', () => {
    expect(layer.defaultTier).toBe('fast');
  });

  it('is applicable to all stacks', () => {
    expect(layer.applicableStacks).toBe('all');
  });

  describe('parseMetrics', () => {
    it('parses vitest output for test counts', () => {
      const stdout = 'Tests  12 passed (12)\nDuration  1.23s';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.testsPassed).toBe(12);
      expect(metrics!.testsFailed).toBe(0);
      expect(metrics!.testsRun).toBe(12);
    });

    it('parses vitest output with failures', () => {
      const stdout = 'Tests  8 passed | 2 failed\nDuration  2.5s';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.testsPassed).toBe(8);
      expect(metrics!.testsFailed).toBe(2);
      expect(metrics!.testsRun).toBe(10);
    });

    it('parses pytest output', () => {
      const stdout = '15 passed, 3 failed in 4.52s';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.testsPassed).toBe(15);
      expect(metrics!.testsFailed).toBe(3);
      expect(metrics!.testsRun).toBe(18);
    });

    it('parses cargo test output', () => {
      const stdout = 'test result: ok. 20 passed; 0 failed; 0 ignored; 0 measured';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.testsPassed).toBe(20);
      expect(metrics!.testsFailed).toBe(0);
      expect(metrics!.testsRun).toBe(20);
    });

    it('parses cargo test with failures', () => {
      const stdout = 'test result: FAILED. 18 passed; 2 failed; 0 ignored';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.testsPassed).toBe(18);
      expect(metrics!.testsFailed).toBe(2);
    });

    it('extracts coverage percentage', () => {
      const stdout = 'Tests  5 passed (5)\nCoverage: 85.3%';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.coverage).toBe(85.3);
    });

    it('returns undefined for unparseable output', () => {
      const metrics = (layer as any).parseMetrics('random output', '');
      expect(metrics).toBeUndefined();
    });
  });
});
