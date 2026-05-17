import type { ProviderId } from './providers';
import type { BaziChart } from './bazi';
import type { ChatMessage } from './providers';

const NS = 'bazi-ai/v1';

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface AppSettings {
  activeProvider: ProviderId;
  temperature: number;
  customSystemPrompt?: string;
  providers: Partial<Record<ProviderId, ProviderConfig>>;
}

export interface SessionRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  chart: BaziChart;
  messages: ChatMessage[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'deepseek',
  temperature: 0.7,
  providers: {},
};

function k(suffix: string): string {
  return `${NS}/${suffix}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 满或被禁用：忽略
  }
}

export const storage = {
  loadSettings(): AppSettings {
    return readJSON<AppSettings>(k('settings'), DEFAULT_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    writeJSON(k('settings'), settings);
  },

  loadSessions(): SessionRecord[] {
    return readJSON<SessionRecord[]>(k('sessions'), []);
  },
  saveSessions(sessions: SessionRecord[]): void {
    writeJSON(k('sessions'), sessions);
  },

  loadCurrentId(): string | null {
    return localStorage.getItem(k('current')) || null;
  },
  saveCurrentId(id: string | null): void {
    if (id === null) localStorage.removeItem(k('current'));
    else localStorage.setItem(k('current'), id);
  },

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NS)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  },
};

export function newSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
