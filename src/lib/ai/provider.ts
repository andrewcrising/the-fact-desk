export interface AiProviderMessage {
  role: "system" | "user";
  content: string;
}

export interface AiProvider {
  generateJson(messages: AiProviderMessage[]): Promise<string>;
}

export function isAiDraftAssistConfigured(): boolean {
  return (
    process.env.AI_DRAFT_ASSIST_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

export class OpenAiEditorialProvider implements AiProvider {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  ) {}

  async generateJson(messages: AiProviderMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI provider request failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("AI provider returned an empty response.");
    }

    return content;
  }
}

export function getEditorialAiProvider(): AiProvider {
  return new OpenAiEditorialProvider();
}
