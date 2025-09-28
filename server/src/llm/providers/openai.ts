// server/src/llm/providers/openai.ts
import type { LLMProvider } from "../adapter";
import type { GenerateQuizRequest, GenerateQuizResponse } from "../../schema";
import { GenerateQuizResponseSchema } from "../../schema";

/**
 * Minimal OpenAI chat call via fetch (Node 20+).
 * Expects the model to return STRICT JSON; we validate with Zod.
 */
export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private apiUrl = "https://api.openai.com/v1/chat/completions";
  private model = "gpt-4o-mini";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateQuiz(
    input: GenerateQuizRequest
  ): Promise<GenerateQuizResponse> {
    const { topic, numQuestions, difficulty } = input;

    const system = [
      "You generate single-answer multiple-choice quizzes.",
      "Rules:",
      "- Exactly 10-200 chars per explanation (brief).",
      "- Exactly 4 options; one and only one correct via index.",
      "- Output ONLY JSON matching the provided schema. No prose.",
    ].join("\n");

    const expectedShape = {
      topic: "string",
      difficulty: "easy|mixed|hard",
      questions: [
        {
          id: "string",
          question: "string",
          options: ["string", "string", "string", "string"],
          correctIndex: 0,
          explanation: "string",
        },
      ],
    };

    const user = [
      `Topic: ${topic}`,
      `Number of questions: ${numQuestions}`,
      `Difficulty: ${difficulty}`,
      "Return ONLY JSON of this exact shape (no markdown):",
      JSON.stringify(expectedShape, null, 2),
    ].join("\n");

    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature:
          difficulty === "easy" ? 0.2 : difficulty === "hard" ? 0.8 : 0.5,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenAI HTTP ${res.status}: ${txt}`);
    }

    const data = (await res.json()) as any;
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // try to extract JSON
    const jsonStr = extractJson(content);
    const parsed = JSON.parse(jsonStr);

    // Validate against our strict schema
    return GenerateQuizResponseSchema.parse(parsed);
  }
}

function extractJson(s: string): string {
  const match = s.match(/\{[\s\S]*\}$/);
  if (match) return match[0];
  // fallback: return as-is (will throw if not JSON)
  return s;
}
