import type { Provider, ProviderId, ProviderInfo } from './types';
import {
  makeOpenAICompatibleProvider,
  openaiInfo,
  deepseekInfo,
  moonshotInfo,
  qwenInfo,
} from './openai';
import { anthropicProvider, anthropicInfo } from './anthropic';
import { geminiProvider, geminiInfo } from './gemini';
import { zhipuProvider, zhipuInfo } from './zhipu';

const PROVIDERS: Record<ProviderId, Provider> = {
  openai: makeOpenAICompatibleProvider(openaiInfo),
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  deepseek: makeOpenAICompatibleProvider(deepseekInfo),
  zhipu: zhipuProvider,
  moonshot: makeOpenAICompatibleProvider(moonshotInfo),
  qwen: makeOpenAICompatibleProvider(qwenInfo),
};

export const PROVIDER_INFOS: ProviderInfo[] = [
  openaiInfo,
  anthropicInfo,
  geminiInfo,
  deepseekInfo,
  zhipuInfo,
  moonshotInfo,
  qwenInfo,
];

export function getProvider(id: ProviderId): Provider {
  return PROVIDERS[id];
}

export function getProviderInfo(id: ProviderId): ProviderInfo {
  return PROVIDERS[id].info;
}

export type { Provider, ProviderId, ProviderInfo } from './types';
export type { ChatMessage } from './types';
