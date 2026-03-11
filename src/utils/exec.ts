import { spawn } from 'node:child_process';

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export function exec(
  command: string,
  options?: { cwd?: string; timeout?: number; env?: Record<string, string> }
): Promise<ExecResult> {
  const cwd = options?.cwd ?? process.cwd();
  const timeout = options?.timeout ?? 120_000;
  const env = options?.env ? { ...process.env, ...options.env } : process.env;

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const child = spawn('sh', ['-c', command], { cwd, env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - start,
      });
    });
  });
}
