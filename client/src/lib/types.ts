// client/src/lib/types.ts
export type Difficulty = "easy" | "mixed" | "hard";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0..3
  explanation: string; // brief
};

export type GenerateQuizResponse = {
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
};

export type UserAnswers = number[]; // index per question (0..3)
