// client/src/components/QuizPlayer.tsx
import { useMemo, useState, useRef } from "react";
import type { Difficulty, GenerateQuizResponse } from "../lib/types";
import { generateQuiz } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

type LocalItem = {
  id: string; // stable id (we keep original question id across regenerations)
  prompt: string;
  options: { id: string; text: string }[]; // exactly 4
  correctOptionId: string;
  explanation: string;
};

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

export default function QuizPlayer({
  quiz,
  onSubmit,
}: {
  quiz: GenerateQuizResponse;
  onSubmit: (result: PlayResult) => void;
}) {
  const { toast } = useToast();

  // Normalize server payload to option-id based questions (stable per item)
  const initialItems = useMemo<LocalItem[]>(() => {
    return quiz.questions.map((q) => {
      const optionIds = ["A", "B", "C", "D"].map((k, i) => `${q.id}-${k}-${i}`);
      const options = q.options.map((text, i) => ({ id: optionIds[i], text }));
      return {
        id: q.id,
        prompt: q.question,
        options,
        correctOptionId: optionIds[q.correctIndex],
        explanation: q.explanation,
      };
    });
  }, [quiz]);

  const [items, setItems] = useState<LocalItem[]>(initialItems);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [regenLoading, setRegenLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef<HTMLDivElement | null>(null);

  const q = items[current];
  const total = items.length;
  const allAnswered = items.every((it) => !!answers[it.id]);

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
  };

  const prev = () => setCurrent((i) => Math.max(0, i - 1));
  const next = () => setCurrent((i) => Math.min(total - 1, i + 1));
  const jumpTo = (i: number) => setCurrent(i);

  async function regenerateCurrent() {
    try {
      setRegenLoading(true);
      const single = await generateQuiz({
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        numQuestions: 1,
      });

      const newQ = single.questions[0];
      const keepId = items[current].id;
      const optionIds = ["A", "B", "C", "D"].map(
        (k, i) => `${keepId}-${k}-${i}`
      );
      const replaced: LocalItem = {
        id: keepId,
        prompt: newQ.question,
        options: newQ.options.map((text, i) => ({ id: optionIds[i], text })),
        correctOptionId: optionIds[newQ.correctIndex],
        explanation: newQ.explanation,
      };

      setItems((prev) => {
        const nextArr = [...prev];
        nextArr[current] = replaced;
        return nextArr;
      });

      // Clear answer for the replaced question
      setAnswers((prev) => {
        const { [keepId]: _, ...rest } = prev;
        return rest;
      });

      toast({ title: "Question regenerated" });
    } catch (e: any) {
      toast({
        title: "Regenerate failed",
        description: String(e?.message || e),
        variant: "destructive",
      });
    } finally {
      setRegenLoading(false);
    }
  }

  function submit() {
    const result: PlayResult = {
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      total,
      score: 0,
      items: items.map((it) => {
        const selectedOptionId = answers[it.id];
        const correct = selectedOptionId === it.correctOptionId;
        return {
          id: it.id,
          prompt: it.prompt,
          options: it.options,
          selectedOptionId,
          correctOptionId: it.correctOptionId,
          correct,
          explanation: it.explanation,
        };
      }),
    };
    result.score = result.items.reduce(
      (acc, r) => acc + (r.correct ? 1 : 0),
      0
    );
    onSubmit(result);
  }

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div>
          Topic:{" "}
          <span className="font-medium text-foreground">{quiz.topic}</span> ·
          Difficulty: {quiz.difficulty}
        </div>
        <div>
          Question {current + 1} / {total}
        </div>
      </div>

      {/* Jump dots */}
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => {
          const answered = !!answers[it.id];
          const isActive = i === current;
          return (
            <button
              key={it.id}
              onClick={() => jumpTo(i)}
              className={[
                "h-3 w-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "ring-2 ring-ring" : "",
                answered ? "bg-primary" : "bg-muted",
              ].join(" ")}
              aria-label={`Go to question ${i + 1}${
                answered ? " (answered)" : ""
              }`}
              aria-current={isActive ? "step" : undefined}
            />
          );
        })}
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-6 grid gap-4">
          {/* Regeneration skeleton */}
          {regenLoading ? (
            <div aria-live="polite" className="grid gap-3 animate-pulse">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="grid gap-2">
                <div className="h-10 rounded border bg-muted" />
                <div className="h-10 rounded border bg-muted" />
                <div className="h-10 rounded border bg-muted" />
                <div className="h-10 rounded border bg-muted" />
              </div>
            </div>
          ) : (
            <>
              <div id="q-heading" className="text-lg font-medium">
                {q.prompt}
              </div>

              <RadioGroup
                role="radiogroup"
                aria-labelledby="q-heading"
                value={answers[q.id] ?? ""}
                onValueChange={handleSelect}
                className="grid gap-3"
              >
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring"
                  >
                    <RadioGroupItem id={opt.id} value={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={prev}
                disabled={current === 0 || regenLoading}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={next}
                disabled={current === total - 1 || regenLoading}
              >
                Next
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(true)}
                disabled={regenLoading}
                aria-haspopup="dialog"
                aria-expanded={showConfirm || undefined}
              >
                {regenLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Regenerating…
                  </span>
                ) : (
                  "Regenerate this question"
                )}
              </Button>
              <Button onClick={submit} disabled={!allAnswered || regenLoading}>
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm modal (Esc to cancel) */}
      {showConfirm && (
        <div
          ref={confirmRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="regen-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowConfirm(false);
          }}
          tabIndex={-1}
        >
          <div className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg">
            <h2 id="regen-title" className="mb-2 text-lg font-semibold">
              Regenerate this question?
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              We’ll replace the current question and clear your answer for it.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Cancel (Esc)
              </Button>
              <Button
                onClick={async () => {
                  setShowConfirm(false);
                  await regenerateCurrent();
                }}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
