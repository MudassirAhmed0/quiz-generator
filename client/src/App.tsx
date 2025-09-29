// client/src/App.tsx
import { useState } from "react";
import GenerateForm from "./components/GenerateForm";
import QuizPlayer from "./components/QuizPlayer";
import ResultCard from "./components/ResultCard";
import type { Difficulty, GenerateQuizResponse } from "./lib/types";

type View = "idle" | "playing" | "result";

type PlayResult = {
  topic: string;
  difficulty: Difficulty;
  total: number;
  score: number;
  items: Array<{
    id: string;
    prompt: string;
    options: { id: string; text: string }[];
    selectedOptionId: string;
    correctOptionId: string;
    correct: boolean;
    explanation: string;
  }>;
};

export default function App() {
  const [view, setView] = useState<View>("idle");
  const [quizData, setQuizData] = useState<GenerateQuizResponse | null>(null);
  const [result, setResult] = useState<PlayResult | null>(null);

  const handleStart = (quiz: GenerateQuizResponse) => {
    setQuizData(quiz);
    setResult(null);
    setView("playing");
  };

  const handleSubmit = (r: PlayResult) => {
    setResult(r);
    setView("result");
  };

  const handleRestart = () => {
    setQuizData(null);
    setResult(null);
    setView("idle");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="mb-6 text-2xl font-bold">AI Quiz Generator</h1>

          {view === "idle" && <GenerateForm onStart={handleStart} />}

          {view === "playing" && quizData && (
            <QuizPlayer quiz={quizData} onSubmit={handleSubmit} />
          )}

          {view === "result" && quizData && result && (
            <ResultCard
              quiz={quizData}
              result={result}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
    </div>
  );
}
