import type { Provider, ProviderInfo, StreamChatOptions } from './types';
import { resolveBaseURL } from './types';
import { iterSSE, readErrorText } from './sse';

export const anthropicInfo: ProviderInfo = {
  id: 'anthropic',
  name: 'Anthropic Claude',
  defaultBaseURL: 'https://api.anthropic.com',
  devProxyPath: '/api/anthropic',
  defaultModel: 'claude-sonnet-4-5',
  knownModels: [
    'claude-sonnet-4-5',
    'claude-opus-4-5',
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
  ],
  apiKeyLink: 'https://console.anthropic.com/settings/keys',
  note: '浏览器直连需要打开 dangerous-direct-browser-access。',
};

export const anthropicProvider: Provider = {
  info: anthropicInfo,
  async *streamChat(opts: StreamChatOptions): AsyncGenerator<string, void, void> {
    const base = resolveBaseURL(anthropicInfo, opts.baseURL);
    const url = `${base}/v1/messages`;

    const body = {
      model: opts.model,
      stream: true,
      max_tokens: 4096,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });

    if (!res.ok) {
      throw new Error(`[Anthropic] ${res.status} ${await readErrorText(res)}`);
    }

    for await (const evt of iterSSE(res, opts.signal)) {
      if (!evt.data) continue;
      try {
        const json = JSON.parse(evt.data);
        // content_block_delta: { delta: { type: 'text_delta', text: '...' } }
        if (json?.type === 'content_block_delta' && json?.delta?.type === 'text_delta') {
          const text = json.delta.text;
          if (typeof text === 'string' && text.length > 0) {
            yield text;
          }
        } else if (json?.type === 'message_stop') {
          return;
        } else if (json?.type === 'error') {
          throw new Error(`[Anthropic] ${json.error?.message ?? 'unknown error'}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('[Anthropic]')) throw e;
      }
    }
  },
};
