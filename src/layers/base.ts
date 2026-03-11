import type { LayerID, StackType } from '../config/types.js';
import type { LayerResult, LayerMetrics } from '../engine/types.js';
import type { PipelineContext } from '../engine/context.js';
import { exec } from '../utils/exec.js';
import { logger } from '../utils/logger.js';

export type LayerTier = 'fast' | 'pr' | 'release';

export abstract class BaseLayer {
  abstract readonly id: LayerID;
  abstract readonly name: string;
  abstract readonly defaultTier: LayerTier;
  abstract readonly applicableStacks: StackType[] | 'all';

  isApplicable(stack: StackType): boolean {
    if (this.applicableStacks === 'all') return true;
    return this.applicableStacks.includes(stack);
  }

  async execute(ctx: PipelineContext): Promise<LayerResult> {
    if (!ctx.isLayerEnabled(this.id)) {
      return this.skipped(ctx, 'disabled in config');
    }

    if (!this.isApplicable(ctx.detectedStack.stack)) {
      return this.skipped(ctx, `not applicable for ${ctx.detectedStack.stack}`);
    }

    const command = ctx.getLayerCommand(this.id);
    if (!command) {
      return this.skipped(ctx, 'no command configured');
    }

    logger.info(`[${this.id}] ${this.name}: ${command}`);
    const timeout = ctx.getLayerTimeout(this.id);

    try {
      // Commands are from config or hardcoded defaults — not user input.
      // Shell execution is intentional to support pipes/redirects in QA commands.
      const result = await exec(command, { cwd: ctx.cwd, timeout });
      const metrics = this.parseMetrics(result.stdout, result.stderr);
      const warnOnly = ctx.isWarnOnly(this.id);
      const failed = result.exitCode !== 0;

      let status: LayerResult['status'] = 'pass';
      if (failed && warnOnly) status = 'warn';
      else if (failed) status = 'fail';

      const layerResult: LayerResult = {
        layer: this.id,
        name: this.name,
        status,
        duration: result.duration,
        command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        metrics,
      };

      logger.info(`[${this.id}] ${status.toUpperCase()} (${result.duration}ms)`);
      return layerResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[${this.id}] Error: ${message}`);
      return {
        layer: this.id,
        name: this.name,
        status: ctx.isWarnOnly(this.id) ? 'warn' : 'fail',
        duration: 0,
        command,
        exitCode: 1,
        stdout: '',
        stderr: message,
        error: message,
      };
    }
  }

  protected parseMetrics(_stdout: string, _stderr: string): LayerMetrics | undefined {
    return undefined;
  }

  private skipped(ctx: PipelineContext, reason: string): LayerResult {
    logger.debug(`[${this.id}] Skipped: ${reason}`);
    return {
      layer: this.id,
      name: this.name,
      status: 'skip',
      duration: 0,
      command: ctx.getLayerCommand(this.id) ?? '',
      exitCode: 0,
      stdout: '',
      stderr: '',
      skippedReason: reason,
    };
  }
}
