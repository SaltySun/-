import { useGlobalStore } from "@/store/global";

const useMujianOpenAPI = () => {
  const { baseURL, apiKey, modelId } = useGlobalStore();
  return {
    query: (query: string) => queryMujianOpenAPI(baseURL, apiKey, query, modelId),
  };
};

async function queryMujianOpenAPI(baseURL: string, apiKey: string, query: string, modelId: string) {
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        messages: [
          { role: 'system', content: '这里是系统提示词' },
          { role: 'user', content: query }
        ]
      })
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

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
        // incomplete JSON until next chunk; caller should only pass full lines
      }
    };

    const flushLines = (flushAll: boolean) => {
      // SSE: one logical line per \n; last segment may be incomplete until next read
      const lines = buffer.split(/\r?\n/);
      buffer = flushAll ? "" : (lines.pop() ?? "");
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

export { useMujianOpenAPI };