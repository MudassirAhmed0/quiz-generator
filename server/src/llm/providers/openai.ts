// server/src/llm/providers/openai.ts
import type { LLMProvider, QuizGenInput } from "../adapter";
import type { GenerateQuizResponse } from "../../schema";
import { GenerateQuizResponseSchema } from "../../schema";

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model = "gpt-4.1-mini"; // nearest strong reasoning capable; falls back if needed
  private chatUrl = "https://api.openai.com/v1/chat/completions";
  private temperature = 0.7;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuiz(input: QuizGenInput): Promise<GenerateQuizResponse> {
    const messagesBase: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ];

    // First attempt
    try {
      const json = await this.callJsonMode(messagesBase);
      const parsed = safeParseJson(json);
      const validated = GenerateQuizResponseSchema.parse(parsed);
      // Ensure we return exactly the requested count (trim if model overshoots)
      if (validated.questions.length !== input.numQuestions) {
        validated.questions = validated.questions.slice(0, input.numQuestions);
      }
      return validated;
    } catch (e) {
      // Retry once with an explicit correction message
      const retryMessages: ChatMessage[] = [
        ...messagesBase,
        {
          role: "user",
          content:
            "You returned invalid JSON previously. Respond again with ONLY valid JSON matching the schema. No backticks, no markdown, no commentary.",
        },
      ];
      const json2 = await this.callJsonMode(retryMessages);
      const parsed2 = safeParseJson(json2);
      const validated2 = GenerateQuizResponseSchema.parse(parsed2);
      if (validated2.questions.length !== input.numQuestions) {
        validated2.questions = validated2.questions.slice(
          0,
          input.numQuestions
        );
      }
      return validated2;
    }
  }

  private async callJsonMode(messages: ChatMessage[]): Promise<string> {
    const body = {
      model: this.model,
      temperature: this.temperature,
      response_format: { type: "json_object" as const },
      messages,
    };

    let res = await fetch(this.chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Simple model fallback if unsupported on this endpoint
    if (res.status === 400) {
      const fallbackBody = { ...body, model: "gpt-4o-mini" };
      res = await fetch(this.chatUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fallbackBody),
      });
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenAI HTTP ${res.status}: ${txt}`);
    }

    const data = (await res.json()) as any;
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("OpenAI returned empty content");
    return content;
  }
}

/* -------------------- Prompt Builders -------------------- */

function buildSystemPrompt(): string {
  // Keep this short and rule-focused; JSON mode enforces structure.
  return [
    "You generate objective, single-answer multiple-choice quizzes.",
    "Hard requirements:",
    "- EXACTLY 4 options per question.",
    '- EXACTLY one correct answer via "correctIndex" (0..3).',
    "- Provide a brief explanation (<= 240 chars).",
    '- IDs must be "q1".."qN" sequentially.',
    "- Options must be concise, unique, and non-empty.",
    "- No markdown, no commentary; output JSON ONLY.",
    "If any rule is violated, fix it yourself before responding.",
  ].join("\n");
}

function buildUserPrompt(input: QuizGenInput): string {
  const { topic, numQuestions, difficulty } = input;

  const jsonContract = {
    topic: "<string>",
    difficulty: '"easy" | "mixed" | "hard"',
    questions: [
      {
        id: "q1",
        question: "<string>",
        options: ["<string>", "<string>", "<string>", "<string>"],
        correctIndex: 0,
        explanation: "<string, <= 240 chars>",
      },
    ],
  };

  return [
    `Generate a quiz for: "${topic}"`,
    `Number of questions: ${numQuestions}`,
    `Difficulty: ${difficulty}`,
    "Return data that strictly matches this JSON contract (example, not a template):",
    JSON.stringify(jsonContract, null, 2),
    "Output JSON ONLY. Do not wrap in code fences.",
  ].join("\n");
}

/* -------------------- JSON Utilities -------------------- */

function safeParseJson(s: string): unknown {
  const content = stripCodeFences(s);
  const extracted = extractJsonBraces(content);
  return JSON.parse(extracted);
}

function stripCodeFences(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fence?.[1]?.trim() ?? s.trim();
}

function extractJsonBraces(s: string): string {
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first)
    return s.slice(first, last + 1).trim();
  return s; // let JSON.parse throw; caller will handle retry
}
