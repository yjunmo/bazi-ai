/**
 * 通用 SSE 解析：将 fetch 返回的 ReadableStream 切分为一行行 `data:` 事件。
 * 不区分事件名，调用方按自己的协议格式解析 data 内容。
 */
export async function* iterSSE(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<{ event?: string; data: string }, void, void> {
  if (!response.body) {
    throw new Error('Response has no body');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentEvent: string | undefined;

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => undefined);
        throw new DOMException('Aborted', 'AbortError');
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const rawLine = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        const line = rawLine.replace(/\r$/, '');

        if (line === '') {
          currentEvent = undefined;
          continue;
        }
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          const data = line.slice(5).trimStart();
          yield { event: currentEvent, data };
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }
}

export async function readErrorText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 1000);
  } catch {
    return res.statusText || String(res.status);
  }
}
