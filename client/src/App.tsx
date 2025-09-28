// client/src/App.tsx
import { useState } from "react";
import type { GenerateQuizResponse, UserAnswers } from "./lib/types";
import GenerateForm from "./components/GenerateForm";
import QuizPlayer from "./components/QuizPlayer";
import ResultCard from "./components/ResultCard";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

type Mode = "idle" | "playing" | "result";

export default function App() {
  const [mode, setMode] = useState<Mode>("idle");
  const [quiz, setQuiz] = useState<GenerateQuizResponse | null>(null);
  const [answers, setAnswers] = useState<UserAnswers>([]);
  const [score, setScore] = useState(0);

  const startQuiz = (q: GenerateQuizResponse) => {
    setQuiz(q);
    setAnswers([]);
    setScore(0);
    setMode("playing");
  };

  const finishQuiz = (a: UserAnswers) => {
    if (!quiz) return;
    const s = a.reduce(
      (acc, idx, i) => acc + (idx === quiz.questions[i].correctIndex ? 1 : 0),
      0
    );
    setAnswers(a);
    setScore(s);
    setMode("result");
  };

  const restart = () => {
    setMode("idle");
    setQuiz(null);
    setAnswers([]);
    setScore(0);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container">
        <Card>
          <CardHeader>
            <CardTitle>AI Quiz Generator</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "idle" && <GenerateForm onStart={startQuiz} />}
            {mode === "playing" && quiz && (
              <QuizPlayer
                quiz={quiz}
                onFinish={finishQuiz}
                onCancel={restart}
              />
            )}
            {mode === "result" && quiz && (
              <ResultCard
                quiz={quiz}
                answers={answers}
                score={score}
                onRestart={restart}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
