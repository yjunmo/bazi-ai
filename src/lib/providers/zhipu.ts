import type { Provider, ProviderInfo, StreamChatOptions } from './types';
import { resolveBaseURL } from './types';
import { iterSSE, readErrorText } from './sse';

/**
 * 智谱 GLM-4 chat/completions：路径与 OpenAI 略有不同（/api/paas/v4/chat/completions），
 * 协议与 OpenAI 兼容，鉴权直接 Bearer <APIKey>（新版控制台直接给的 Key 即可，无需自行签 JWT）。
 */
export const zhipuInfo: ProviderInfo = {
  id: 'zhipu',
  name: '智谱 GLM',
  defaultBaseURL: 'https://open.bigmodel.cn',
  devProxyPath: '/api/zhipu',
  defaultModel: 'glm-4-plus',
  knownModels: ['glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4-long'],
  apiKeyLink: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
  note: '直接使用控制台 API Key 作 Bearer 鉴权即可。',
};

export const zhipuProvider: Provider = {
  info: zhipuInfo,
  async *streamChat(opts: StreamChatOptions): AsyncGenerator<string, void, void> {
    const base = resolveBaseURL(zhipuInfo, opts.baseURL);
    const url = `${base}/api/paas/v4/chat/completions`;

    const body = {
      model: opts.model,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: 'system', content: opts.system },
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });

    if (!res.ok) {
      throw new Error(`[智谱] ${res.status} ${await readErrorText(res)}`);
    }

    for await (const evt of iterSSE(res, opts.signal)) {
      if (!evt.data || evt.data === '[DONE]') continue;
      try {
        const json = JSON.parse(evt.data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          yield delta;
        }
      } catch {
        // ignore
      }
    }
  },
};
