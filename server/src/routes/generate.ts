// server/src/routes/generate.ts
import { Router } from "express";
import { z, ZodError } from "zod";
import { asyncHandler, ApiError } from "../utils/error";
import { generateQuiz, QuizGenInput } from "../llm/adapter";
import { GenerateQuizResponseSchema } from "../schema";

const BodySchema = z.object({
  topic: z
    .string()
    .min(2, "topic must be at least 2 characters")
    .max(80, "topic must be at most 80 characters")
    .transform((s) => s.trim()),
  numQuestions: z.number().int().min(1).max(20).default(10),
  difficulty: z.enum(["easy", "mixed", "hard"]).default("mixed"),
});

const router: ReturnType<typeof Router> = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const parsed = BodySchema.parse(req.body);
      const input: QuizGenInput = {
        topic: parsed.topic,
        numQuestions: parsed.numQuestions,
        difficulty: parsed.difficulty,
      };

      const raw = await generateQuiz(input);
      const quiz = GenerateQuizResponseSchema.parse(raw);

      return res.status(200).json(quiz);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid request payload" },
        });
      }
      if (err instanceof ApiError) {
        const status = err.status || 500;
        const code =
          status === 400
            ? "BAD_REQUEST"
            : status === 429
            ? "RATE_LIMITED"
            : "INTERNAL_SERVER_ERROR";
        return res.status(status).json({
          error: { code, message: err.message || "Request failed" },
        });
      }
      // Unknown error -> let central handler shape it consistently
      throw err;
    }
  })
);

export default router;
