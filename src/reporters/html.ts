import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Reporter, PipelineResult, ExecutionContext } from '../engine/types.js';

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    pass: '#22c55e',
    fail: '#ef4444',
    warn: '#eab308',
    skip: '#6b7280',
  };
  const color = colors[status] ?? '#6b7280';
  return `<span class="badge" style="background:${color}">${status.toUpperCase()}</span>`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function buildMetricsHtml(result: PipelineResult): string {
  const metricsLayers = result.layers.filter((l) => l.metrics);
  if (metricsLayers.length === 0) return '';

  const rows = metricsLayers.map((l) => {
    const m = l.metrics!;
    const parts: string[] = [];
    if (m.coverage !== undefined) parts.push(`Coverage: ${m.coverage}%`);
    if (m.testsRun !== undefined) parts.push(`Tests: ${m.testsRun} run, ${m.testsPassed ?? 0} passed, ${m.testsFailed ?? 0} failed`);
    if (m.vulnerabilities) {
      const v = m.vulnerabilities;
      parts.push(`Vulns: ${v.critical}C ${v.high}H ${v.medium}M ${v.low}L`);
    }
    return `<tr><td>${l.layer}</td><td>${l.name}</td><td>${parts.join(' | ')}</td></tr>`;
  }).join('\n');

  return `
    <h2>Metrics</h2>
    <table>
      <thead><tr><th>ID</th><th>Layer</th><th>Details</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function generateHtml(result: PipelineResult): string {
  const layerRows = result.layers
    .map((l) => `
      <tr>
        <td>${l.layer}</td>
        <td>${l.name}</td>
        <td>${statusBadge(l.status)}</td>
        <td>${formatDuration(l.duration)}</td>
        <td><code>${l.command || '-'}</code></td>
      </tr>`)
    .join('\n');

  const verdictColor = result.status === 'pass' ? '#22c55e' : result.status === 'fail' ? '#ef4444' : '#eab308';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QAPilot Report - ${result.projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 32px; }
    .container { max-width: 960px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #1e293b; }
    .header h1 { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .header h1 span { color: #38bdf8; }
    .meta { color: #94a3b8; font-size: 13px; text-align: right; }
    .verdict { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 14px; color: #0f172a; background: ${verdictColor}; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; text-align: center; }
    .card .value { font-size: 36px; font-weight: 700; line-height: 1; }
    .card .label { font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .card.pass .value { color: #22c55e; }
    .card.fail .value { color: #ef4444; }
    .card.warn .value { color: #eab308; }
    .card.skip .value { color: #6b7280; }
    h2 { font-size: 18px; font-weight: 600; color: #f8fafc; margin: 24px 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px 14px; background: #1e293b; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    td code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff; }
    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1><span>QA</span>Pilot Report</h1>
        <div class="verdict">${result.status.toUpperCase()}</div>
      </div>
      <div class="meta">
        <div><strong>${result.projectName}</strong></div>
        <div>${result.stack} | ${result.mode} mode</div>
        <div>${new Date(result.timestamp).toLocaleString()}</div>
        <div>Duration: ${formatDuration(result.duration)}</div>
      </div>
    </div>

    <div class="cards">
      <div class="card pass"><div class="value">${result.summary.passed}</div><div class="label">Passed</div></div>
      <div class="card fail"><div class="value">${result.summary.failed}</div><div class="label">Failed</div></div>
      <div class="card warn"><div class="value">${result.summary.warned}</div><div class="label">Warned</div></div>
      <div class="card skip"><div class="value">${result.summary.skipped}</div><div class="label">Skipped</div></div>
    </div>

    <h2>Layer Results</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Layer</th><th>Status</th><th>Duration</th><th>Command</th></tr>
      </thead>
      <tbody>
        ${layerRows}
      </tbody>
    </table>

    ${buildMetricsHtml(result)}

    <div class="footer">Generated by QAPilot v0.1.0</div>
  </div>
</body>
</html>`;
}

export class HtmlReporter implements Reporter {
  name = 'html';

  async report(result: PipelineResult, ctx: ExecutionContext): Promise<void> {
    const outputDir = ctx.config.reports?.outputDir ?? join(ctx.cwd, '.qapilot');
    mkdirSync(outputDir, { recursive: true });

    const html = generateHtml(result);
    const filePath = join(outputDir, 'report.html');
    writeFileSync(filePath, html, 'utf-8');

    if (!ctx.quiet) {
      console.log(`  HTML report: ${filePath}`);
    }
  }
}
