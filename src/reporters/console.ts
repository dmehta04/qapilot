import type { Reporter, PipelineResult, ExecutionContext } from '../engine/types.js';
import { printPipelineResult } from '../cli/output.js';

export class ConsoleReporter implements Reporter {
  name = 'console';

  async report(result: PipelineResult, _ctx: ExecutionContext): Promise<void> {
    printPipelineResult(result);
  }
}
