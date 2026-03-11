import type { Reporter } from '../engine/types.js';
import { ConsoleReporter } from './console.js';
import { JsonReporter } from './json.js';
import { HtmlReporter } from './html.js';
import { SlackReporter } from './slack.js';
import { GithubReporter } from './github.js';

const REGISTRY: Record<string, () => Reporter> = {
  console: () => new ConsoleReporter(),
  json: () => new JsonReporter(),
  html: () => new HtmlReporter(),
  slack: () => new SlackReporter(),
  github: () => new GithubReporter(),
};

export function getReporters(formats: string[]): Reporter[] {
  return formats
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f in REGISTRY)
    .map((f) => REGISTRY[f]!());
}
