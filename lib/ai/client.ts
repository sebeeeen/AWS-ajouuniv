type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              url: string;
            };
          }
      >;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function generateChatCompletion(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const json = (await response.json()) as ChatCompletionResponse;
  return {
    model,
    content: json.choices?.[0]?.message?.content?.trim() ?? ""
  };
}

export async function generateVisionCompletion(params: {
  instruction: string;
  imageDataUrl: string;
}) {
  return generateChatCompletion([
    {
      role: "system",
      content: "이미지에서 텍스트를 정확히 추출하고, 구조화된 JSON만 반환하세요."
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: params.instruction
        },
        {
          type: "image_url",
          image_url: {
            url: params.imageDataUrl
          }
        }
      ]
    }
  ]);
}
