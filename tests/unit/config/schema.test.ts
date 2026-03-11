import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { qaPilotConfigSchema } from '../../../src/config/schema.js';

const FIXTURES = join(__dirname, '../../fixtures/configs');

function loadYaml(name: string) {
  const raw = readFileSync(join(FIXTURES, name), 'utf-8');
  return yaml.load(raw) as Record<string, unknown>;
}

describe('qaPilotConfigSchema', () => {
  it('parses minimal config correctly', () => {
    const result = qaPilotConfigSchema.parse(loadYaml('minimal.yml'));
    expect(result.version).toBe('1');
    expect(result.stack).toBeUndefined();
    expect(result.mode).toBeUndefined();
  });

  it('parses full config correctly', () => {
    const result = qaPilotConfigSchema.parse(loadYaml('full.yml'));
    expect(result.version).toBe('1');
    expect(result.stack).toBe('nextjs');
    expect(result.mode).toBe('full');
    expect(result.ai?.enabled).toBe(true);
    expect(result.ai?.provider).toBe('anthropic');
    expect(result.notifications?.slack?.enabled).toBe(true);
    expect(result.reports?.format).toBe('html');
    expect(result.layers?.skip).toContain('L15');
    expect(result.layers?.warnOnly).toContain('L13');
  });

  it('rejects invalid version type', () => {
    expect(() => qaPilotConfigSchema.parse({ version: 123 })).toThrow();
  });

  it('rejects invalid stack value', () => {
    expect(() => qaPilotConfigSchema.parse({ version: '1', stack: 'invalid-stack' })).toThrow();
  });

  it('rejects invalid layer ID in skip array', () => {
    expect(() =>
      qaPilotConfigSchema.parse({
        version: '1',
        layers: { skip: ['LXXX'] },
      }),
    ).toThrow();
  });

  it('optional fields default to undefined', () => {
    const result = qaPilotConfigSchema.parse({ version: '1' });
    expect(result.mode).toBeUndefined();
    expect(result.stack).toBeUndefined();
    expect(result.layers).toBeUndefined();
    expect(result.ai).toBeUndefined();
    expect(result.build).toBeUndefined();
    expect(result.notifications).toBeUndefined();
    expect(result.reports).toBeUndefined();
  });

  it('parses layer skip array correctly', () => {
    const data = loadYaml('skip-layers.yml');
    const result = qaPilotConfigSchema.parse(data);
    expect(result.layers?.skip).toEqual(['L8', 'L10', 'L11', 'L16']);
  });

  it('parses layer warnOnly array correctly', () => {
    const data = loadYaml('full.yml');
    const result = qaPilotConfigSchema.parse(data);
    expect(result.layers?.warnOnly).toEqual(['L13', 'L14']);
  });

  it('parses custom threshold config', () => {
    const data = loadYaml('full.yml');
    const result = qaPilotConfigSchema.parse(data);
    const l3 = result.layers?.overrides?.L3;
    expect(l3?.threshold).toEqual({ coverage: 80, minTests: 10 });
  });

  it('accepts all valid stack types', () => {
    const stacks = ['nextjs', 'react', 'vue', 'angular', 'flutter', 'python', 'rust', 'java', 'go', 'dotnet'];
    for (const stack of stacks) {
      const result = qaPilotConfigSchema.parse({ version: '1', stack });
      expect(result.stack).toBe(stack);
    }
  });

  it('accepts all valid pipeline modes', () => {
    for (const mode of ['fast', 'full', 'pre-release']) {
      const result = qaPilotConfigSchema.parse({ version: '1', mode });
      expect(result.mode).toBe(mode);
    }
  });

  it('rejects invalid pipeline mode', () => {
    expect(() => qaPilotConfigSchema.parse({ version: '1', mode: 'turbo' })).toThrow();
  });

  it('rejects negative timeout in layer override', () => {
    expect(() =>
      qaPilotConfigSchema.parse({
        version: '1',
        layers: { overrides: { L1: { timeout: -100 } } },
      }),
    ).toThrow();
  });

  it('rejects temperature out of range', () => {
    expect(() =>
      qaPilotConfigSchema.parse({
        version: '1',
        ai: { temperature: 5.0 },
      }),
    ).toThrow();
  });

  it('parses custom commands config', () => {
    const data = loadYaml('custom-commands.yml');
    const result = qaPilotConfigSchema.parse(data);
    expect(result.layers?.overrides?.L1?.command).toBe('npx biome check .');
    expect(result.layers?.overrides?.L3?.command).toBe('npx jest --ci --coverage');
    expect(result.layers?.overrides?.L9?.command).toBe('npx cypress run');
  });
});
