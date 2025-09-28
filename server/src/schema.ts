// server/src/schema.ts
import { z } from "zod";

export const DifficultySchema = z.enum(["easy", "mixed", "hard"]);

export const GenerateQuizRequestSchema = z.object({
  topic: z.string().min(1, "topic is required").max(120),
  numQuestions: z.number().int().min(1).max(20).default(10),
  difficulty: DifficultySchema.default("mixed"),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4, "exactly 4 options required"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z
    .string()
    .min(1)
    .max(240, "brief explanation only (<=240 chars)"),
});

export const GenerateQuizResponseSchema = z.object({
  topic: z.string().min(1),
  difficulty: DifficultySchema,
  questions: z.array(QuizQuestionSchema).min(1),
});

export type GenerateQuizRequest = z.infer<typeof GenerateQuizRequestSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type GenerateQuizResponse = z.infer<typeof GenerateQuizResponseSchema>;
