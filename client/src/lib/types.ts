// client/src/lib/types.ts
export type Difficulty = "easy" | "mixed" | "hard";

export type QuizQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string]; // exactly 4 options
  correctIndex: 0 | 1 | 2 | 3; // exactly one correct index
  explanation: string; // brief (<= 240 chars on server)
};

export type GenerateQuizResponse = {
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
};

export type ApiError = { code: string; message: string };
