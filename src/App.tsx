import { useEffect, useMemo, useState } from 'react';
import BirthForm from './components/BirthForm';
import BaziCard from './components/BaziCard';
import ChatPanel from './components/ChatPanel';
import SettingsDialog from './components/SettingsDialog';
import { useStore, selectCurrentSession } from './store/useStore';
import type { BaziChart } from './lib/bazi';

export default function App() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const sessions = useStore((s) => s.sessions);
  const currentId = useStore((s) => s.currentId);
  const createSession = useStore((s) => s.createSession);
  const selectSession = useStore((s) => s.selectSession);
  const removeSession = useStore((s) => s.removeSession);
  const updateCurrentMessages = useStore((s) => s.updateCurrentMessages);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('bazi-ai/v1/theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const current = useStore(selectCurrentSession);
  const chart: BaziChart | undefined = current?.chart;

  // 首次启动如果未设置任何 Key，提示进入设置
  const hasAnyKey = useMemo(() => {
    const settings = useStore.getState().settings;
    return Object.values(settings.providers).some((c) => !!c?.apiKey);
  }, [hydrated]);

  function handleNewChart(c: BaziChart) {
    createSession(c);
    if (!hasAnyKey) setSettingsOpen(true);
  }

  if (!hydrated) {
    return (
      <div className="h-full grid place-items-center text-mo-500">
        载入中…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen((v) => !v)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main className="flex-1 min-h-0 px-3 md:px-6 pb-3 md:pb-6 pt-3">
        <div className="mx-auto h-full max-w-7xl grid gap-4 grid-cols-1 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-3 lg:overflow-y-auto lg:max-h-full lg:pr-1">
            <BirthForm onSubmit={handleNewChart} />
            {chart && <BaziCard chart={chart} />}
            <Disclaimer />
          </aside>

          <section className="min-h-[60vh] lg:min-h-0 lg:max-h-full">
            {chart && current ? (
              <ChatPanel
                key={current.id}
                sessionId={current.id}
                chart={chart}
                messages={current.messages}
                onUpdateMessages={updateCurrentMessages}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : (
              <EmptyChatHint onOpenSettings={() => setSettingsOpen(true)} />
            )}
          </section>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        currentId={currentId}
        onSelect={(id) => {
          selectSession(id);
          setHistoryOpen(false);
        }}
        onRemove={removeSession}
      />
    </div>
  );
}

function Header({
  onOpenSettings,
  onOpenHistory,
  theme,
  onToggleTheme,
}: {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  return (
    <header className="border-b border-mo-200 dark:border-mo-800 bg-white/70 dark:bg-mo-900/70 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-xuan text-zhu-400 font-serif text-lg">
            阳
          </span>
          <div>
            <div className="font-serif text-base font-semibold leading-none">
              羡阳 · AI 八字
            </div>
            <div className="text-[10px] text-mo-500 dark:text-mo-400 mt-0.5">
              自动排盘 · 多模型对话 · 自带 API Key
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onOpenHistory} className="btn-ghost text-xs">
            历史
          </button>
          <button type="button" onClick={onToggleTheme} className="btn-ghost text-xs" title="切换主题">
            {theme === 'dark' ? '☾' : '☀'}
          </button>
          <button type="button" onClick={onOpenSettings} className="btn-outline text-xs">
            设置
          </button>
        </div>
      </div>
    </header>
  );
}

function EmptyChatHint({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="card h-full grid place-items-center text-center p-6">
      <div className="max-w-md space-y-3">
        <h2 className="font-serif text-xl text-zhu-700 dark:text-zhu-300">
          先生有礼，敢问生辰
        </h2>
        <p className="text-sm text-mo-600 dark:text-mo-300 leading-relaxed">
          在左侧录入公历或农历的出生年月日时辰，本工具会本地排出八字、五行、十神、大运，再由你选定的 AI 模型扮演命理师，为你解读咨询。
        </p>
        <div className="text-xs text-mo-500 dark:text-mo-400">
          首次使用请先 <button className="underline hover:text-zhu-600" onClick={onOpenSettings}>设置 API Key</button>。
        </div>
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="text-[11px] leading-relaxed text-mo-500 dark:text-mo-400 px-1">
      本工具内容由 AI 生成，仅供文化娱乐参考，不构成医疗、法律、投资建议。请理性看待命理。
    </div>
  );
}

function HistoryDrawer({
  open,
  onClose,
  sessions,
  currentId,
  onSelect,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  sessions: ReturnType<typeof useStore.getState>['sessions'];
  currentId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white dark:bg-mo-900 shadow-xl border-l border-mo-200 dark:border-mo-700 p-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base text-zhu-700 dark:text-zhu-300">历史排盘</h3>
          <button onClick={onClose} className="btn-ghost text-xs">关闭</button>
        </div>
        {sessions.length === 0 && (
          <div className="text-sm text-mo-500 py-8 text-center">暂无记录</div>
        )}
        <ul className="space-y-2">
          {sessions.map((s) => {
            const active = s.id === currentId;
            return (
              <li
                key={s.id}
                className={
                  'rounded-md border p-2.5 ' +
                  (active
                    ? 'border-zhu-500 bg-zhu-50 dark:bg-zhu-900/30'
                    : 'border-mo-200 dark:border-mo-700 hover:bg-black/5 dark:hover:bg-white/10')
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-serif text-sm font-medium">{s.title}</div>
                    <div className="text-[10px] text-mo-500 dark:text-mo-400 mt-0.5">
                      {new Date(s.updatedAt).toLocaleString()} · {s.messages.length} 轮
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('删除该排盘记录？')) onRemove(s.id);
                    }}
                    className="text-xs text-mo-400 hover:text-red-500"
                    title="删除"
                  >
                    删
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('bazi-ai/v1/theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
