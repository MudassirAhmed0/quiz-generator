// client/src/components/QuizPlayer.tsx
import { useState } from "react";
import type { GenerateQuizResponse, UserAnswers } from "../lib/types";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";

export default function QuizPlayer({
  quiz,
  onFinish,
  onCancel,
}: {
  quiz: GenerateQuizResponse;
  onFinish: (answers: UserAnswers) => void;
  onCancel: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>(
    Array(quiz.questions.length).fill(-1)
  );

  const q = quiz.questions[index];
  const canNext = answers[index] !== -1;

  const next = () => {
    if (index < quiz.questions.length - 1) setIndex(index + 1);
    else onFinish(answers);
  };

  return (
    <div className="grid gap-4">
      <div className="text-sm text-muted-foreground">
        Topic: <span className="font-medium text-foreground">{quiz.topic}</span>{" "}
        · Difficulty: {quiz.difficulty} · Question {index + 1} /{" "}
        {quiz.questions.length}
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-4">
          <div className="text-lg font-medium">{q.question}</div>
          <RadioGroup
            value={answers[index] === -1 ? "" : String(answers[index])}
            onValueChange={(v) => {
              const next = [...answers];
              next[index] = Number(v);
              setAnswers(next);
            }}
            className="grid gap-3"
          >
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <RadioGroupItem value={String(i)} id={`q${index}-opt${i}`} />
                <Label htmlFor={`q${index}-opt${i}`}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={next} disabled={!canNext}>
              {index === quiz.questions.length - 1 ? "Submit" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
