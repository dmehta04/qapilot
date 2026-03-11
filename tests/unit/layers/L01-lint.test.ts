import { describe, it, expect } from 'vitest';
import { LintLayer } from '../../../src/layers/L01-lint.js';

describe('LintLayer', () => {
  const layer = new LintLayer();

  it('has correct id', () => {
    expect(layer.id).toBe('L1');
  });

  it('has correct name', () => {
    expect(layer.name).toBe('Lint');
  });

  it('default tier is fast', () => {
    expect(layer.defaultTier).toBe('fast');
  });

  it('is applicable to all stacks', () => {
    expect(layer.applicableStacks).toBe('all');
  });

  it('isApplicable returns true for nextjs', () => {
    expect(layer.isApplicable('nextjs')).toBe(true);
  });

  it('isApplicable returns true for python', () => {
    expect(layer.isApplicable('python')).toBe(true);
  });

  it('isApplicable returns true for rust', () => {
    expect(layer.isApplicable('rust')).toBe(true);
  });

  it('isApplicable returns true for flutter', () => {
    expect(layer.isApplicable('flutter')).toBe(true);
  });

  it('isApplicable returns true for go', () => {
    expect(layer.isApplicable('go')).toBe(true);
  });

  it('isApplicable returns true for java', () => {
    expect(layer.isApplicable('java')).toBe(true);
  });

  it('isApplicable returns true for dotnet', () => {
    expect(layer.isApplicable('dotnet')).toBe(true);
  });
});
