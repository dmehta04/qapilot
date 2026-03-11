import Anthropic from '@anthropic-ai/sdk';

let cachedClient: Anthropic | null = null;

export function createAIClient(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env['QAPILOT_AI_KEY'] ?? process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error('No AI API key found. Set ANTHROPIC_API_KEY or QAPILOT_AI_KEY.');
  }

  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export async function aiChat(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number },
): Promise<string> {
  const client = createAIClient();
  const model = options?.model ?? 'claude-sonnet-4-20250514';
  const maxTokens = options?.maxTokens ?? 4096;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}
