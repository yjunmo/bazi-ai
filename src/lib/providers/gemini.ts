import type { Provider, ProviderInfo, StreamChatOptions } from './types';
import { resolveBaseURL } from './types';
import { iterSSE, readErrorText } from './sse';

export const geminiInfo: ProviderInfo = {
  id: 'gemini',
  name: 'Google Gemini',
  defaultBaseURL: 'https://generativelanguage.googleapis.com',
  devProxyPath: '/api/gemini',
  defaultModel: 'gemini-3.1-flash-lite',
  knownModels: [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
  ],
  apiKeyLink: 'https://aistudio.google.com/apikey',
  note: '默认 gemini-3.1-flash-lite（性价比高）。复杂解读可改 gemini-3.1-pro-preview。',
};

export const geminiProvider: Provider = {
  info: geminiInfo,
  async *streamChat(opts: StreamChatOptions): AsyncGenerator<string, void, void> {
    const base = resolveBaseURL(geminiInfo, opts.baseURL);
    const url = `${base}/v1beta/models/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(opts.apiKey)}`;

    const contents = opts.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      systemInstruction: { role: 'user', parts: [{ text: opts.system }] },
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    });

    if (!res.ok) {
      throw new Error(`[Gemini] ${res.status} ${await readErrorText(res)}`);
    }

    for await (const evt of iterSSE(res, opts.signal)) {
      if (!evt.data) continue;
      try {
        const json = JSON.parse(evt.data);
        const parts = json?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p?.text === 'string' && p.text.length > 0) {
              yield p.text;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  },
};
