// server/src/llm/providers/openai.ts
import type { LLMProvider, QuizGenInput } from "../adapter";
import type { GenerateQuizResponse } from "../../schema";
import { GenerateQuizResponseSchema } from "../../schema";

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

/** ------------------ Exported prompts ------------------ */
export const SYSTEM_PROMPT = [
  "You are a professional quiz generator.",
  "Only use mainstream, non-controversial, and non-time-sensitive knowledge.",
  "Create single-correct multiple-choice questions (MCQs) only.",
  "Each question MUST have exactly 4 options and a concise explanation.",
  'If the topic is unsafe, controversial, too niche, or time-sensitive, return zero items and include a brief "warning" string in the JSON.',
  "Output VALID JSON only. No markdown. No code fences.",
].join("\n");

export function renderPrompt(input: QuizGenInput): string {
  const { topic, numQuestions, difficulty } = input;

  const schemaInline = `{
  "topic": "string",
  "difficulty": "easy|mixed|hard",
  "questions": [
    {
      "id": "string",
      "type": "mcq_single",
      "prompt": "string",
      "options": [
        { "id": "string", "text": "string" },
        { "id": "string", "text": "string" },
        { "id": "string", "text": "string" },
        { "id": "string", "text": "string" }
      ],
      "answer": ["optionIdExactlyOne"],
      "explanation": "string",
      "difficulty": "easy|medium|hard",
      "points": 1
    }
  ],
  "warning": "string (optional)"
}`;

  return [
    `Generate a quiz for the topic: "${topic}".`,
    `Number of questions: ${numQuestions}.`,
    `Overall difficulty: ${difficulty}.`,
    "",
    "Difficulty rules:",
    "- easy: focus on definitions and foundational facts.",
    "- mixed: blend easy/medium/hard with a natural distribution.",
    "- hard: emphasize applied reasoning and edge cases (still mainstream).",
    "",
    "JSON schema (inline):",
    schemaInline,
    "",
    "Rules:",
    "- Output VALID JSON only. No markdown. No code fences.",
    "- Avoid ambiguous wording; no trick questions; no overlapping options.",
    "- Each question has exactly 4 options and exactly one correct answer (answer array contains exactly one optionId).",
    "- Keep explanations ≤ 2 lines.",
    '- If topic is unsafe/too niche/time-sensitive, return an empty "questions" array and set a brief "warning".',
  ].join("\n");
}
/** ------------------------------------------------------ */

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model = "gpt-4.1-mini";
  private chatUrl = "https://api.openai.com/v1/chat/completions";
  private temperature = 0.7;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuiz(input: QuizGenInput): Promise<GenerateQuizResponse> {
    const messagesBase: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: renderPrompt(input) },
    ];

    try {
      const json = await this.callJsonMode(messagesBase);
      const parsed = safeParseJson(json);
      const validated = GenerateQuizResponseSchema.parse(parsed);
      if (validated.questions.length !== input.numQuestions) {
        validated.questions = validated.questions.slice(0, input.numQuestions);
      }
      return validated;
    } catch {
      const retry: ChatMessage[] = [
        ...messagesBase,
        {
          role: "user",
          content:
            "You returned invalid JSON previously. Respond again with ONLY valid JSON matching the schema. No backticks, no markdown, no commentary.",
        },
      ];
      const json2 = await this.callJsonMode(retry);
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

/* -------------------- JSON Utilities -------------------- */

function safeParseJson(s: string): unknown {
  const content = stripCodeFences(s);
  const extracted = extractJsonBraces(content);
  return JSON.parse(extracted);
}

function stripCodeFences(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence && fence[1]) return fence[1].trim();
  return s.trim();
}

function extractJsonBraces(s: string): string {
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first)
    return s.slice(first, last + 1).trim();
  return s; // let JSON.parse throw
}
