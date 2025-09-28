// client/src/lib/api.ts
import { z } from "zod";
import type { GenerateQuizResponse, Difficulty } from "./types";

const DifficultySchema = z.enum(["easy", "mixed", "hard"]);
const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(240),
});
const GenerateQuizResponseSchema = z.object({
  topic: z.string().min(1),
  difficulty: DifficultySchema,
  questions: z.array(QuizQuestionSchema).min(1),
});

export async function generateQuizApi(input: {
  topic: string;
  numQuestions?: number;
  difficulty?: Difficulty;
}): Promise<GenerateQuizResponse> {
  const res = await fetch("/api/generate-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      numQuestions: input.numQuestions ?? 10,
      difficulty: input.difficulty ?? "mixed",
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg =
      (data?.error && (data.error.message || data.error.code)) ||
      res.statusText;
    throw new Error(msg || "Request failed");
  }
  const json = await res.json();
  return GenerateQuizResponseSchema.parse(json);
}
