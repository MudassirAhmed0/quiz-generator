// client/src/components/ResultCard.tsx
import type { GenerateQuizResponse, UserAnswers } from "../lib/types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function ResultCard({
  quiz,
  answers,
  score,
  onRestart,
}: {
  quiz: GenerateQuizResponse;
  answers: UserAnswers;
  score: number;
  onRestart: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">
          Score: {score} / {quiz.questions.length}
        </div>
        <Button onClick={onRestart}>Create New Quiz</Button>
      </div>

      <div className="grid gap-4">
        {quiz.questions.map((q, i) => {
          const chosen = answers[i];
          const correct = q.correctIndex;
          const isCorrect = chosen === correct;
          return (
            <Card key={q.id}>
              <CardContent className="pt-6 grid gap-2">
                <div className="font-medium">
                  {i + 1}. {q.question}
                </div>
                <ul className="ml-4 list-disc text-sm">
                  {q.options.map((opt, idx) => (
                    <li
                      key={idx}
                      className={
                        isCorrect && idx === correct
                          ? "text-green-600"
                          : idx === chosen && idx !== correct
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-muted-foreground">
                  Explanation: {q.explanation}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
