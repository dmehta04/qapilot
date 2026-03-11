export function testGenPrompt(
  sourceCode: string,
  testFramework: string,
  layerType: string,
): string {
  return `You are writing ${layerType} tests using ${testFramework}.

Given this source code, generate comprehensive test cases. Cover all exported functions, edge cases, and error paths.

Return ONLY the test file content (valid ${testFramework} code). No explanations.

Source code:
\`\`\`
${sourceCode}
\`\`\``;
}

export function autoFixPrompt(
  failureOutput: string,
  sourceFiles: string[],
  stack: string,
): string {
  return `You are fixing a test/build failure in a ${stack} project.

Failure output:
\`\`\`
${failureOutput}
\`\`\`

Relevant source files:
${sourceFiles.map((f) => `\`\`\`\n${f}\n\`\`\``).join('\n\n')}

Provide the minimal fix. Return a JSON array of objects with:
- "file": relative file path
- "search": exact string to find
- "replace": replacement string

Return ONLY the JSON array. No explanations.`;
}

export function codeReviewPrompt(diff: string, projectContext: string): string {
  return `You are reviewing code changes for a ${projectContext} project.

Review this diff for:
1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. Missing error handling
5. Type safety issues

Git diff:
\`\`\`diff
${diff}
\`\`\`

Return a markdown review with severity ratings (critical/warning/info) for each finding. Be concise.`;
}

export function bugDiscoveryPrompt(sourceCode: string, context: string): string {
  return `Analyze this ${context} code for potential bugs, race conditions, edge cases, and security issues.

\`\`\`
${sourceCode}
\`\`\`

Return findings as a markdown list with severity (critical/high/medium/low) and a brief explanation for each. Be concise and focus on real issues.`;
}
