// client/src/components/GenerateForm.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateQuizApi } from "../lib/api";
import type { Difficulty, GenerateQuizResponse } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast.tsx";
import { Label } from "./ui/label";

export default function GenerateForm({
  onStart,
}: {
  onStart: (quiz: GenerateQuizResponse) => void;
}) {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const { toast } = useToast();

  const mut = useMutation({
    mutationFn: () =>
      generateQuizApi({ topic: topic.trim(), numQuestions, difficulty }),
    onSuccess: (data) => onStart(data),
    onError: (err: any) =>
      toast({
        title: "Failed to generate",
        description: String(err?.message || err),
        variant: "destructive",
      }),
  });

  const canSubmit =
    topic.trim().length >= 2 && topic.trim().length <= 80 && !mut.isPending;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        mut.mutate();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          placeholder="e.g., React, Frontend, Nature"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="numQuestions">Number of Questions</Label>
          <Input
            id="numQuestions"
            type="number"
            min={1}
            max={20}
            value={numQuestions}
            onChange={(e) =>
              setNumQuestions(
                Math.max(1, Math.min(20, Number(e.target.value || 10)))
              )
            }
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label>Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">easy</SelectItem>
              <SelectItem value="mixed">mixed</SelectItem>
              <SelectItem value="hard">hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {mut.isPending ? "Generating..." : "Generate Quiz"}
      </Button>
    </form>
  );
}
