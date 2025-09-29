// client/src/lib/api.ts
import { z } from "zod";
import type { Difficulty, GenerateQuizResponse, ApiError } from "./types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ""
  ) || "/api";

// ---- Zod response validation (mirrors server) ----
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

// ---- tiny fetch helper that throws {code,message} on non-2xx ----
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const parseJson = async () => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  if (!res.ok) {
    const data = (await parseJson()) as { error?: ApiError } | null;
    const err: ApiError = {
      code: data?.error?.code || `HTTP_${res.status}`,
      message: data?.error?.message || res.statusText || "Request failed",
    };
    throw err;
  }

  const data = await parseJson();
  return data as T;
}

// ---- API ----
export async function generateQuiz(input: {
  topic: string;
  numQuestions?: number;
  difficulty?: Difficulty;
}): Promise<GenerateQuizResponse> {
  const body = {
    topic: input.topic?.trim(),
    numQuestions: input.numQuestions ?? 10,
    difficulty: input.difficulty ?? "mixed",
  };

  const json = await http<unknown>("/generate-quiz", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return GenerateQuizResponseSchema.parse(json) as GenerateQuizResponse;
}

// Back-compat alias (if earlier code imported generateQuizApi)
export const generateQuizApi = generateQuiz;
