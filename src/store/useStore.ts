import { create } from 'zustand';
import type { BaziChart } from '../lib/bazi';
import type { ChatMessage, ProviderId } from '../lib/providers';
import {
  storage,
  type AppSettings,
  type SessionRecord,
  type ProviderConfig,
  DEFAULT_SETTINGS,
  newSessionId,
} from '../lib/storage';

interface State {
  settings: AppSettings;
  sessions: SessionRecord[];
  currentId: string | null;
  isStreaming: boolean;
  streamingMessage: string;

  setSettings: (patch: Partial<AppSettings>) => void;
  setProviderConfig: (id: ProviderId, patch: Partial<ProviderConfig>) => void;
  setActiveProvider: (id: ProviderId) => void;

  createSession: (chart: BaziChart) => string;
  selectSession: (id: string) => void;
  removeSession: (id: string) => void;
  updateCurrentMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  renameSession: (id: string, title: string) => void;

  setStreaming: (on: boolean) => void;
  appendStreaming: (chunk: string) => void;
  resetStreaming: () => void;

  hydrated: boolean;
  hydrate: () => void;
}

export const useStore = create<State>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  sessions: [],
  currentId: null,
  isStreaming: false,
  streamingMessage: '',
  hydrated: false,

  hydrate: () => {
    const settings = storage.loadSettings();
    const sessions = storage.loadSessions();
    const currentId = storage.loadCurrentId();
    set({ settings, sessions, currentId, hydrated: true });
  },

  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    storage.saveSettings(settings);
    set({ settings });
  },

  setProviderConfig: (id, patch) => {
    const settings = get().settings;
    const current = settings.providers[id] ?? { apiKey: '' };
    const next: AppSettings = {
      ...settings,
      providers: { ...settings.providers, [id]: { ...current, ...patch } },
    };
    storage.saveSettings(next);
    set({ settings: next });
  },

  setActiveProvider: (id) => {
    const next = { ...get().settings, activeProvider: id };
    storage.saveSettings(next);
    set({ settings: next });
  },

  createSession: (chart) => {
    const id = newSessionId();
    const title = buildSessionTitle(chart);
    const session: SessionRecord = {
      id,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chart,
      messages: [],
    };
    const sessions = [session, ...get().sessions];
    storage.saveSessions(sessions);
    storage.saveCurrentId(id);
    set({ sessions, currentId: id });
    return id;
  },

  selectSession: (id) => {
    storage.saveCurrentId(id);
    set({ currentId: id });
  },

  removeSession: (id) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    storage.saveSessions(sessions);
    let currentId = get().currentId;
    if (currentId === id) {
      currentId = sessions[0]?.id ?? null;
      storage.saveCurrentId(currentId);
    }
    set({ sessions, currentId });
  },

  updateCurrentMessages: (updater) => {
    const { sessions, currentId } = get();
    if (!currentId) return;
    const next = sessions.map((s) => {
      if (s.id !== currentId) return s;
      return { ...s, messages: updater(s.messages), updatedAt: Date.now() };
    });
    storage.saveSessions(next);
    set({ sessions: next });
  },

  renameSession: (id, title) => {
    const next = get().sessions.map((s) => (s.id === id ? { ...s, title } : s));
    storage.saveSessions(next);
    set({ sessions: next });
  },

  setStreaming: (on) => set({ isStreaming: on }),
  appendStreaming: (chunk) =>
    set((s) => ({ streamingMessage: s.streamingMessage + chunk })),
  resetStreaming: () => set({ streamingMessage: '' }),
}));

function buildSessionTitle(chart: BaziChart): string {
  const g = chart.input.gender === 'male' ? '乾造' : '坤造';
  return `${g} · ${chart.ganZhiYMD}`;
}

export function selectCurrentSession(state: State): SessionRecord | undefined {
  return state.sessions.find((s) => s.id === state.currentId);
}
