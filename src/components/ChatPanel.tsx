import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { getProvider, getProviderInfo } from '../lib/providers';
import type { ChatMessage } from '../lib/providers';
import { buildFirstUserMessage, DEFAULT_SYSTEM_PROMPT } from '../lib/prompt';
import PresetQuestions from './PresetQuestions';
import type { BaziChart } from '../lib/bazi';

interface Props {
  chart: BaziChart;
  messages: ChatMessage[];
  sessionId: string;
  onUpdateMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onOpenSettings: () => void;
}

export default function ChatPanel({
  chart,
  messages,
  sessionId,
  onUpdateMessages,
  onOpenSettings,
}: Props) {
  const settings = useStore((s) => s.settings);
  const isStreaming = useStore((s) => s.isStreaming);
  const streamingMessage = useStore((s) => s.streamingMessage);
  const setStreaming = useStore((s) => s.setStreaming);
  const appendStreaming = useStore((s) => s.appendStreaming);
  const resetStreaming = useStore((s) => s.resetStreaming);

  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const providerInfo = getProviderInfo(settings.activeProvider);
  const providerCfg = settings.providers[settings.activeProvider];
  const apiKey = providerCfg?.apiKey ?? '';
  const baseURL = providerCfg?.baseURL;
  const model = providerCfg?.model || providerInfo.defaultModel;
  const keyReady = apiKey.trim().length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  function getLatestMessages(): ChatMessage[] {
    const s = useStore.getState().sessions.find((x) => x.id === sessionId);
    return s?.messages ?? [];
  }

  async function send(rawQuestion: string) {
    if (!rawQuestion.trim() || isStreaming) return;
    if (!keyReady) {
      onOpenSettings();
      return;
    }

    // 取最新 store 中的消息，避免 retry / 连发场景下闭包旧值的问题
    const baseMessages = getLatestMessages();
    const isFirst = baseMessages.length === 0;
    const userContent = isFirst
      ? buildFirstUserMessage(chart, rawQuestion.trim())
      : rawQuestion.trim();

    const userMsg: ChatMessage = { role: 'user', content: userContent };
    onUpdateMessages((prev) => [...prev, userMsg]);
    setInput('');

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    resetStreaming();

    try {
      const provider = getProvider(settings.activeProvider);
      const system = settings.customSystemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
      const stream = provider.streamChat({
        apiKey,
        baseURL,
        model,
        system,
        messages: [...baseMessages, userMsg],
        temperature: settings.temperature,
        signal: controller.signal,
      });

      let assembled = '';
      for await (const chunk of stream) {
        assembled += chunk;
        appendStreaming(chunk);
      }

      onUpdateMessages((prev) => [...prev, { role: 'assistant', content: assembled }]);
    } catch (err) {
      if (controller.signal.aborted) {
        const partial = useStore.getState().streamingMessage;
        if (partial.trim()) {
          onUpdateMessages((prev) => [
            ...prev,
            { role: 'assistant', content: partial + '\n\n_（用户已中止生成）_' },
          ]);
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        onUpdateMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**调用失败**：\n\n\`\`\`\n${msg}\n\`\`\`` },
        ]);
      }
    } finally {
      setStreaming(false);
      resetStreaming();
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function retry() {
    const latest = getLatestMessages();
    if (latest.length === 0) return;
    const last = latest[latest.length - 1];

    if (last.role === 'assistant') {
      const userMsg = latest[latest.length - 2];
      if (userMsg?.role === 'user') {
        const q = extractRawQuestion(userMsg.content);
        onUpdateMessages((prev) => prev.slice(0, -2));
        send(q);
      } else {
        onUpdateMessages((prev) => prev.slice(0, -1));
      }
    } else if (last.role === 'user') {
      const q = extractRawQuestion(last.content);
      onUpdateMessages((prev) => prev.slice(0, -1));
      send(q);
    }
  }

  return (
    <div className="card flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-mo-200 dark:border-mo-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-serif text-zhu-700 dark:text-zhu-300">先生在堂</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded border border-mo-300 dark:border-mo-700 px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
            title="切换模型 / 设置 Key"
          >
            {providerInfo.name} · {model}
          </button>
        </div>
        <div className="text-[10px] text-mo-500 dark:text-mo-400">
          {keyReady ? 'Key 已设置（仅本地）' : '尚未设置 API Key'}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-mo-200 dark:border-mo-700">
        <PresetQuestions disabled={isStreaming || !keyReady} onPick={(q) => send(q)} />
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-sm text-mo-500 dark:text-mo-400 py-10">
            {keyReady
              ? '点击上方任意话题，或直接在下方提问开启咨询。'
              : '请先点击右上角齿轮或顶部模型按钮，设置一个 AI 服务商的 API Key。'}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={visibleContent(m)} />
        ))}

        {isStreaming && streamingMessage && (
          <MessageBubble role="assistant" content={streamingMessage} streaming />
        )}
        {isStreaming && !streamingMessage && (
          <div className="text-xs text-mo-500 dark:text-mo-400">命师沉思中…</div>
        )}
      </div>

      <div className="border-t border-mo-200 dark:border-mo-700 p-3">
        <div className="flex items-end gap-2">
          <textarea
            className="input min-h-[44px] max-h-40 resize-y flex-1"
            placeholder={
              keyReady ? '请描述您的疑问，例如：我今年的财运如何？' : '先在设置中填入 API Key…'
            }
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          {isStreaming ? (
            <button type="button" onClick={stop} className="btn-outline px-4 py-2">
              停止
            </button>
          ) : (
            <>
              {messages.length > 0 && (
                <button type="button" onClick={retry} className="btn-ghost px-3 py-2" title="重新生成">
                  重试
                </button>
              )}
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="btn-primary px-4 py-2"
              >
                发送
              </button>
            </>
          )}
        </div>
        <div className="mt-1.5 text-[10px] text-mo-500 dark:text-mo-400">
          Ctrl/⌘ + Enter 发送 · Key 仅存浏览器本地，直接调用所选官方 API
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ' +
          (isUser
            ? 'bg-zhu-600 text-white rounded-br-md'
            : 'bg-white dark:bg-mo-800 border border-mo-200 dark:border-mo-700 rounded-bl-md')
        }
      >
        {isUser ? (
          <pre className="whitespace-pre-wrap font-sans m-0">{content}</pre>
        ) : (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {streaming && <span className="ml-0.5 inline-block w-1.5 h-4 align-text-bottom bg-zhu-500 animate-pulse" />}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 用户首条消息会注入完整排盘 JSON 给 AI，但显示时只展示问题本身，避免冗长。
 */
function visibleContent(m: ChatMessage): string {
  if (m.role !== 'user') return m.content;
  const marker = '【咨询问题】';
  const idx = m.content.indexOf(marker);
  if (idx < 0) return m.content;
  return m.content.slice(idx + marker.length).trim();
}

function extractRawQuestion(content: string): string {
  return visibleContent({ role: 'user', content });
}
