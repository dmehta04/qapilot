import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { aiChat } from './client.js';
import { autoFixPrompt } from './prompts.js';
import type { LayerResult, ExecutionContext } from '../engine/types.js';
import { logger } from '../utils/logger.js';

interface FixPatch {
  file: string;
  search: string;
  replace: string;
}

export async function autoFix(
  failedResult: LayerResult,
  ctx: ExecutionContext,
): Promise<{ fixed: boolean; diff: string }> {
  if (failedResult.status !== 'fail') {
    return { fixed: false, diff: '' };
  }

  const failureOutput = [failedResult.stdout, failedResult.stderr].filter(Boolean).join('\n');
  if (!failureOutput.trim()) {
    return { fixed: false, diff: '' };
  }

  const sourceContents: string[] = [];
  try {
    const { getChangedFiles } = await import('../utils/git.js');
    const changedFiles = await getChangedFiles(ctx.cwd);
    for (const f of changedFiles.slice(0, 10)) {
      try {
        const content = readFileSync(join(ctx.cwd, f), 'utf-8');
        sourceContents.push(`// ${f}\n${content}`);
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    logger.warn('Could not get changed files for auto-fix context');
  }

  if (sourceContents.length === 0) {
    return { fixed: false, diff: '' };
  }

  const stack = ctx.config.stack ?? 'unknown';
  const response = await aiChat(
    'You are an expert debugger. Fix the failing test or build step with minimal changes.',
    autoFixPrompt(failureOutput, sourceContents, stack),
    { maxTokens: 4096 },
  );

  let patches: FixPatch[];
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { fixed: false, diff: '' };
    patches = JSON.parse(jsonMatch[0]) as FixPatch[];
  } catch {
    logger.warn('Could not parse AI fix response');
    return { fixed: false, diff: '' };
  }

  const diffParts: string[] = [];

  for (const patch of patches) {
    const filePath = join(ctx.cwd, patch.file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.includes(patch.search)) {
        logger.warn(`Search string not found in ${patch.file}, skipping patch`);
        continue;
      }
      const updated = content.replace(patch.search, patch.replace);
      writeFileSync(filePath, updated, 'utf-8');
      diffParts.push(`--- ${patch.file}\n-${patch.search}\n+${patch.replace}`);
    } catch (err) {
      logger.warn(`Failed to apply patch to ${patch.file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (diffParts.length === 0) return { fixed: false, diff: '' };

  // Re-verify by running the failed command
  const command = failedResult.command;
  if (!command) return { fixed: false, diff: diffParts.join('\n') };

  try {
    const { exec: runCmd } = await import('../utils/exec.js');
    // Command comes from config, not user input
    const verifyResult = await runCmd(command, { cwd: ctx.cwd, timeout: 120_000 });
    const fixed = verifyResult.exitCode === 0;

    if (fixed) {
      logger.info('Auto-fix succeeded');
    } else {
      logger.warn('Auto-fix applied but verification still failed');
    }

    return { fixed, diff: diffParts.join('\n') };
  } catch {
    return { fixed: false, diff: diffParts.join('\n') };
  }
}
