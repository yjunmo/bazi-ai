import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PROVIDER_INFOS } from '../lib/providers';
import type { ProviderId } from '../lib/providers';
import { DEFAULT_SYSTEM_PROMPT } from '../lib/prompt';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setActiveProvider = useStore((s) => s.setActiveProvider);
  const setProviderConfig = useStore((s) => s.setProviderConfig);

  const [activeId, setActiveId] = useState<ProviderId>(settings.activeProvider);
  const [showKey, setShowKey] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  useEffect(() => {
    if (open) setActiveId(settings.activeProvider);
  }, [open, settings.activeProvider]);

  if (!open) return null;

  const info = PROVIDER_INFOS.find((p) => p.id === activeId)!;
  const cfg = settings.providers[activeId] ?? { apiKey: '' };
  const currentModel = cfg.model || info.defaultModel;

  function setKey(v: string) {
    setProviderConfig(activeId, { apiKey: v });
  }
  function setBase(v: string) {
    setProviderConfig(activeId, { baseURL: v });
  }
  function setModel(v: string) {
    setProviderConfig(activeId, { model: v });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-mo-200 dark:border-mo-700">
          <h2 className="font-serif text-lg font-semibold text-zhu-700 dark:text-zhu-300">
            模型与设置
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            完成
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          <section>
            <div className="label mb-2">AI 服务商</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDER_INFOS.map((p) => {
                const active = p.id === activeId;
                const hasKey = !!settings.providers[p.id]?.apiKey;
                const isCurrent = settings.activeProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveId(p.id)}
                    className={
                      'relative rounded-lg border p-2.5 text-left transition ' +
                      (active
                        ? 'border-zhu-500 bg-zhu-50 dark:bg-zhu-900/30'
                        : 'border-mo-200 dark:border-mo-700 hover:bg-black/5 dark:hover:bg-white/10')
                    }
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[10px] text-mo-500 dark:text-mo-400 mt-0.5 truncate">
                      {p.defaultModel}
                    </div>
                    <div className="absolute right-1.5 top-1.5 flex gap-1">
                      {hasKey && (
                        <span className="rounded bg-emerald-500/20 px-1 text-[9px] text-emerald-700 dark:text-emerald-300">
                          有Key
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded bg-zhu-600 px-1 text-[9px] text-white">
                          使用中
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {settings.activeProvider !== activeId && (
              <button
                type="button"
                onClick={() => setActiveProvider(activeId)}
                className="btn-outline mt-3 text-xs"
              >
                设为当前使用
              </button>
            )}
          </section>

          <section className="space-y-3 rounded-lg border border-mo-200 dark:border-mo-700 p-4">
            <div className="flex items-center justify-between">
              <div className="font-serif text-base text-zhu-700 dark:text-zhu-300">
                {info.name} 配置
              </div>
              <a
                href={info.apiKeyLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zhu-600 dark:text-zhu-300 hover:underline"
              >
                获取 API Key →
              </a>
            </div>
            {info.note && (
              <div className="rounded bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                {info.note}
              </div>
            )}

            <div>
              <label className="label">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="input flex-1"
                  value={cfg.apiKey}
                  placeholder="sk-..."
                  onChange={(e) => setKey(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-outline px-2.5 text-xs"
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
              <div className="text-[10px] text-mo-500 dark:text-mo-400 mt-1">
                Key 只会写入浏览器 localStorage，向 {info.defaultBaseURL} 直发请求，不经任何第三方。
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">模型</label>
                <input
                  className="input"
                  list={`models-${info.id}`}
                  value={currentModel}
                  onChange={(e) => setModel(e.target.value)}
                />
                <datalist id={`models-${info.id}`}>
                  {info.knownModels.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">baseURL（可留空使用默认/开发代理）</label>
                <input
                  className="input"
                  placeholder={info.defaultBaseURL}
                  value={cfg.baseURL ?? ''}
                  onChange={(e) => setBase(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-mo-200 dark:border-mo-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-serif text-base text-zhu-700 dark:text-zhu-300">
                  生成参数
                </div>
                <div className="text-[10px] text-mo-500 dark:text-mo-400">
                  通用 temperature
                </div>
              </div>
              <div className="text-sm tabular-nums w-12 text-right">
                {settings.temperature.toFixed(1)}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => setSettings({ temperature: Number(e.target.value) })}
              className="w-full"
            />
          </section>

          <section className="rounded-lg border border-mo-200 dark:border-mo-700 p-4">
            <button
              type="button"
              onClick={() => setShowPromptEditor((v) => !v)}
              className="text-sm font-serif text-zhu-700 dark:text-zhu-300"
            >
              {showPromptEditor ? '收起 ▴' : '自定义系统提示词 ▾'}
            </button>
            {showPromptEditor && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="input min-h-[180px] font-mono text-xs"
                  placeholder={DEFAULT_SYSTEM_PROMPT}
                  value={settings.customSystemPrompt ?? ''}
                  onChange={(e) => setSettings({ customSystemPrompt: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-outline text-xs"
                    onClick={() => setSettings({ customSystemPrompt: DEFAULT_SYSTEM_PROMPT })}
                  >
                    填入默认
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => setSettings({ customSystemPrompt: undefined })}
                  >
                    恢复默认（清空覆盖）
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-900/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-semibold">关于安全</div>
            <p>
              本应用是纯前端 BYOK 工具：你的 API Key 仅保存在当前浏览器的 localStorage，所有 AI 请求由你的浏览器直接发往你选择的服务商。请勿在公共/共享设备上输入 Key，并定期到服务商后台轮换。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
