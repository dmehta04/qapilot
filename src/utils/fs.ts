import { readFile as nodeReadFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(path: string): Promise<string> {
  return nodeReadFile(path, 'utf-8');
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path);
  return JSON.parse(content) as T;
}

export async function readYaml<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path);
  return yaml.load(content) as T;
}

export async function findUp(filename: string, from: string): Promise<string | null> {
  let current = from;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = join(current, filename);
    if (await fileExists(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
