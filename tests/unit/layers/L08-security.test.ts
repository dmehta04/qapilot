import { describe, it, expect } from 'vitest';
import { SecurityLayer } from '../../../src/layers/L08-security.js';

describe('SecurityLayer', () => {
  const layer = new SecurityLayer();

  it('has correct id', () => {
    expect(layer.id).toBe('L8');
  });

  it('has correct name', () => {
    expect(layer.name).toBe('Security Audit');
  });

  it('default tier is fast', () => {
    expect(layer.defaultTier).toBe('fast');
  });

  it('is applicable to all stacks', () => {
    expect(layer.applicableStacks).toBe('all');
  });

  describe('parseMetrics', () => {
    it('parses vulnerability counts from audit output', () => {
      const stdout = 'found 3 critical, 5 high, 2 moderate, 10 low vulnerabilities';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.vulnerabilities.critical).toBe(3);
      expect(metrics!.vulnerabilities.high).toBe(5);
      expect(metrics!.vulnerabilities.medium).toBe(2);
      expect(metrics!.vulnerabilities.low).toBe(10);
    });

    it('handles output with only some severity levels', () => {
      const stdout = '1 high severity vulnerability found';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics).toBeDefined();
      expect(metrics!.vulnerabilities.high).toBe(1);
      expect(metrics!.vulnerabilities.critical).toBe(0);
    });

    it('returns undefined when no vulnerability info found', () => {
      const metrics = (layer as any).parseMetrics('all good', '');
      expect(metrics).toBeUndefined();
    });

    it('parses from stderr as well', () => {
      const metrics = (layer as any).parseMetrics('', '2 critical vulnerabilities');
      expect(metrics).toBeDefined();
      expect(metrics!.vulnerabilities.critical).toBe(2);
    });

    it('parses medium from "moderate" keyword', () => {
      const stdout = '4 moderate vulnerabilities';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics!.vulnerabilities.medium).toBe(4);
    });

    it('parses medium from "medium" keyword', () => {
      const stdout = '4 medium vulnerabilities';
      const metrics = (layer as any).parseMetrics(stdout, '');
      expect(metrics!.vulnerabilities.medium).toBe(4);
    });
  });
});
