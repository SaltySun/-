// ========================================
// LLM 服务 - OpenAI 兼容 API 流式调用
// ========================================

import { useGlobalStore } from "@/store/global";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  systemPrompt?: string;
  messages?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const useMujianOpenAPI = () => {
  const { baseURL, apiKey, modelId } = useGlobalStore();
  return {
    query: (query: string) => queryMujianOpenAPI(baseURL, apiKey, query, modelId),
    streamChat: (options: StreamOptions) => streamMujianChat(baseURL, apiKey, modelId, options),
  };
};

export { useMujianOpenAPI };

// ------------------------------------------------------------------
// 旧版兼容：单轮查询（仅打印到控制台）
// ------------------------------------------------------------------

async function queryMujianOpenAPI(baseURL: string, apiKey: string, query: string, modelId: string) {
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        messages: [
          { role: "system", content: "这里是系统提示词" },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const parseDataLine = (line: string) => {
      if (!line.startsWith("data: ")) return;
      const payload = line.slice(6).trimStart();
      if (payload === "[DONE]") return;
      try {
        const data = JSON.parse(payload);
        if (data?.choices?.[0]?.delta?.content) {
          console.log("content", data.choices?.[0]?.delta?.content);
        } else {
          console.log("data", data);
        }
      } catch {
        // incomplete JSON until next chunk
      }
    };

    const flushLines = (flushAll: boolean) => {
      const lines = buffer.split(/\r?\n/);
      buffer = flushAll ? "" : lines.pop() ?? "";
      for (const raw of lines) {
        parseDataLine(raw.trimEnd());
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        flushLines(true);
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      flushLines(false);
    }
  } catch (error) {
    console.error("Streaming error:", error);
  }
}

// ------------------------------------------------------------------
// 新版：流式对话生成器
// ------------------------------------------------------------------

async function* streamMujianChat(
  baseURL: string,
  apiKey: string,
  modelId: string,
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const messages: ChatMessage[] = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  if (options.messages) {
    messages.push(...options.messages);
  }

  if (messages.length === 0) {
    throw new Error("No messages provided");
  }

  const body: Record<string, unknown> = {
    model: modelId,
    stream: true,
    messages,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`LLM API error ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseDataLine = (line: string): string | null => {
    if (!line.startsWith("data: ")) return null;
    const payload = line.slice(6).trimStart();
    if (payload === "[DONE]") return null;
    try {
      const data = JSON.parse(payload);
      return data?.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  };

  const flushLines = (flushAll: boolean): string[] => {
    const lines = buffer.split(/\r?\n/);
    buffer = flushAll ? "" : lines.pop() ?? "";
    const chunks: string[] = [];
    for (const raw of lines) {
      const content = parseDataLine(raw.trimEnd());
      if (content) chunks.push(content);
    }
    return chunks;
  };

  try {
    while (true) {
      if (options.signal?.aborted) {
        reader.cancel();
        throw new Error("Aborted");
      }
      const { done, value } = await reader.read();
      if (done) {
        for (const chunk of flushLines(true)) {
          yield chunk;
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      for (const chunk of flushLines(false)) {
        yield chunk;
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return;
    }
    throw err;
  } finally {
    reader.cancel().catch(() => {});
  }
}

// ------------------------------------------------------------------
// 便捷函数：无需 hook 直接调用（传入配置）
// ------------------------------------------------------------------

export async function* streamLLM(options: StreamOptions & { baseURL: string; apiKey: string; modelId: string }) {
  const { baseURL, apiKey, modelId, ...rest } = options;
  yield* streamMujianChat(baseURL, apiKey, modelId, rest);
}
