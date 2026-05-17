import type { Provider, ProviderInfo, StreamChatOptions } from './types';
import { resolveBaseURL } from './types';
import { iterSSE, readErrorText } from './sse';

export const geminiInfo: ProviderInfo = {
  id: 'gemini',
  name: 'Google Gemini',
  defaultBaseURL: 'https://generativelanguage.googleapis.com',
  devProxyPath: '/api/gemini',
  defaultModel: 'gemini-2.5-flash',
  knownModels: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
  apiKeyLink: 'https://aistudio.google.com/apikey',
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
