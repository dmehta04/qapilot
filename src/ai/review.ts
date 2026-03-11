import { aiChat } from './client.js';
import { codeReviewPrompt } from './prompts.js';
import type { QAPilotConfig } from '../config/types.js';
import { logger } from '../utils/logger.js';

export async function reviewCode(
  cwd: string,
  config: QAPilotConfig,
): Promise<string> {
  const { getChangedFiles } = await import('../utils/git.js');
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const changedFiles = await getChangedFiles(cwd);
  if (changedFiles.length === 0) {
    return 'No changes found to review.';
  }

  const diffs: string[] = [];
  for (const file of changedFiles.slice(0, 20)) {
    try {
      const content = await readFile(join(cwd, file), 'utf-8');
      diffs.push(`// ${file}\n${content}`);
    } catch {
      // skip unreadable
    }
  }

  if (diffs.length === 0) {
    return 'No readable files found to review.';
  }

  const stack = config.stack ?? 'unknown';
  const context = `${stack} (mode: ${config.mode ?? 'full'})`;

  const combinedDiff = diffs.join('\n\n');
  const truncated = combinedDiff.length > 15_000
    ? combinedDiff.slice(0, 15_000) + '\n... [truncated]'
    : combinedDiff;

  try {
    return await aiChat(
      'You are a senior code reviewer with expertise in security, performance, and best practices.',
      codeReviewPrompt(truncated, context),
      { maxTokens: 4096 },
    );
  } catch (err) {
    logger.error(`Code review failed: ${err instanceof Error ? err.message : String(err)}`);
    return 'Code review failed due to an error.';
  }
}
