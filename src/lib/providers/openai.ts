import type { Provider, ProviderInfo, StreamChatOptions } from './types';
import { resolveBaseURL } from './types';
import { iterSSE, readErrorText } from './sse';

/**
 * 通用 OpenAI Chat Completions 协议适配器。
 * DeepSeek / Moonshot / Qwen(DashScope 兼容模式) / 智谱（兼容模式）/ 任意 OneAPI 反代 均可复用。
 */
export function makeOpenAICompatibleProvider(info: ProviderInfo): Provider {
  return {
    info,
    async *streamChat(opts: StreamChatOptions): AsyncGenerator<string, void, void> {
      const base = resolveBaseURL(info, opts.baseURL);
      const url = `${base}/v1/chat/completions`;

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
        throw new Error(`[${info.name}] ${res.status} ${await readErrorText(res)}`);
      }

      for await (const evt of iterSSE(res, opts.signal)) {
        if (!evt.data || evt.data === '[DONE]') continue;
        try {
          const json = JSON.parse(evt.data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta;
          }
          const reasoning = json?.choices?.[0]?.delta?.reasoning_content;
          if (typeof reasoning === 'string' && reasoning.length > 0) {
            // DeepSeek-Reasoner 等会先返回 reasoning_content，原样附加便于查看
            yield reasoning;
          }
        } catch {
          // 忽略非 JSON 心跳行
        }
      }
    },
  };
}

export const openaiInfo: ProviderInfo = {
  id: 'openai',
  name: 'OpenAI',
  defaultBaseURL: 'https://api.openai.com',
  devProxyPath: '/api/openai',
  defaultModel: 'gpt-4o-mini',
  knownModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'o3-mini'],
  apiKeyLink: 'https://platform.openai.com/api-keys',
};

export const deepseekInfo: ProviderInfo = {
  id: 'deepseek',
  name: 'DeepSeek',
  defaultBaseURL: 'https://api.deepseek.com',
  devProxyPath: '/api/deepseek',
  defaultModel: 'deepseek-chat',
  knownModels: ['deepseek-chat', 'deepseek-reasoner'],
  apiKeyLink: 'https://platform.deepseek.com/api_keys',
  note: '性价比高，中文能力强，推荐首选。',
};

export const moonshotInfo: ProviderInfo = {
  id: 'moonshot',
  name: 'Moonshot (Kimi)',
  defaultBaseURL: 'https://api.moonshot.cn',
  devProxyPath: '/api/moonshot',
  defaultModel: 'moonshot-v1-8k',
  knownModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k', 'kimi-latest'],
  apiKeyLink: 'https://platform.moonshot.cn/console/api-keys',
};

export const qwenInfo: ProviderInfo = {
  id: 'qwen',
  // 阿里云百炼 DashScope 的 OpenAI 兼容端点
  name: '通义千问 Qwen',
  defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode',
  devProxyPath: '/api/qwen/compatible-mode',
  defaultModel: 'qwen-plus',
  knownModels: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-long', 'qwen2.5-72b-instruct'],
  apiKeyLink: 'https://bailian.console.aliyun.com/?apiKey=1',
  note: '使用 DashScope 的 OpenAI 兼容模式。',
};
