export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'zhipu'
  | 'moonshot'
  | 'qwen';

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  defaultBaseURL: string;
  devProxyPath: string;
  defaultModel: string;
  knownModels: string[];
  apiKeyLink: string;
  note?: string;
}

export interface StreamChatOptions {
  apiKey: string;
  baseURL?: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  signal?: AbortSignal;
}

export interface Provider {
  info: ProviderInfo;
  streamChat(opts: StreamChatOptions): AsyncIterable<string>;
}

/**
 * 选择运行时实际使用的 baseURL：
 * - 开发环境且用户未自定义 → 走 Vite 代理路径，规避 CORS
 * - 否则走传入的或官方 baseURL
 */
export function resolveBaseURL(info: ProviderInfo, userBaseURL?: string): string {
  if (userBaseURL && userBaseURL.trim().length > 0) {
    return userBaseURL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return info.devProxyPath;
  }
  return info.defaultBaseURL;
}
