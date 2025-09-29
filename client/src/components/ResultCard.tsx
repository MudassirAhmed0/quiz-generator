// client/src/components/ResultCard.tsx
import type { Difficulty, GenerateQuizResponse } from "../lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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

export default function ResultCard({
  quiz,
  result,
  onRestart,
  onRegenerateAll,
  onChangeDifficulty,
}: {
  quiz: GenerateQuizResponse;
  result: PlayResult;
  onRestart: () => void;
  /** Optional: parent can hook a full-regenerate action */
  onRegenerateAll?: () => void;
  /** Optional: parent can open difficulty selector */
  onChangeDifficulty?: () => void;
}) {
  const pct = Math.round((result.score / result.total) * 100);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {result.score}/{result.total}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Topic:{" "}
            <span className="text-foreground font-medium">{quiz.topic}</span> ·
            Difficulty: {quiz.difficulty}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRestart}>Try another topic</Button>
            <Button
              variant="secondary"
              onClick={onRegenerateAll ?? onRestart}
              title="Generate a new quiz with the same topic & difficulty"
            >
              Regenerate full quiz
            </Button>
            <Button
              variant="outline"
              onClick={onChangeDifficulty ?? onRestart}
              title="Change difficulty and create a new quiz"
            >
              Change difficulty
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results list as simple accordion (details/summary) */}
      <div className="grid gap-3">
        {result.items.map((item, idx) => {
          // const sel = item.options.find((o) => o.id === item.selectedOptionId);
          // const cor = item.options.find((o) => o.id === item.correctOptionId);
          const isCorrect = item.correct;
          return (
            <details
              key={item.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
              open={idx < 2} // open first couple by default
            >
              <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isCorrect
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {isCorrect ? "✓" : "✕"}
                  </span>
                  <span className="font-medium">
                    {idx + 1}. {item.prompt}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click to expand
                </span>
              </summary>

              <div className="px-4 pb-4 pt-0 space-y-2 text-sm">
                <ul className="ml-5 list-disc space-y-1">
                  {item.options.map((o) => {
                    const isSel = o.id === item.selectedOptionId;
                    const isCor = o.id === item.correctOptionId;
                    return (
                      <li
                        key={o.id}
                        className={[
                          isCor ? "text-green-700 dark:text-green-400" : "",
                          isSel && !isCor
                            ? "text-red-700 dark:text-red-400"
                            : "",
                        ].join(" ")}
                      >
                        {o.text}{" "}
                        {isCor ? (
                          <span className="ml-1 text-xs">(correct)</span>
                        ) : null}
                        {isSel ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (your answer)
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Explanation:
                  </span>{" "}
                  {item.explanation}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
