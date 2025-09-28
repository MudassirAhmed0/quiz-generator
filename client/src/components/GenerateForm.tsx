// client/src/components/GenerateForm.tsx
import { useState } from "react";
import type { Difficulty, GenerateQuizResponse } from "../lib/types";
import { generateQuiz } from "../lib/api";
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

export default function GenerateForm({
  onStart,
}: {
  onStart: (quiz: GenerateQuizResponse) => void;
}) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const { toast } = useToast();

  const mut = useMutation({
    mutationFn: () =>
      generateQuiz({
        topic: topic.trim(),
        difficulty,
        numQuestions,
      }),
    onSuccess: (data) => onStart(data),
    onError: (err: any) =>
      toast({
        title: "Failed to generate quiz",
        description: String(err?.message || "Please try again."),
        variant: "destructive",
      }),
  });

  const trimmed = topic.trim();
  const canSubmit =
    trimmed.length >= 2 && trimmed.length <= 80 && !mut.isPending;

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mut.mutate();
      }}
    >
      {/* Topic */}
      <div className="grid gap-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          placeholder="e.g., React, Frontend, Nature"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={(e) => setTopic(e.target.value.trim())}
          minLength={2}
          maxLength={80}
          aria-invalid={
            trimmed.length > 0 && trimmed.length < 2 ? true : undefined
          }
          aria-describedby="topic-help"
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) {
              e.preventDefault();
              mut.mutate();
            }
          }}
        />
        <p id="topic-help" className="text-xs text-muted-foreground">
          2–80 characters. Examples: “frontend”, “nature”, “aerospace”.
        </p>
      </div>

      {/* Difficulty */}
      <div className="grid gap-2">
        <Label>Difficulty</Label>
        <RadioGroup
          role="radiogroup"
          aria-label="Select difficulty"
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as Difficulty)}
          className="grid gap-3 sm:grid-cols-3"
        >
          <div className="flex items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring">
            <RadioGroupItem id="dif-easy" value="easy" />
            <Label htmlFor="dif-easy" className="cursor-pointer">
              easy
            </Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring">
            <RadioGroupItem id="dif-mixed" value="mixed" />
            <Label htmlFor="dif-mixed" className="cursor-pointer">
              mixed
            </Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring">
            <RadioGroupItem id="dif-hard" value="hard" />
            <Label htmlFor="dif-hard" className="cursor-pointer">
              hard
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Number of Questions */}
      <div className="grid gap-2">
        <Label htmlFor="numq">Number of Questions</Label>
        <Select
          value={String(numQuestions)}
          onValueChange={(v) => setNumQuestions(Number(v))}
        >
          <SelectTrigger id="numq">
            <SelectValue placeholder="Select count" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={!canSubmit} aria-busy={mut.isPending}>
          {mut.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating…
            </span>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </div>
    </form>
  );
}
