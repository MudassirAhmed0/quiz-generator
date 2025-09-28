// server/src/routes/generate.ts
import { Router } from "express";
import { asyncHandler, ApiError } from "../utils/error";
import {
  GenerateQuizRequestSchema,
  GenerateQuizResponseSchema,
} from "../schema";
import { getLLMProvider } from "../llm/adapter";

const router: ReturnType<typeof Router> = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = GenerateQuizRequestSchema.parse(req.body);

    const provider = getLLMProvider();
    const raw = await provider.generateQuiz(input);

    // Enforce strict response schema
    const quiz = GenerateQuizResponseSchema.parse(raw);

    // Ensure 4 options & exactly one correct (by index 0..3)
    const invalid = quiz.questions.find(
      (q) => q.options.length !== 4 || q.correctIndex < 0 || q.correctIndex > 3
    );
    if (invalid)
      throw new ApiError(500, "Provider returned invalid question formatting");

    res.json(quiz);
  })
);

export default router;
